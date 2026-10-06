import { useCallback, useEffect, useRef, useState } from "react";
import type { ReferencePlans, ReferencePreference } from "./reference-plan";
import {
  cleanReferenceAssets,
  readReferenceAsset,
  readReferences,
  writeReferences,
} from "./reference-storage";

export function useReferencePersistence(
  homeId: string,
  plans: ReferencePlans | undefined,
  initialize: (plans: ReferencePlans) => ReferencePlans,
) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<Record<string, ReferencePreference>>({});
  const assets = useRef(new Map<string, Blob>());
  const pendingAssets = useRef(new Map<string, Blob>());
  const queue = useRef(Promise.resolve());
  const failed = useRef(false);
  const current = useRef({ plans, preferences });
  current.current = { plans, preferences };
  const alive = useRef(true);
  const loadGeneration = useRef(0);
  const load = useCallback(async () => {
    const generation = ++loadGeneration.current;
    try {
      const stored = await readReferences(homeId);
      if (!alive.current || generation !== loadGeneration.current) return;
      setPreferences(stored.preferences);
      const retained = initialize(stored.plans);
      // A reload ends the old undo timeline. Collect assets left by cancelled
      // imports or removed floors even if the previous tab closed abruptly.
      queue.current = queue.current
        .then(async () => {
          await writeReferences(
            homeId,
            { plans: retained, preferences: stored.preferences },
            new Map(),
          );
          await cleanReferenceAssets(
            homeId,
            Object.values(retained).map((plan) => plan.assetId),
          );
        })
        .catch(() => undefined);
      setReady(true);
      setError(null);
    } catch {
      if (alive.current && generation === loadGeneration.current)
        setError(
          "Reference plans could not be loaded from this browser. Retry to use your saved plans.",
        );
    }
  }, [homeId, initialize]);
  useEffect(() => {
    alive.current = true;
    void load();
    return () => {
      alive.current = false;
      loadGeneration.current++;
    };
  }, [load]);
  const save = useCallback(() => {
    const value = current.current;
    if (!value.plans) return;
    const capturedAssets = new Map(pendingAssets.current);
    queue.current = queue.current
      .catch(() => undefined)
      .then(async () => {
        await writeReferences(
          homeId,
          { plans: value.plans!, preferences: value.preferences },
          capturedAssets,
        );
        for (const [id, blob] of capturedAssets)
          if (pendingAssets.current.get(id) === blob) pendingAssets.current.delete(id);
        failed.current = false;
        if (alive.current) setError(null);
      })
      .catch(() => {
        failed.current = true;
        if (alive.current)
          setError(
            "The reference plan could not be saved in this browser. Free some storage, then Retry. Keep this editor open to retain your changes.",
          );
      });
  }, [homeId]);
  const serialized = JSON.stringify({ plans, preferences });
  useEffect(() => {
    if (ready) save();
  }, [serialized, ready, save]);
  const getAsset = useCallback(
    async (id: string) => {
      const cached = assets.current.get(id);
      if (cached) return cached;
      const blob = await readReferenceAsset(homeId, id);
      if (!blob)
        throw new Error(
          "The saved reference image is missing. Replace the image to continue tracing.",
        );
      assets.current.set(id, blob);
      return blob;
    },
    [homeId],
  );
  const addAsset = useCallback((id: string, blob: Blob) => {
    assets.current.set(id, blob);
    pendingAssets.current.set(id, blob);
  }, []);
  const setPreference = useCallback(
    (floorId: string, preference: ReferencePreference) =>
      setPreferences((previous) => ({ ...previous, [floorId]: preference })),
    [],
  );
  const cleanup = useCallback(
    (retained: ReferencePlans) => {
      queue.current = queue.current
        .then(async () => {
          if (failed.current) return;
          const preferences = Object.fromEntries(
            Object.entries(current.current.preferences).filter(([id]) => id in retained),
          );
          await writeReferences(homeId, { plans: retained, preferences }, new Map());
          await cleanReferenceAssets(
            homeId,
            Object.values(retained).map((plan) => plan.assetId),
          );
        })
        .catch(() => undefined);
    },
    [homeId],
  );
  return {
    ready,
    error,
    preferences,
    getAsset,
    addAsset,
    setPreference,
    cleanup,
    retry: () => {
      if (ready) save();
      else void load();
    },
  };
}
