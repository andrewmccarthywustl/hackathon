import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../utils/logger.js';

const logger = new Logger('ProfileRouter');

export function createProfileRouter(): Router {
  const router = Router();

  // Ensure profiles directory exists
  const PROFILES_DIR = path.join(process.cwd(), 'profiles');

  const ensureProfilesDir = async () => {
    try {
      await fs.access(PROFILES_DIR);
    } catch {
      await fs.mkdir(PROFILES_DIR, { recursive: true });
      logger.info(`Created profiles directory at ${PROFILES_DIR}`);
    }
  };

  // POST /api/profile - Save a researcher profile
  router.post('/profile', async (req: Request, res: Response) => {
    try {
      await ensureProfilesDir();

      const profile = req.body;

      // Validate required fields
      if (!profile.name || !profile.email || !profile.institution) {
        return res.status(400).json({
          error: 'Missing required fields: name, email, and institution are required'
        });
      }

      // Generate filename from name and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeName = profile.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const filename = `${safeName}-${timestamp}.json`;
      const filepath = path.join(PROFILES_DIR, filename);

      // Save profile to JSON file
      await fs.writeFile(filepath, JSON.stringify(profile, null, 2), 'utf-8');

      logger.success(`Profile saved: ${filename}`);
      logger.info(`Name: ${profile.name}`);
      logger.info(`Institution: ${profile.institution}`);
      logger.info(`Research Interests: ${profile.researchInterests?.join(', ') || 'None'}`);

      res.json({
        success: true,
        message: 'Profile saved successfully',
        filename,
        filepath
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
      await ensureProfilesDir();

      const files = await fs.readdir(PROFILES_DIR);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      const profiles = await Promise.all(
        jsonFiles.map(async (filename) => {
          const filepath = path.join(PROFILES_DIR, filename);
          const content = await fs.readFile(filepath, 'utf-8');
          return {
            filename,
            profile: JSON.parse(content)
          };
        })
      );

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
