import { useCallback, useEffect, useState } from "react";
import {
  createEmptyRuntimeBindingProfile,
  loadRuntimeBindingProfile,
  runtimeBindingProfileStorageKey,
  saveRuntimeBindingProfile,
} from "./runtime-binding-profile";
import type {
  HomeAssistantRuntimeSnapshot,
  HomeManifest,
  RuntimeBindingProfile,
} from "./types";

export interface RuntimeBindingProfileManager {
  profile: RuntimeBindingProfile;
  loaded: boolean;
  hasStoredProfile: boolean;
  save: (next: RuntimeBindingProfile) => void;
}

export const useRuntimeBindingProfile = (
  manifest: HomeManifest,
  runtime: HomeAssistantRuntimeSnapshot,
  controlled?: RuntimeBindingProfileManager,
): RuntimeBindingProfileManager => {
  const [profile, setProfile] = useState(() => createEmptyRuntimeBindingProfile(manifest.home.id));
  const [loaded, setLoaded] = useState(false);
  const [hasStoredProfile, setHasStoredProfile] = useState(false);
  const origin = runtime.origin;
  const storageKey = origin ? runtimeBindingProfileStorageKey(origin, manifest.home.id) : null;

  useEffect(() => {
    if (controlled) return;
    const empty = createEmptyRuntimeBindingProfile(manifest.home.id);
    setLoaded(false);
    if (!origin || !storageKey || typeof window === "undefined") {
      setProfile(empty);
      setHasStoredProfile(false);
      setLoaded(true);
      return;
    }
    const stored = loadRuntimeBindingProfile(window.localStorage, origin, manifest);
    setProfile(stored ?? empty);
    setHasStoredProfile(Boolean(stored));
    setLoaded(true);
  }, [manifest, origin, storageKey, controlled]);

  const save = useCallback((next: RuntimeBindingProfile) => {
    setProfile(next);
    setHasStoredProfile(true);
    if (origin && typeof window !== "undefined") {
      saveRuntimeBindingProfile(window.localStorage, origin, next);
    }
  }, [origin]);

  return controlled ?? { profile, loaded, hasStoredProfile, save };
};
