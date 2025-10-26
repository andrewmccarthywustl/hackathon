import { Router, Request, Response } from 'express';
import { Logger } from '../utils/logger.js';
import { getSupabaseClient, SUPABASE_TABLES } from '../services/supabase.service.js';

interface ProfileRecord {
  id: string;
  name: string;
  email: string;
  institution: string;
  department?: string | null;
  research_interests: string[] | null;
  bio?: string | null;
  homepage?: string | null;
  orcid?: string | null;
  google_scholar?: string | null;
  avatar_icon?: string | null;
  created_at: string;
  updated_at?: string | null;
}

interface ProfileResponse {
  id: string;
  name: string;
  email: string;
  institution: string;
  department?: string;
  researchInterests: string[];
  bio?: string;
  homepage?: string;
  orcid?: string;
  googleScholar?: string;
  avatarIcon?: string;
  createdAt: string;
  updatedAt?: string;
}

const logger = new Logger('ProfileRouter');
const supabase = getSupabaseClient();

const PROFILES_TABLE = SUPABASE_TABLES.profiles;

const normalizeInterests = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((interest) => interest.trim()).filter(Boolean);
  }
  return [];
};

const mapRecordToProfile = (record: ProfileRecord): ProfileResponse => ({
  id: record.id,
  name: record.name,
  email: record.email,
  institution: record.institution,
  department: record.department ?? undefined,
  researchInterests: normalizeInterests(record.research_interests),
  bio: record.bio ?? undefined,
  homepage: record.homepage ?? undefined,
  orcid: record.orcid ?? undefined,
  googleScholar: record.google_scholar ?? undefined,
  avatarIcon: record.avatar_icon ?? undefined,
  createdAt: record.created_at,
  updatedAt: record.updated_at ?? undefined,
});

export function createProfileRouter(): Router {
  const router = Router();

  // POST /api/profile - Save a researcher profile
  router.post('/profile', async (req: Request, res: Response) => {
    try {
      const profile = req.body;

      // Validate required fields
      if (!profile.name || !profile.email || !profile.institution) {
        return res.status(400).json({
          error: 'Missing required fields: name, email, and institution are required'
        });
      }

      const timestamp = new Date().toISOString();

      const { data, error } = await supabase
        .from(PROFILES_TABLE)
        .insert({
          name: profile.name,
          email: profile.email,
          institution: profile.institution,
          department: profile.department ?? null,
          research_interests: normalizeInterests(profile.researchInterests),
          bio: profile.bio ?? null,
          homepage: profile.homepage ?? null,
          orcid: profile.orcid ?? null,
          google_scholar: profile.googleScholar ?? null,
          avatar_icon: profile.avatarIcon ?? null,
          created_at: timestamp,
          updated_at: timestamp
        })
        .select()
        .single();

      if (error) {
        logger.error('Supabase insert error:', error);
        return res.status(500).json({
          error: 'Failed to save profile',
          details: error.message
        });
      }

      const savedProfile = mapRecordToProfile(data as ProfileRecord);

      logger.success(`Profile saved for ${profile.name}`);
      logger.info(`Name: ${profile.name}`);
      logger.info(`Institution: ${profile.institution}`);
      logger.info(`Research Interests: ${profile.researchInterests?.join(', ') || 'None'}`);

      res.json({
        success: true,
        message: 'Profile saved successfully',
        profile: savedProfile
      });

    } catch (error) {
      logger.error('Error saving profile:', error);
      res.status(500).json({
        error: 'Failed to save profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /api/profiles - List all saved profiles
  router.get('/profiles', async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from(PROFILES_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Supabase query error:', error);
        return res.status(500).json({
          error: 'Failed to list profiles',
          details: error.message
        });
      }

      const profiles = (data as ProfileRecord[] | null)?.map((record) => ({
        id: record.id,
        profile: mapRecordToProfile(record)
      })) ?? [];

      res.json({
        count: profiles.length,
        profiles
      });

    } catch (error) {
      logger.error('Error listing profiles:', error);
      res.status(500).json({
        error: 'Failed to list profiles',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
