import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { type Profile, type ProfileProgress, generateId } from '../data/profiles';
import {
  ProfileContext,
  type ProfilesData,
  defaultProgress,
} from './ProfileContextDefinition';

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProfilesData>(() => {
    const saved = localStorage.getItem('chess-kids-profiles');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      profiles: [],
      currentProfileId: null,
      progress: {},
    };
  });

  useEffect(() => {
    localStorage.setItem('chess-kids-profiles', JSON.stringify(data));
  }, [data]);

  const currentProfile = useMemo(() => {
    return data.profiles.find(p => p.id === data.currentProfileId) || null;
  }, [data.profiles, data.currentProfileId]);

  const currentProgress = data.currentProfileId 
    ? (data.progress[data.currentProfileId] || defaultProgress)
    : defaultProgress;

  const createProfile = (name: string, avatar: string): Profile => {
    const newProfile: Profile = {
      id: generateId(),
      name,
      avatar,
      createdAt: Date.now(),
    };

    setData(prev => ({
      ...prev,
      profiles: [...prev.profiles, newProfile],
      currentProfileId: newProfile.id,
      progress: {
        ...prev.progress,
        [newProfile.id]: { ...defaultProgress },
      },
    }));

    return newProfile;
  };

  const selectProfile = (profileId: string) => {
    setData(prev => ({
      ...prev,
      currentProfileId: profileId,
    }));
  };

  const deleteProfile = (profileId: string) => {
    setData(prev => {
      const newProgress = { ...prev.progress };
      delete newProgress[profileId];
      
      return {
        profiles: prev.profiles.filter(p => p.id !== profileId),
        currentProfileId: prev.currentProfileId === profileId ? null : prev.currentProfileId,
        progress: newProgress,
      };
    });
  };

  const updateProgress = (progress: Partial<ProfileProgress>) => {
    if (!data.currentProfileId) return;

    setData(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        [prev.currentProfileId!]: {
          ...prev.progress[prev.currentProfileId!],
          ...progress,
        },
      },
    }));
  };

  const addStars = (count: number) => {
    updateProgress({ stars: currentProgress.stars + count });
  };

  const completeLesson = (lessonId: number) => {
    if (!currentProgress.completedLessons.includes(lessonId)) {
      updateProgress({
        completedLessons: [...currentProgress.completedLessons, lessonId],
      });
    }
  };

  const resetProgress = () => {
    updateProgress({ ...defaultProgress });
  };

  return (
    <ProfileContext.Provider
      value={{
        profiles: data.profiles,
        currentProfile,
        currentProgress,
        createProfile,
        selectProfile,
        deleteProfile,
        updateProgress,
        addStars,
        completeLesson,
        resetProgress,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

