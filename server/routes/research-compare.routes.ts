import { Router, Request, Response } from 'express';
import multer from 'multer';
import { AIRouter } from '../services/ai/ai-router';
import { getSupabaseClient, SUPABASE_TABLES } from '../services/supabase.service.js';
import { JobManager } from '../services/job-manager.service';
import type { ArxivPaper } from '../types';

interface ParsedMetrics {
  noveltyScore: number;
  researchStartYear: string;
  papersLastYear: number;
  researchMaturity: string;
}

interface SummarySnapshot {
  generatedAt: string;
  summary: string;
  metrics: ParsedMetrics;
  analysis: string;
  similarPapers: ArxivPaper[];
  inputPreview?: string;
}

const SNAPSHOTS_TABLE = SUPABASE_TABLES.researchCompareSnapshots;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, and DOCX are allowed.'));
    }
  },
});

export function createResearchCompareRouter(): Router {
  const router = Router();

  /**
   * POST /api/compare-research
   * Starts an async job to analyze research idea/document
   * Returns immediately with a job ID
   */
  router.post('/compare-research', upload.single('file'), async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      const file = req.file;

      if (!text && !file) {
        return res.status(400).json({ error: 'Either text or file is required' });
      }

      let researchContent = text || '';

      // If file is uploaded, extract text based on file type
      if (file) {
        if (file.mimetype === 'text/plain') {
          researchContent += '\n\n' + file.buffer.toString('utf-8');
        } else if (file.mimetype === 'application/pdf') {
          researchContent += '\n\n[PDF document uploaded]';
        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          researchContent += '\n\n[DOCX document uploaded]';
        }
      }

      // Create a job and return immediately
      const jobId = await JobManager.createJob();

      // Start processing in the background (don't await)
      processResearchComparison(jobId, researchContent).catch(err => {
        console.error('Background job error:', err);
        JobManager.failJob(jobId, err.message || 'Unknown error');
      });

      // Return job ID immediately
      res.json({ jobId });
    } catch (error) {
      console.error('Research comparison error:', error);

      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: 'Failed to start analysis' });
    }
  });

  /**
   * GET /api/compare-research/status/:jobId
   * Get the status of a research comparison job
   */
  router.get('/compare-research/status/:jobId', async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const job = await JobManager.getJob(jobId);

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json({
        status: job.status,
        progress: job.progress,
        progressMessage: job.progressMessage
      });
    } catch (error) {
      console.error('Error fetching job status:', error);
      res.status(500).json({ error: 'Failed to fetch job status' });
    }
  });

  /**
   * GET /api/compare-research/result/:jobId
   * Get the result of a completed research comparison job
   */
  router.get('/compare-research/result/:jobId', async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const job = await JobManager.getJob(jobId);

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (job.status === 'failed') {
        return res.status(500).json({ error: job.error || 'Job failed' });
      }

      if (job.status !== 'completed') {
        return res.status(202).json({
          status: job.status,
          progress: job.progress,
          message: 'Job not completed yet'
        });
      }

      res.json(job.result);
    } catch (error) {
      console.error('Error fetching job result:', error);
      res.status(500).json({ error: 'Failed to fetch job result' });
    }
  });

  return router;
}

/**
 * Process research comparison in the background
 */
