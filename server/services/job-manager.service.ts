import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient, SUPABASE_TABLES } from './supabase.service';

export interface Job {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  progressMessage?: string;
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

const JOBS_TABLE = SUPABASE_TABLES.jobs;

export class JobManager {
  /**
   * Create a new job
   */
  static async createJob(): Promise<string> {
    const jobId = uuidv4();
    const supabase = getSupabaseClient();

    const job: Job = {
      id: jobId,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await supabase.from(JOBS_TABLE).insert({
      id: job.id,
      status: job.status,
      progress: job.progress,
      created_at: job.createdAt,
      updated_at: job.updatedAt
    });

    return jobId;
  }

  /**
   * Update job progress
   */
  static async updateProgress(jobId: string, progress: number, message?: string): Promise<void> {
    const supabase = getSupabaseClient();

    await supabase
      .from(JOBS_TABLE)
      .update({
        progress,
        progress_message: message,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }

  /**
   * Update job status
   */
  static async updateStatus(
    jobId: string,
    status: Job['status'],
    updates?: { progress?: number; message?: string; result?: any; error?: string }
  ): Promise<void> {
    const supabase = getSupabaseClient();

    const data: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (updates?.progress !== undefined) data.progress = updates.progress;
    if (updates?.message) data.progress_message = updates.message;
    if (updates?.result) data.result = updates.result;
    if (updates?.error) data.error = updates.error;

    await supabase
      .from(JOBS_TABLE)
      .update(data)
      .eq('id', jobId);
  }

  /**
   * Get job by ID
   */
  static async getJob(jobId: string): Promise<Job | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from(JOBS_TABLE)
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      status: data.status,
      progress: data.progress,
      progressMessage: data.progress_message,
      result: data.result,
      error: data.error,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * Mark job as completed
   */
  static async completeJob(jobId: string, result: any): Promise<void> {
    await this.updateStatus(jobId, 'completed', {
      progress: 100,
      message: 'Analysis complete',
      result
    });
  }

  /**
   * Mark job as failed
   */
  static async failJob(jobId: string, error: string): Promise<void> {
    await this.updateStatus(jobId, 'failed', {
      error
    });
  }
}
