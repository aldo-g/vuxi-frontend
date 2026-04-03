/**
 * Wizard State Hook - Analysis Workflow Management
 * 
 * Complex state management hook that orchestrates the multi-step
 * analysis wizard including website capture, analysis polling,
 * and progress tracking.
 * 
 * @responsibilities
 * - Manages multi-step wizard state and navigation
 * - Handles website capture job initiation and polling
 * - Manages analysis job creation and progress tracking
 * - Coordinates polling intervals for job status updates
 * - Provides error handling and recovery mechanisms
 * - Maintains analysis data throughout the workflow
 */

"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { WIZARD_STEPS, API_ENDPOINTS, POLLING_INTERVALS } from '@/lib/constants';
import { validateAndNormalizeUrl } from '@/lib/validations';
import { useCurrentUser } from '@/hooks/use-current-user';
import type {
  WizardState,
  AnalysisData,
  CaptureJob,
  AnalysisJob,
  SaveCaptureRequest
} from '../types';

const DRAFT_STORAGE_KEY = 'vuxi_wizard_draft';

function getCaptureErrorMessage(errorType?: string, rawError?: string): string {
  switch (errorType) {
    case 'bot_protection':
      return 'This website appears to be blocking automated access. Sites with Cloudflare, CAPTCHA, or strict bot protection cannot be captured. Try a different URL or contact support.';
    case 'dns_error':
      return 'The website could not be found. Please check the URL is correct and the site is publicly accessible.';
    case 'connection_error':
      return 'Could not connect to the website. The site may be down or temporarily unavailable. Please try again later.';
    case 'timeout':
      return 'The website took too long to respond. It may be slow or unresponsive. Please try again or try a different URL.';
    case 'no_urls':
      return 'No pages could be discovered on this website. It may require JavaScript to load or may be blocking crawlers.';
    default:
      return rawError || 'Capture failed. Please try again.';
  }
}
const DELETED_PAGES_KEY = 'vuxi_deleted_pages'; // localStorage: Record<websiteUrl, string[]>

interface WizardDraft {
  currentStep: number;
  analysisData: AnalysisData;
  captureJob: CaptureJob | null;
  captureStarted: boolean;
  projectId?: number;
}

export function getDeletedPages(websiteUrl: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_PAGES_KEY);
    if (!raw) return [];
    const map: Record<string, string[]> = JSON.parse(raw);
    return map[websiteUrl] ?? [];
  } catch {
    return [];
  }
}

export function saveDeletedPages(websiteUrl: string, deletedUrls: string[]) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(DELETED_PAGES_KEY);
    const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    if (deletedUrls.length === 0) {
      delete map[websiteUrl];
    } else {
      map[websiteUrl] = deletedUrls;
    }
    localStorage.setItem(DELETED_PAGES_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function loadDraft(projectId?: number): Partial<WizardState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const draft: WizardDraft = JSON.parse(raw);
    // Only restore if we were at the screenshot review step or later (step 5)
    if (draft.currentStep < 5) {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      return null;
    }
    // Only restore if the draft belongs to the same project context.
    // A fresh "Create New Analysis" (no projectId) must never restore any draft.
    // A project-specific run must only restore a draft saved for the same project.
    if (projectId === undefined || draft.projectId !== projectId) {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      return null;
    }
    return {
      currentStep: draft.currentStep,
      analysisData: draft.analysisData,
      captureJob: draft.captureJob,
      captureStarted: draft.captureStarted,
    };
  } catch {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    return null;
  }
}

function saveDraft(state: WizardState, projectId?: number) {
  if (typeof window === 'undefined') return;
  if (state.currentStep < 5) return;
  try {
    const draft: WizardDraft = {
      currentStep: state.currentStep,
      analysisData: state.analysisData,
      captureJob: state.captureJob,
      captureStarted: state.captureStarted,
      projectId,
    };
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // sessionStorage full or unavailable — ignore
  }
}

function clearDraft() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(DRAFT_STORAGE_KEY);
}

const initialAnalysisData: AnalysisData = {
  websiteUrl: '',
  organizationName: '',
  sitePurpose: '',
  targetAudience: '',
  primaryGoal: '',
  industry: '',
};

const initialState: WizardState = {
  currentStep: 1,
  analysisData: initialAnalysisData,
  captureJob: null,
  analysisJob: null,
  isLoading: false,
  error: null,
  captureStarted: false,
  isAnalyzing: false
};

