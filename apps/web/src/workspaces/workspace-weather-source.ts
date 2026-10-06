import {
  createEmptyRuntimeBindingProfile,
  normalizeWorkspaceBindingOrigin,
  type HomeProjectRecord,
  type WeatherSource,
} from "@cabane/engine";

/** Save a viewing source without publishing any unrelated editor work. */
export function updateWorkspaceWeatherSource(
  record: HomeProjectRecord,
  origin: string,
  weatherSource: WeatherSource,
): HomeProjectRecord {
  const key = normalizeWorkspaceBindingOrigin(origin);
  const state = record.bindings[key] ?? {
    draft: createEmptyRuntimeBindingProfile(record.homeId),
    published: createEmptyRuntimeBindingProfile(record.homeId),
    manualRoomIds: [],
    manualSlotIds: [],
  };
  return {
    ...record,
    bindings: {
      ...record.bindings,
      [key]: {
        ...state,
        draft: { ...state.draft, weatherSource },
        published: { ...state.published, weatherSource },
      },
    },
  };
}
