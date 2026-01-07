import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { StorageService } from '../services/storageService';

interface UseProfileOptions {
  initialProfile: UserProfile | null;
  onUpdate?: (profile: UserProfile) => void;
  autoSaveDelay?: number;
}

export const useProfile = (
  initialProfile: UserProfile | null,
  options: UseProfileOptions = {}
) => {
  const { onUpdate, autoSaveDelay = 500 } = options;
  const [profile, setProfileState] = useState<UserProfile | null>(initialProfile);

  // Sauvegarde automatique avec debounce
  useEffect(() => {
    if (!profile) return;

    const timeoutId = setTimeout(() => {
      try {
        const updatedClients = StorageService.updateClient(profile);
        onUpdate?.(profile);
      } catch (error) {
        console.error("Erreur lors de la sauvegarde automatique:", error);
      }
    }, autoSaveDelay);

    return () => clearTimeout(timeoutId);
  }, [profile, autoSaveDelay, onUpdate]);

  const setProfile = useCallback((newProfile: UserProfile | null) => {
    setProfileState(newProfile);
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    if (!profile) return;
    setProfileState({ ...profile, ...updates });
  }, [profile]);

  return {
    profile,
    setProfile,
    updateProfile
  };
};