async function processResearchComparison(jobId: string, researchContent: string): Promise<void> {
  try {
    // Update job status to processing
    await JobManager.updateStatus(jobId, 'processing', {
      progress: 10,
      message: 'Initializing analysis...'
    });

    // Get the configured AI service
    const aiService = AIRouter.getService();

    // Create a specialized prompt for research comparison with metrics
    const comparisonPrompt = `I need help analyzing a research idea to find similar existing work and avoid duplication.

Research Idea/Description:
${researchContent}

Please perform a comprehensive analysis and provide the following:

1. **Key Analysis**: Analyze the key concepts, methodology, and goals of this research. Identify the main research questions or hypotheses and determine the field(s) of study this belongs to.

2. **Similar Research Search**: Search for similar or related research papers on arXiv that:
   - Address similar research questions
   - Use similar methodologies
   - Study the same or related phenomena
   - Could help inform or improve this research

3. **Novelty Assessment**: Provide a novelty score from 1-10 where:
   - 1-3 = Well-established research area with many similar papers
   - 4-6 = Moderately explored with some similar work
   - 7-9 = Novel approach with limited similar work
   - 10 = Highly novel, no similar work found

4. **Research Timeline**: Based on the papers found, identify:
   - When research in this area began (approximate year)
   - How the research has evolved over time
   - Key milestones or breakthroughs

5. **Recent Activity**: Count how many papers related to this topic were published in the last 12 months based on the papers found.

At the end of your response, please provide a structured summary in this exact format:

METRICS:
Novelty Score: [X/10]
Research Start Year: [YYYY or "Recent" or "Unknown"]
Papers Last Year: [number]
Research Maturity: [Emerging/Growing/Mature/Declining]

After the METRICS block, append a new line that starts with "SUMMARY_JSON:" followed by a single-line JSON object using this schema:
SUMMARY_JSON: {"summary":"Two sentences. Sentence 1 must start with 'Verdict:' and explicitly state how novel or crowded the idea is. Sentence 2 must start with 'Next Step:' and provide a concrete recommendation for the researcher.","metrics":{"noveltyScore":X,"researchStartYear":"YYYY|Recent|Unknown","papersLastYear":N,"researchMaturity":"Emerging|Growing|Mature|Declining"}}
Make sure the JSON is valid, uses double quotes, and stays on a single line. Never output placeholders like "TBD" or instructions such as "Let me compile" in the summary.

Please search for relevant papers and provide a comprehensive analysis with these metrics.`;

    await JobManager.updateProgress(jobId, 30, 'Searching for related research...');

    // Use the AI service to analyze and search for papers
    console.log(`[Job ${jobId}] Starting AI research comparison analysis...`);
    const startTime = Date.now();
    const result = await aiService.chat(comparisonPrompt, []);
    const duration = Date.now() - startTime;
    console.log(`[Job ${jobId}] AI analysis completed in ${duration}ms`);

    await JobManager.updateProgress(jobId, 70, 'Analyzing results...');

    // Parse metrics & summary from the response
    const metrics: ParsedMetrics = {
      noveltyScore: 0,
      researchStartYear: 'Unknown',
      papersLastYear: 0,
      researchMaturity: 'Unknown',
    };

    let analysisText = result.response;
    let summary = '';

    const summaryJsonMatch = analysisText.match(/SUMMARY_JSON:\s*({[\s\S]*?})/i);
    if (summaryJsonMatch) {
      try {
        const parsed = JSON.parse(summaryJsonMatch[1]) as {
          summary?: string;
          metrics?: Partial<ParsedMetrics>;
        };

        if (typeof parsed.summary === 'string') {
          summary = parsed.summary.trim();
        }

        if (parsed.metrics) {
          if (typeof parsed.metrics.noveltyScore === 'number') {
            metrics.noveltyScore = parsed.metrics.noveltyScore;
          }
          if (typeof parsed.metrics.researchStartYear === 'string') {
            metrics.researchStartYear = parsed.metrics.researchStartYear;
          }
          if (typeof parsed.metrics.papersLastYear === 'number') {
            metrics.papersLastYear = parsed.metrics.papersLastYear;
          }
          if (typeof parsed.metrics.researchMaturity === 'string') {
            metrics.researchMaturity = parsed.metrics.researchMaturity;
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse SUMMARY_JSON block:', parseError);
      }

      analysisText = analysisText.replace(summaryJsonMatch[0], '').trim();
    }

    // Try to extract metrics from the response as a fallback
    const metricsMatch = analysisText.match(/METRICS:([\s\S]*?)(?:\n\n|$)/);
    if (metricsMatch) {
      const metricsText = metricsMatch[1];

      const noveltyMatch = metricsText.match(/Novelty Score:\s*(\d+)\/10/i);
      if (noveltyMatch) metrics.noveltyScore = parseInt(noveltyMatch[1], 10);

      const yearMatch = metricsText.match(/Research Start Year:\s*(\d{4}|Recent|Unknown)/i);
      if (yearMatch) metrics.researchStartYear = yearMatch[1];

      const papersMatch = metricsText.match(/Papers Last Year:\s*(\d+)/i);
      if (papersMatch) metrics.papersLastYear = parseInt(papersMatch[1], 10);

      const maturityMatch = metricsText.match(/Research Maturity:\s*(Emerging|Growing|Mature|Declining|Unknown)/i);
      if (maturityMatch) metrics.researchMaturity = maturityMatch[1];

      analysisText = analysisText.replace(metricsMatch[0], '').trim();
    }

    if (!summary) {
      summary = createFallbackSummary(analysisText);
    }

    await JobManager.updateProgress(jobId, 90, 'Saving results...');

    await persistSummarySnapshot({
      generatedAt: new Date().toISOString(),
      summary,
      metrics,
      analysis: analysisText,
      similarPapers: result.papers || [],
      inputPreview: researchContent.slice(0, 500)
    });

    // Complete the job with the result
    const finalResult = {
      analysis: analysisText,
      summary,
      similarPapers: result.papers || [],
      metrics,
    };

    await JobManager.completeJob(jobId, finalResult);
    console.log(`[Job ${jobId}] Completed successfully`);
  } catch (error) {
    console.error(`[Job ${jobId}] Processing error:`, error);
    await JobManager.failJob(jobId, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

async function persistSummarySnapshot(snapshot: SummarySnapshot): Promise<void> {
  try {
    // Get Supabase client (initialized on demand)
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from(SNAPSHOTS_TABLE)
      .insert({
        generated_at: snapshot.generatedAt,
        summary: snapshot.summary,
        metrics: snapshot.metrics,
        analysis: snapshot.analysis,
        similar_papers: snapshot.similarPapers,
        input_preview: snapshot.inputPreview ?? null
      });

    if (error) {
      console.warn('Unable to persist research summary snapshot', error);
    }
  } catch (error) {
    console.warn('Unable to persist research summary snapshot', error);
  }
}

function createFallbackSummary(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }

  const sentences = normalized.split(/(?<=[.!?])\s+/).slice(0, 2);
  return sentences.join(' ').trim();
}
