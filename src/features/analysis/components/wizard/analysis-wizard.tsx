"use client";

import React, { useEffect, useCallback, useState } from 'react';
import { WIZARD_STEPS } from '@/lib/constants';
import { useWizardState, getDeletedPages, saveDeletedPages } from '../../hooks/use-wizard-state';
import { UrlInputStep, OrganizationStep, PurposeStep, ProcessingStep } from './steps';
import { ScreenshotReview } from './screenshot-review';
import { AnalysisComplete } from './analysis-complete';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw, Images } from 'lucide-react';
import type { Screenshot } from '@/types';

interface AnalysisWizardProps {
  onCancel?: () => void;
  initialUrl?: string;
  projectId?: number;
}

interface SavedScreenshotData {
  project: { id: number; baseUrl: string; orgName: string | null; orgPurpose: string | null; targetAudience: string | null; primaryGoal: string | null; industry: string | null };
  screenshots: Screenshot[];
  captureJobId: string | null;
}

function AnalysisProgressStep({ analysisJob, captureJobId, error }: { analysisJob: any; captureJobId: string; error: string | null }) {
  const handleViewReport = async () => {
    // Try to navigate to the already-saved DB report
    if (captureJobId) {
      try {
        const lookupRes = await fetch(`/api/analysis/save?captureJobId=${captureJobId}`);
        if (lookupRes.ok) {
          const { analysisRunId } = await lookupRes.json();
          window.location.href = `/report/${analysisRunId}`;
          return;
        }
      } catch (_) {}
    }

    // Fallback: re-fetch report data and use sessionStorage
    let reportData = analysisJob?.results?.reportData;
    if (!reportData && analysisJob?.id) {
      try {
        const res = await fetch(`/api/start-analysis?jobId=${analysisJob.id}`);
        if (res.ok) {
          const data = await res.json();
          reportData = data.results?.reportData;
        }
      } catch (_) {}
    }
    if (reportData) {
      const { screenshots: _screenshots, ...reportWithoutScreenshots } = reportData;
      sessionStorage.setItem('liveReportData', JSON.stringify(reportWithoutScreenshots));
      if (captureJobId) sessionStorage.setItem('liveCaptureJobId', captureJobId);
    }
    window.location.href = '/report/live';
  };
  return (
    <Card className="border-slate-200 bg-white shadow-lg">
      <CardHeader className="text-center pb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <CardTitle className="text-2xl font-semibold">Analyzing Your Website</CardTitle>
        <p className="text-slate-600 mt-2">
          Our AI is reviewing the captured screenshots and generating insights.
        </p>
        <p className="text-sm text-slate-500 mt-1">
          You will be emailed when your analysis is complete.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {analysisJob && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Progress</span>
              <span className="text-sm text-slate-500">{analysisJob.progress?.percentage ?? 0}%</span>
            </div>
            <Progress value={analysisJob.progress?.percentage ?? 0} className="h-2" />
            <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-3">
              {analysisJob.status === 'completed' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : analysisJob.status === 'failed' ? (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              ) : (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
              )}
              <div>
                <Badge variant={
                  analysisJob.status === 'completed' ? 'default' :
                  analysisJob.status === 'failed' ? 'destructive' : 'secondary'
                }>
                  {(analysisJob.status ?? 'processing').replace('_', ' ').toUpperCase()}
                </Badge>
                <p className="text-sm text-slate-600 mt-1">{analysisJob.progress?.message ?? 'Processing...'}</p>
              </div>
            </div>

            {analysisJob.status === 'completed' && (
              <button
                onClick={handleViewReport}
                className="flex items-center justify-center w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all"
              >
                View Your Report
              </button>
            )}
          </div>
        )}

        {!analysisJob && (
          <div className="flex items-center justify-center gap-3 py-8 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Starting analysis...</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalysisWizard({ onCancel, initialUrl, projectId }: AnalysisWizardProps) {
  const {
    currentStep,
    analysisData,
    captureJob,
    analysisJob,
    isLoading,
    error,
    captureStarted,
    isAnalyzing,
    updateAnalysisData,
    startCapture,
    startAnalysis,
    startCapturePolling,
    pollCaptureJobStatus,
    pollAnalysisJobStatus,
    nextStep,
    previousStep,
    goToStep,
    resetWizard,
  } = useWizardState(projectId);

  const [savedData, setSavedData] = useState<SavedScreenshotData | null>(null);
  // null = not decided yet, 'saved' = use existing, 'fresh' = recapture
  const [screenshotChoice, setScreenshotChoice] = useState<'saved' | 'fresh' | null>(null);
  // show choice card only when projectId is present AND no draft was restored
  const [showChoiceCard, setShowChoiceCard] = useState(() => {
    if (!projectId) return false;
    // If a draft exists at step 5+ for this same project, skip the choice card
    try {
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem('vuxi_wizard_draft') : null;
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.currentStep >= 5 && draft.projectId === projectId) return false;
      }
    } catch {}
    return true;
  });

  // Pre-fill URL if provided
  useEffect(() => {
    if (initialUrl) {
      updateAnalysisData({ websiteUrl: initialUrl });
    }
  }, [initialUrl]);

  // Fetch saved screenshots when projectId is provided
  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/projects/${projectId}/screenshots`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && data.screenshots?.length > 0) {
          setSavedData(data);
        } else {
          // No saved screenshots — skip choice card and go straight to wizard
          setShowChoiceCard(false);
        }
      })
      .catch(() => { setShowChoiceCard(false); });
  }, [projectId]);

  // When user chooses to use saved screenshots, load them and jump to review step
  const handleUseSaved = useCallback(() => {
    if (!savedData) return;
    setScreenshotChoice('saved');
    // Use the real captureJobId from the DB so screenshot URLs resolve correctly.
    // Fall back to a synthetic ID only if no real job ID exists.
    const captureJobId = savedData.captureJobId ?? `saved-${crypto.randomUUID()}`;
    // Filter out pages the user has previously deleted for this website
    const deletedUrls = new Set(getDeletedPages(savedData.project.baseUrl));
    const screenshots = deletedUrls.size > 0
      ? savedData.screenshots.filter((s) => !deletedUrls.has(s.url))
      : savedData.screenshots;
    updateAnalysisData({
      websiteUrl: savedData.project.baseUrl,
      organizationName: savedData.project.orgName ?? '',
      sitePurpose: savedData.project.orgPurpose ?? '',
      targetAudience: savedData.project.targetAudience ?? '',
      primaryGoal: savedData.project.primaryGoal ?? '',
      industry: savedData.project.industry ?? '',
      captureJobId,
      screenshots,
    });
    goToStep(5);
  }, [savedData, updateAnalysisData, goToStep]);

  const handleRecapture = useCallback(() => {
    setScreenshotChoice('fresh');
  }, []);

  // Start capture polling once capture is initiated
  useEffect(() => {
    if (captureStarted && captureJob && captureJob.status !== 'completed' && captureJob.status !== 'failed') {
      startCapturePolling();
    }
  }, [captureStarted, captureJob?.status]);

  // Poll analysis job while analyzing
  useEffect(() => {
    if (!isAnalyzing || !analysisJob?.id) return;
    const interval = setInterval(pollAnalysisJobStatus, 3000);
    return () => clearInterval(interval);
  }, [isAnalyzing, analysisJob?.id]);

  const handleUrlNext = useCallback(async () => {
    const success = await startCapture(analysisData.websiteUrl);
    if (success) nextStep();
  }, [analysisData.websiteUrl, startCapture, nextStep]);

  const handleProcessingNext = useCallback(() => {
    if (captureJob?.status === 'completed') nextStep();
  }, [captureJob?.status, nextStep]);

  const handleManualUpload = useCallback((screenshots: import('@/types').Screenshot[]) => {
    const captureJobId = `manual-${crypto.randomUUID()}`;
    updateAnalysisData({ screenshots, captureJobId });
    goToStep(5);
  }, [updateAnalysisData, goToStep]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <UrlInputStep
            websiteUrl={analysisData.websiteUrl}
            onUrlChange={(url) => updateAnalysisData({ websiteUrl: url })}
            onNext={handleUrlNext}
            onBack={onCancel ?? (() => {})}
            isLoading={isLoading}
            error={error}
          />
        );
      case 2:
        return (
          <OrganizationStep
            organizationName={analysisData.organizationName}
            onOrgChange={(name) => updateAnalysisData({ organizationName: name })}
            onNext={nextStep}
            onBack={previousStep}
            captureJob={captureJob}
            captureStarted={captureStarted}
          />
        );
      case 3:
        return (
          <PurposeStep
            sitePurpose={analysisData.sitePurpose}
            targetAudience={analysisData.targetAudience}
            primaryGoal={analysisData.primaryGoal}
            industry={analysisData.industry}
            onPurposeChange={(purpose) => updateAnalysisData({ sitePurpose: purpose })}
            onTargetAudienceChange={(audience) => updateAnalysisData({ targetAudience: audience })}
            onPrimaryGoalChange={(goal) => updateAnalysisData({ primaryGoal: goal })}
            onIndustryChange={(industry) => updateAnalysisData({ industry })}
            onNext={nextStep}
            onBack={previousStep}
            captureJob={captureJob}
            captureStarted={captureStarted}
          />
        );
      case 4:
        return (
          <ProcessingStep
            captureJob={captureJob}
            onNext={handleProcessingNext}
            onBack={previousStep}
            error={error}
            onManualUpload={handleManualUpload}
          />
        );
      case 5: {
        const updateAnalysisDataWithDeleteTracking = (updates: Parameters<typeof updateAnalysisData>[0]) => {
          if (updates.screenshots && analysisData.websiteUrl) {
            const currentUrls = new Set((analysisData.screenshots ?? []).map((s) => s.url));
            const nextUrls = new Set(updates.screenshots.map((s) => s.url));
            const removed = Array.from(currentUrls).filter((u) => !nextUrls.has(u));
            if (removed.length > 0) {
              const existing = getDeletedPages(analysisData.websiteUrl);
              const merged = Array.from(new Set(existing.concat(removed)));
              saveDeletedPages(analysisData.websiteUrl, merged);
            }
          }
          updateAnalysisData(updates);
        };
        return (
          <ScreenshotReview
            screenshots={analysisData.screenshots ?? []}
            captureJobId={analysisData.captureJobId ?? ''}
            organizationName={analysisData.organizationName}
            sitePurpose={analysisData.sitePurpose}
            onStartAnalysis={startAnalysis}
            onBack={previousStep}
            isAnalyzing={isAnalyzing}
            updateAnalysisData={updateAnalysisDataWithDeleteTracking}
            error={error}
          />
        );
      }
      case 6:
        return (
          <AnalysisProgressStep
            analysisJob={analysisJob}
            captureJobId={analysisData.captureJobId ?? ''}
            error={error}
          />
        );
      case 7:
        return <AnalysisComplete onRestart={resetWizard} />;
      default:
        return null;
    }
  };

  const progressPercent = ((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100;

  // Show choice card if projectId is present and user hasn't decided yet
  if (showChoiceCard && screenshotChoice === null) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card className="border-slate-200 bg-white shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-semibold">Run New Analysis</CardTitle>
            <p className="text-slate-600 mt-2">
              {savedData
                ? <>This project has {savedData.screenshots.length} saved screenshot{savedData.screenshots.length === 1 ? '' : 's'} from a previous capture. Would you like to use them or take fresh ones?</>
                : <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-slate-400" />Checking for saved screenshots…</span>
              }
            </p>
          </CardHeader>
          <CardContent className="space-y-3 pb-8">
            <button
              onClick={handleUseSaved}
              disabled={!savedData}
              className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:bg-transparent"
            >
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Images className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Use saved screenshots</div>
                <div className="text-sm text-slate-500 mt-0.5">
                  {savedData
                    ? <>Skip recapture and go straight to reviewing the {savedData.screenshots.length} existing screenshot{savedData.screenshots.length === 1 ? '' : 's'}.</>
                    : <>Skip recapture and go straight to reviewing existing screenshots.</>
                  }
                </div>
              </div>
            </button>
            <button
              onClick={handleRecapture}
              disabled={!savedData}
              className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:bg-transparent"
            >
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                <RefreshCw className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Take fresh screenshots</div>
                <div className="text-sm text-slate-500 mt-0.5">
                  Re-crawl the site and capture new screenshots from scratch.
                </div>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Step indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Step {currentStep} of {WIZARD_STEPS.length}</span>
          <span>{WIZARD_STEPS[currentStep - 1]?.title}</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      {renderStep()}
    </div>
  );
}
