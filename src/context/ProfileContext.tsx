import { createContext } from 'react';
import type { ResearcherProfile } from '../types/profile';

interface ProfileContextValue {
  profile: ResearcherProfile | null;
}

export const ProfileContext = createContext<ProfileContextValue>({ profile: null });
