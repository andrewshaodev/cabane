import {
  callService as callHomeAssistantService,
  createConnection,
  getAuth,
  subscribeEntities
} from "home-assistant-js-websocket";

export interface HomeAssistantRuntimeClient {
  getAuth: typeof getAuth;
  createConnection: typeof createConnection;
  subscribeEntities: typeof subscribeEntities;
  callService: typeof callHomeAssistantService;
}

export const DEFAULT_CLIENT: HomeAssistantRuntimeClient = {
  getAuth,
  createConnection,
  subscribeEntities,
  callService: callHomeAssistantService,
};
