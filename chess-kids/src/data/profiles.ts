export interface Profile {
  id: string;
  name: string;
  avatar: string;
  createdAt: number;
}

export interface ProfileProgress {
  stars: number;
  completedLessons: number[];
  currentLesson: number;
}

export const avatarOptions = [
  '🦁', '🐯', '🐻', '🐼', '🐨', '🐸', 
  '🦊', '🐰', '🐱', '🐶', '🦄', '🐲',
  '🦋', '🐝', '🦜', '🐢', '🦈', '🐙'
];

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
