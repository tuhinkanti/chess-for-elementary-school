import { createContext } from 'react';
import { type Profile, type ProfileProgress } from '../data/profiles';

export interface ProfilesData {
  profiles: Profile[];
  currentProfileId: string | null;
  progress: Record<string, ProfileProgress>;
}

export interface ProfileContextType {
  profiles: Profile[];
  currentProfile: Profile | null;
  currentProgress: ProfileProgress;
  createProfile: (name: string, avatar: string) => Profile;
  selectProfile: (profileId: string) => void;
  deleteProfile: (profileId: string) => void;
  updateProgress: (progress: Partial<ProfileProgress>) => void;
  addStars: (count: number) => void;
  completeLesson: (lessonId: number) => void;
  resetProgress: () => void;
}

export const defaultProgress: ProfileProgress = {
  stars: 0,
  completedLessons: [],
  currentLesson: 1,
};

export const ProfileContext = createContext<ProfileContextType | undefined>(undefined);