export function useWizardState(projectId?: number) {
  const [state, setState] = useState<WizardState>(() => {
    const draft = loadDraft(projectId);
    if (draft) {
      return { ...initialState, ...draft };
    }
    return initialState;
  });
  const { user } = useCurrentUser();
  
  // Refs for polling intervals
  const capturePollingRef = useRef<NodeJS.Timeout | null>(null);
  const analysisPollingRef = useRef<NodeJS.Timeout | null>(null);
  const isCapturePollingRef = useRef(false);
  const isAnalysisPollingRef = useRef(false);

  // State updaters
  const updateAnalysisData = useCallback((updates: Partial<AnalysisData>) => {
    setState(prev => ({
      ...prev,
      analysisData: { ...prev.analysisData, ...updates }
    }));
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const setCaptureJob = useCallback((job: CaptureJob | null) => {
    setState(prev => ({ ...prev, captureJob: job }));
  }, []);

  const setAnalysisJob = useCallback((job: AnalysisJob | null) => {
    setState(prev => ({ ...prev, analysisJob: job }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setCaptureStarted = useCallback((started: boolean) => {
    setState(prev => ({ ...prev, captureStarted: started }));
  }, []);

  const setAnalyzing = useCallback((analyzing: boolean) => {
    setState(prev => ({ ...prev, isAnalyzing: analyzing }));
  }, []);

  // Add user ID to analysis data when user is loaded
  useEffect(() => {
    if (user?.id) {
      updateAnalysisData({ userId: user.id });
    }
  }, [user?.id, updateAnalysisData]);

  // Manual save function for capture data
  const saveCaptureData = useCallback(async (analysisData: AnalysisData, captureJobId: string): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    try {
      const saveRequest: SaveCaptureRequest = {
        analysisData: {
          ...analysisData,
          userId: user.id
        },
        captureJobId,
        userId: user.id
      };

      const response = await fetch(API_ENDPOINTS.CAPTURE_SAVE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save capture data');
      }

      const result = await response.json();
      console.log('Capture data saved successfully:', result);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save capture data';
      setError(errorMessage);
      console.error('Error saving capture data:', err);
      return false;
    }
  }, [user?.id, setError]);

  // Capture job polling - NO automatic saving
  const pollCaptureJobStatus = useCallback(async () => {
    if (!state.captureJob?.id || isCapturePollingRef.current) return;
    
    isCapturePollingRef.current = true;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.CAPTURE}/${state.captureJob.id}`);
      if (response.ok) {
        const jobData = await response.json();
        setCaptureJob(jobData);
        
        if (jobData.status === 'completed') {
          const rawScreenshots: Array<{ url: string; success?: boolean; filename?: string; path?: string; storageUrl?: string; data?: { filename?: string; path?: string; storageUrl?: string; timestamp?: string }; [key: string]: unknown }> = jobData.results?.screenshots || [];
          const screenshots = rawScreenshots.map(s => ({
            url: s.url as string,
            success: true,
            data: {
              url: s.url as string,
              filename: (s.data?.filename ?? s.filename) as string | undefined,
              path: (s.data?.path ?? s.path) as string | undefined,
              storageUrl: (s.data?.storageUrl ?? s.storageUrl) as string | undefined,
              timestamp: (s.data?.timestamp ?? s.timestamp) as string | undefined,
            }
          }));
          updateAnalysisData({ screenshots });

          // Save capture data to DB (creates Project + AnalysisRun records)
          const captureJobId = jobData.id;
          if (captureJobId && user?.id) {
            const currentAnalysisData = {
              ...state.analysisData,
              screenshots,
              userId: user.id,
            };
            saveCaptureData(currentAnalysisData, captureJobId).catch(err =>
              console.error('Failed to save capture data to DB:', err)
            );
          }

          // Stop polling
          if (capturePollingRef.current) {
            clearInterval(capturePollingRef.current);
            capturePollingRef.current = null;
          }
        } else if (jobData.status === 'failed') {
          setError(getCaptureErrorMessage(jobData.errorType, jobData.error));

          // Stop polling
          if (capturePollingRef.current) {
            clearInterval(capturePollingRef.current);
            capturePollingRef.current = null;
          }
        }
      }
    } catch (err) {
      console.error('Error polling capture job status:', err);
    } finally {
      isCapturePollingRef.current = false;
    }
  }, [state.captureJob?.id, state.analysisData, user?.id, setCaptureJob, updateAnalysisData, setError, saveCaptureData]);

  // Analysis job polling
  const pollAnalysisJobStatus = useCallback(async () => {
    if (!state.analysisJob?.id || isAnalysisPollingRef.current) return;
    
    isAnalysisPollingRef.current = true;
    
    try {
      const response = await fetch(`/api/start-analysis?jobId=${state.analysisJob.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Analysis job not found — the service may have restarted. Please try again.');
          setAnalyzing(false);
          if (analysisPollingRef.current) {
            clearInterval(analysisPollingRef.current);
            analysisPollingRef.current = null;
          }
        }
        return;
      }
      if (response.ok) {
        const jobData = await response.json();
        setAnalysisJob(jobData);
        
        if (jobData.status === 'completed') {
          setAnalyzing(false);

          if (jobData.results?.reportData) {
            // Save report to database, then redirect to the saved report page
            const captureJobId = state.analysisData.captureJobId;
            if (captureJobId) {
              try {
                const saveRes = await fetch('/api/analysis/save', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    captureJobId,
                    reportData: jobData.results.reportData,
                    overallScore: jobData.results.reportData?.overall_summary?.overall_score ?? null,
                  }),
                });
                if (saveRes.ok) {
                  const { analysisRunId } = await saveRes.json();
                  clearDraft();
                  window.location.href = `/report/${analysisRunId}`;
                  return;
                }
              } catch (err) {
                console.error('Failed to save report to DB:', err);
              }
            }
            // Fallback: use sessionStorage if DB save failed
            const { screenshots: _screenshots, ...reportWithoutScreenshots } = jobData.results.reportData;
            sessionStorage.setItem('liveReportData', JSON.stringify(reportWithoutScreenshots));
            if (captureJobId) sessionStorage.setItem('liveCaptureJobId', captureJobId);
            clearDraft();
            window.location.href = '/report/live';
          } else {
            clearDraft();
            setCurrentStep(7);
          }
          
          if (analysisPollingRef.current) {
            clearInterval(analysisPollingRef.current);
            analysisPollingRef.current = null;
          }
        } else if (jobData.status === 'failed') {
          setError(jobData.error || 'Analysis failed');
          setAnalyzing(false);
          if (analysisPollingRef.current) {
            clearInterval(analysisPollingRef.current);
            analysisPollingRef.current = null;
          }
        }
      }
    } catch (err) {
      console.error('Error polling analysis status:', err);
    } finally {
      isAnalysisPollingRef.current = false;
    }
  }, [state.analysisJob?.id, state.analysisData.captureJobId, setAnalysisJob, setAnalyzing, setCurrentStep, setError]);

  // Start capture
  const startCapture = useCallback(async (url: string): Promise<boolean> => {
    const validation = validateAndNormalizeUrl(url);
    
    if (!validation.isValid) {
      setError(validation.error || 'Please enter a valid website URL');
      return false;
    }

    if (validation.normalizedUrl !== url) {
      updateAnalysisData({ websiteUrl: validation.normalizedUrl });
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.CAPTURE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: validation.normalizedUrl,
          options: {
            maxPages: 10,
            timeout: 15000,
            concurrency: 3,
            fastMode: true
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start capture process: ${errorText}`);
      }

      const result = await response.json();
      updateAnalysisData({ captureJobId: result.jobId });
      setCaptureJob({ 
        id: result.jobId, 
        status: result.status,
        progress: { stage: 'starting', percentage: 0, message: 'Starting capture...' }
      });
      setCaptureStarted(true);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start capture';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [updateAnalysisData, setCaptureJob, setCaptureStarted, setLoading, setError]);

  // Start analysis
  const startAnalysis = useCallback(async (): Promise<void> => {
    console.log('🚀 startAnalysis called', {
      captureJobId: state.analysisData.captureJobId,
      screenshotCount: state.analysisData.screenshots?.length,
      userId: user?.id
    });

    if (!state.analysisData.captureJobId || !state.analysisData.screenshots?.length) {
      setError('No screenshots available for analysis');
      return;
    }

    // Check credits before doing anything
    if (!user || user.credits < 1) {
      setError('You have no credits remaining. Email alastairegrant@pm.me to get a voucher code.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const captureJobId = state.analysisData.captureJobId!;

      // When reusing saved screenshots, no capture job was run so no AnalysisRun
      // exists yet — create one now before syncing or saving the report.
      if (captureJobId.startsWith('saved-') && user?.id) {
        await saveCaptureData(
          { ...state.analysisData, userId: user.id },
          captureJobId
        );
      } else if (state.analysisData.screenshots?.length) {
        // Persist screenshots added/modified at the review step before analysis starts
        try {
          await fetch('/api/capture/sync-screenshots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              captureJobId,
              screenshots: state.analysisData.screenshots,
            }),
          });
        } catch (err) {
          console.warn('Screenshot sync failed (non-blocking):', err);
        }
      }

      const response = await fetch('/api/start-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisData: {
            ...state.analysisData,
            userId: user?.id,
            screenshots: state.analysisData.screenshots,
          },
          captureJobId
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to start analysis';
        try {
          const errorData = await response.json();
          if (errorData.error) errorMessage = errorData.error;
        } catch {
          errorMessage = await response.text() || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Log successful database save
      console.log('✅ Analysis started with database save:', {
        analysisJobId: result.analysisJobId,
        analysisRunId: result.analysisRunId,
        projectId: result.projectId
      });

      setAnalysisJob({
        id: result.analysisJobId,
        status: result.status,
        progress: { stage: 'starting', percentage: 0, message: 'Starting analysis...' },
        results: result.reportData ? { reportData: result.reportData } : undefined
      });
      setCurrentStep(6);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start analysis';
      setError(errorMessage);
      setAnalyzing(false);
    }
  }, [state.analysisData, user?.id, setAnalyzing, setError, setCurrentStep, setAnalysisJob, saveCaptureData]);
  
  // Start polling when needed
  const startCapturePolling = useCallback(() => {
    if (capturePollingRef.current) return; // Already polling
    capturePollingRef.current = setInterval(pollCaptureJobStatus, POLLING_INTERVALS.CAPTURE_JOB);
  }, [pollCaptureJobStatus]);

  // Stop polling functions
  const stopCapturePolling = useCallback(() => {
    if (capturePollingRef.current) {
      clearInterval(capturePollingRef.current);
      capturePollingRef.current = null;
    }
  }, []);

  const stopAnalysisPolling = useCallback(() => {
    if (analysisPollingRef.current) {
      clearInterval(analysisPollingRef.current);
      analysisPollingRef.current = null;
    }
  }, []);

  // Reset wizard
  const resetWizard = useCallback(() => {
    // Clear intervals
    stopCapturePolling();
    stopAnalysisPolling();

    // Clear draft
    clearDraft();

    // Reset state
    setState(initialState);
  }, [stopCapturePolling, stopAnalysisPolling]);

  // Persist draft to sessionStorage whenever we're at step 5+
  useEffect(() => {
    saveDraft(state, projectId);
  }, [state, projectId]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      stopCapturePolling();
      stopAnalysisPolling();
    };
  }, [stopCapturePolling, stopAnalysisPolling]);

  // Navigation helpers
  const nextStep = useCallback(() => {
    setCurrentStep(Math.min(state.currentStep + 1, WIZARD_STEPS.length));
  }, [state.currentStep, setCurrentStep]);

  const previousStep = useCallback(() => {
    const nextStep = Math.max(state.currentStep - 1, 1);
    // Clear any capture errors when going back to the URL input step
    if (nextStep === 1) {
      setState(prev => ({ ...prev, currentStep: nextStep, error: null }));
    } else {
      setCurrentStep(nextStep);
    }
  }, [state.currentStep, setCurrentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= WIZARD_STEPS.length) {
      setCurrentStep(step);
    }
  }, [setCurrentStep]);

  return {
    // State
    ...state,
    
    // State updaters
    updateAnalysisData,
    setCurrentStep,
    setLoading,
    setError,
    setCaptureJob,
    setAnalysisJob,
    setCaptureStarted,
    setAnalyzing,
    
    // Async actions
    startCapture,
    startAnalysis,
    saveCaptureData, // Manual save function
    
    // Polling functions
    startCapturePolling,
    stopCapturePolling,
    stopAnalysisPolling,
    pollCaptureJobStatus,
    pollAnalysisJobStatus,
    
    // Navigation
    nextStep,
    previousStep,
    goToStep,
    resetWizard,
    
    // Computed
    canGoNext: state.currentStep < WIZARD_STEPS.length,
    canGoPrevious: state.currentStep > 1,
    totalSteps: WIZARD_STEPS.length
  };
}