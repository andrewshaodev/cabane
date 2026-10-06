export interface HomeAssistantCameraMessage {
  type: string;
  [key: string]: unknown;
}

export interface HomeAssistantCameraClient {
  sendMessagePromise: <T>(message: HomeAssistantCameraMessage) => Promise<T>;
  subscribeMessage: <T>(
    callback: (message: T) => void,
    message: HomeAssistantCameraMessage,
    options?: { resubscribe?: boolean },
  ) => Promise<() => void | Promise<void>>;
}
