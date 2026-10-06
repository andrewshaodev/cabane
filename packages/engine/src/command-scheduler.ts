import type { EntityId } from "./types";
import type { SupportedServiceCall } from "./home-assistant-controls";

export const VALUE_DEBOUNCE_MS = 500;
export const DEVICE_THROTTLE_MS = 2_000;

type TimerHandle = ReturnType<typeof globalThis.setTimeout>;

interface PendingWaiter {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

interface PendingValue {
  call: SupportedServiceCall;
  sequence: number;
  updatedAt: number;
  waiters: PendingWaiter[];
}

interface DeviceQueue {
  lastDispatchAt: number;
  pending: Map<string, PendingValue>;
  timer: TimerHandle | null;
}

export interface DeviceCommandSchedulerOptions {
  dispatch: (call: SupportedServiceCall) => Promise<unknown>;
  resolveDeviceKey: (entityId: EntityId) => string;
  debounceMs?: number;
  throttleMs?: number;
  now?: () => number;
  setTimer?: (callback: () => void, delayMs: number) => TimerHandle;
  clearTimer?: (timer: TimerHandle) => void;
}

export class DeviceCommandScheduler {
  private readonly dispatch: DeviceCommandSchedulerOptions["dispatch"];
  private readonly resolveDeviceKey: DeviceCommandSchedulerOptions["resolveDeviceKey"];
  private readonly debounceMs: number;
  private readonly throttleMs: number;
  private readonly now: () => number;
  private readonly setTimer: NonNullable<DeviceCommandSchedulerOptions["setTimer"]>;
  private readonly clearTimer: NonNullable<DeviceCommandSchedulerOptions["clearTimer"]>;
  private readonly queues = new Map<string, DeviceQueue>();
  private nextSequence = 0;
  private disposed = false;

  constructor(options: DeviceCommandSchedulerOptions) {
    this.dispatch = options.dispatch;
    this.resolveDeviceKey = options.resolveDeviceKey;
    this.debounceMs = options.debounceMs ?? VALUE_DEBOUNCE_MS;
    this.throttleMs = options.throttleMs ?? DEVICE_THROTTLE_MS;
    this.now = options.now ?? Date.now;
    this.setTimer = options.setTimer
      ?? ((callback, delayMs) => globalThis.setTimeout(callback, delayMs));
    this.clearTimer = options.clearTimer
      ?? ((timer) => globalThis.clearTimeout(timer));
  }

  schedule(call: SupportedServiceCall): Promise<unknown> {
    if (this.disposed) return Promise.reject(new Error("The command scheduler is stopped."));
    const target = call.target.entity_id;
    const entityId = (Array.isArray(target) ? target[0] : target) as EntityId | undefined;
    if (!entityId) return Promise.reject(new Error("A service call requires an exact entity target."));
    const queue = this.queueFor(this.resolveDeviceKey(entityId));

    if (call.delivery?.mode !== "coalesced-value") {
      this.cancelQueue(queue);
      queue.lastDispatchAt = this.now();
      try {
        return this.dispatch(call);
      } catch (error) {
        return Promise.reject(error);
      }
    }

    const channelKey = `${entityId}:${call.delivery.channel}`;
    const existing = queue.pending.get(channelKey);
    const promise = new Promise<unknown>((resolve, reject) => {
      if (existing) {
        existing.call = call;
        existing.updatedAt = this.now();
        existing.waiters.push({ resolve, reject });
      } else {
        queue.pending.set(channelKey, {
          call,
          sequence: this.nextSequence++,
          updatedAt: this.now(),
          waiters: [{ resolve, reject }],
        });
      }
    });
    this.scheduleNext(queue);
    return promise;
  }

  cancelPendingValues(): void {
    for (const queue of this.queues.values()) this.cancelQueue(queue);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.cancelPendingValues();
    this.queues.clear();
  }

  private queueFor(key: string) {
    const existing = this.queues.get(key);
    if (existing) return existing;
    const queue: DeviceQueue = {
      lastDispatchAt: Number.NEGATIVE_INFINITY,
      pending: new Map(),
      timer: null,
    };
    this.queues.set(key, queue);
    return queue;
  }

  private cancelQueue(queue: DeviceQueue) {
    if (queue.timer !== null) this.clearTimer(queue.timer);
    queue.timer = null;
    for (const pending of queue.pending.values()) {
      for (const waiter of pending.waiters) waiter.resolve(undefined);
    }
    queue.pending.clear();
  }

  private scheduleNext(queue: DeviceQueue) {
    if (queue.timer !== null) this.clearTimer(queue.timer);
    queue.timer = null;
    const next = [...queue.pending.values()].sort((left, right) => left.sequence - right.sequence)[0];
    if (!next) return;
    const dueAt = Math.max(
      queue.lastDispatchAt + this.throttleMs,
      next.updatedAt + this.debounceMs,
    );
    queue.timer = this.setTimer(() => {
      queue.timer = null;
      void this.flushNext(queue);
    }, Math.max(0, dueAt - this.now()));
  }

  private async flushNext(queue: DeviceQueue) {
    if (this.disposed) return;
    const next = [...queue.pending.entries()].sort(
      ([, left], [, right]) => left.sequence - right.sequence,
    )[0];
    if (!next) return;
    const [key, pending] = next;
    queue.pending.delete(key);
    queue.lastDispatchAt = this.now();
    this.scheduleNext(queue);
    try {
      const result = await this.dispatch(pending.call);
      for (const waiter of pending.waiters) waiter.resolve(result);
    } catch (error) {
      for (const waiter of pending.waiters) waiter.reject(error);
    }
  }
}
