import { create } from 'zustand';
import type {
  AnalysisResult,
  ProcessingJob,
  ProcessingOptions,
} from '@/lib/types/processing';

interface ProcessingState {
  rootPath: string | null;
  analysisResult: AnalysisResult | null;
  processingOptions: ProcessingOptions;
  currentJobId: string | null;
  currentJob: ProcessingJob | null;

  setRootPath: (path: string) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  updateOptions: (options: Partial<ProcessingOptions>) => void;
  startProcessing: () => Promise<void>;
  updateJobStatus: (job: ProcessingJob) => void;
  reset: () => void;
}

const defaultOptions: ProcessingOptions = {
  backupOriginals: true,
  overwriteExisting: false,
  useGeoDataExif: false,
  writePeopleToKeywords: true,
  preserveFileTimestamps: true,
  maxConcurrency: 4,
  targetFolders: [],
};

export const useProcessingStore = create<ProcessingState>((set, get) => ({
  rootPath: null,
  analysisResult: null,
  processingOptions: defaultOptions,
  currentJobId: null,
  currentJob: null,

  setRootPath: (path: string) => set({ rootPath: path }),
  setAnalysisResult: (result: AnalysisResult) =>
    set({ analysisResult: result }),
  updateOptions: (options: Partial<ProcessingOptions>) =>
    set((state) => ({
      processingOptions: { ...state.processingOptions, ...options },
    })),

  startProcessing: async () => {
    const { rootPath, processingOptions } = get();
    if (!rootPath) return;

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootPath, options: processingOptions }),
      });
      const data = (await res.json()) as { success: boolean; jobId?: string; error?: string };
      if (data.success && data.jobId) {
        set({ currentJobId: data.jobId, currentJob: null });
      } else {
        console.error('Failed to start processing:', data.error ?? 'Unknown error');
      }
    } catch (err) {
      console.error('Failed to start processing:', err);
    }
  },

  updateJobStatus: (job: ProcessingJob) => set({ currentJob: job }),

  reset: () =>
    set({
      rootPath: null,
      analysisResult: null,
      processingOptions: defaultOptions,
      currentJobId: null,
      currentJob: null,
    }),
}));
