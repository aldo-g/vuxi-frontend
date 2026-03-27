"use client";

import React, { useEffect, useCallback } from 'react';
import { WIZARD_STEPS } from '@/lib/constants';
import { useWizardState } from '../../hooks/use-wizard-state';
import { UrlInputStep, OrganizationStep, PurposeStep, ProcessingStep } from './steps';
import { ScreenshotReview } from './screenshot-review';
import { AnalysisComplete } from './analysis-complete';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface AnalysisWizardProps {
  onCancel?: () => void;
}

function AnalysisProgressStep({ analysisJob, captureJobId, error }: { analysisJob: any; captureJobId: string; error: string | null }) {
  const handleViewReport = async () => {
    let reportData = analysisJob?.results?.reportData;

    // Fall back to re-fetching if not in state
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
      // Strip base64 screenshots — too large for sessionStorage (5MB limit).
      // The report page will load images directly from the capture service instead.
      const { screenshots: _screenshots, ...reportWithoutScreenshots } = reportData;
      sessionStorage.setItem('liveReportData', JSON.stringify(reportWithoutScreenshots));
    }

    // Store captureJobId so report page can construct screenshot URLs
    if (captureJobId) {
      sessionStorage.setItem('liveCaptureJobId', captureJobId);
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

export function AnalysisWizard({ onCancel }: AnalysisWizardProps) {
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
    resetWizard,
  } = useWizardState();

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
