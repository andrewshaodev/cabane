import {
  getAuth,
  type Auth
} from "home-assistant-js-websocket";

import { HomeAssistantRuntimeClient } from "./home-assistant-runtime-client";

interface CallbackAuthAttempt {
  client: HomeAssistantRuntimeClient;
  hassUrl: string;
  clientId: string;
  redirectUrl: string | undefined;
  promise: Promise<Auth>;
  generation: string | null;
  saveTokens: NonNullable<Parameters<typeof getAuth>[0]>["saveTokens"];
}

let callbackAuthAttempt: CallbackAuthAttempt | null = null;

export const getCallbackAuthOnce = (
  client: HomeAssistantRuntimeClient,
  hassUrl: string,
  clientId: string,
  options: NonNullable<Parameters<typeof getAuth>[0]>,
  generation: string | null = null,
) => {
  if (
    callbackAuthAttempt?.client === client
    && callbackAuthAttempt.hassUrl === hassUrl
    && callbackAuthAttempt.clientId === clientId
    && callbackAuthAttempt.redirectUrl === options.redirectUrl
    && callbackAuthAttempt.generation === generation
  ) {
    // Strict Mode replays ownership while retaining one callback exchange.
    callbackAuthAttempt.saveTokens = options.saveTokens;
    return callbackAuthAttempt.promise;
  }

  const attempt: CallbackAuthAttempt = {
    client,
    hassUrl,
    clientId,
    redirectUrl: options.redirectUrl,
    generation,
    saveTokens: options.saveTokens,
    promise: Promise.resolve().then(() => client.getAuth({
      ...options,
      saveTokens: (tokens) => attempt.saveTokens?.(tokens),
    })),
  };
  callbackAuthAttempt = attempt;
  const release = () => {
    globalThis.setTimeout(() => {
      if (callbackAuthAttempt === attempt) callbackAuthAttempt = null;
    }, 0);
  };
  void attempt.promise.then(release, release);
  return attempt.promise;
};
