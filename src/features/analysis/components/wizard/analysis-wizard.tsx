"use client";

import React, { useEffect, useCallback, useState } from 'react';
import { WIZARD_STEPS } from '@/lib/constants';
import { useWizardState } from '../../hooks/use-wizard-state';
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
  project: { id: number; baseUrl: string; orgName: string | null; orgPurpose: string | null };
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
  } = useWizardState();

  const [savedData, setSavedData] = useState<SavedScreenshotData | null>(null);
  const [loadingSaved, setLoadingSaved] = useState(false);
  // null = not decided yet, 'saved' = use existing, 'fresh' = recapture
  const [screenshotChoice, setScreenshotChoice] = useState<'saved' | 'fresh' | null>(null);

  // Pre-fill URL if provided
  useEffect(() => {
    if (initialUrl) {
      updateAnalysisData({ websiteUrl: initialUrl });
    }
  }, [initialUrl]);

  // Fetch saved screenshots when projectId is provided
  useEffect(() => {
    if (!projectId) return;
    setLoadingSaved(true);
    fetch(`/api/projects/${projectId}/screenshots`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && data.screenshots?.length > 0) {
          setSavedData(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSaved(false));
  }, [projectId]);

  // When user chooses to use saved screenshots, load them and jump to review step
  const handleUseSaved = useCallback(() => {
    if (!savedData) return;
    setScreenshotChoice('saved');
    updateAnalysisData({
      websiteUrl: savedData.project.baseUrl,
      organizationName: savedData.project.orgName ?? '',
      sitePurpose: savedData.project.orgPurpose ?? '',
      captureJobId: savedData.captureJobId ?? undefined,
      screenshots: savedData.screenshots,
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
            onPurposeChange={(purpose) => updateAnalysisData({ sitePurpose: purpose })}
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
          />
        );
      case 5:
        return (
          <ScreenshotReview
            screenshots={analysisData.screenshots ?? []}
            captureJobId={analysisData.captureJobId ?? ''}
            organizationName={analysisData.organizationName}
            sitePurpose={analysisData.sitePurpose}
            onStartAnalysis={startAnalysis}
            onBack={previousStep}
            isAnalyzing={isAnalyzing}
            updateAnalysisData={updateAnalysisData}
            error={error}
          />
        );
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

  // Show loading state while fetching saved screenshots
  if (loadingSaved) {
    return (
      <div className="w-full max-w-2xl mx-auto flex items-center justify-center py-24 gap-3 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading previous screenshots...</span>
      </div>
    );
  }

  // Show choice card if saved screenshots exist and user hasn't decided yet
  if (savedData && screenshotChoice === null) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card className="border-slate-200 bg-white shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-semibold">Run New Analysis</CardTitle>
            <p className="text-slate-600 mt-2">
              This project has {savedData.screenshots.length} saved screenshot{savedData.screenshots.length === 1 ? '' : 's'} from a previous capture.
              Would you like to use them or take fresh ones?
            </p>
          </CardHeader>
          <CardContent className="space-y-3 pb-8">
            <button
              onClick={handleUseSaved}
              className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
            >
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Images className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Use saved screenshots</div>
                <div className="text-sm text-slate-500 mt-0.5">
                  Skip recapture and go straight to reviewing the {savedData.screenshots.length} existing screenshot{savedData.screenshots.length === 1 ? '' : 's'}.
                </div>
              </div>
            </button>
            <button
              onClick={handleRecapture}
              className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all text-left group"
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
