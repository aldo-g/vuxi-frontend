"use client";

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Camera,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Upload,
  ImagePlus,
  X
} from 'lucide-react';
import type { CaptureJob, Screenshot } from '../../../types';

interface ProcessingStepProps {
  captureJob: CaptureJob | null;
  onNext: () => void;
  onBack: () => void;
  error?: string | null;
  onManualUpload?: (screenshots: Screenshot[]) => void;
}

export function ProcessingStep({ captureJob, onNext, onBack, error, onManualUpload }: ProcessingStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; dataUrl: string }[]>([]);
  const [showUploader, setShowUploader] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const readers = files.map(file =>
      new Promise<{ name: string; dataUrl: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, dataUrl: reader.result as string });
        reader.readAsDataURL(file);
      })
    );

    Promise.all(readers).then(results => {
      setUploadedFiles(prev => [...prev, ...results]);
    });

    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProceedWithUploads = () => {
    if (!onManualUpload || uploadedFiles.length === 0) return;
    const screenshots: Screenshot[] = uploadedFiles.map((f, i) => ({
      url: `manual-upload-${i}`,
      success: true,
      data: {
        url: `manual-upload-${i}`,
        filename: f.name,
        dataUrl: f.dataUrl,
        isCustom: true,
      },
    }));
    onManualUpload(screenshots);
  };

  const isFailed = captureJob?.status === 'failed';

  return (
    <Card className="border-slate-200 bg-white shadow-lg">
      <CardHeader className="text-center pb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          {showUploader ? (
            <Upload className="w-8 h-8 text-white" />
          ) : (
            <Camera className="w-8 h-8 text-white" />
          )}
        </div>
        <CardTitle className="text-2xl font-semibold">
          {showUploader ? 'Upload Screenshots Manually' : 'Capturing Screenshots'}
        </CardTitle>
        <p className="text-slate-600 mt-2">
          {showUploader
            ? 'Upload your own screenshots of the website to continue with analysis.'
            : "We're just finishing up the website capture process. This may take a couple of minutes."}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!showUploader && captureJob && (
          <>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Progress</span>
                <span className="text-sm text-slate-500">{captureJob.progress.percentage}%</span>
              </div>
              <Progress value={captureJob.progress.percentage} className="h-2" />
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  {captureJob.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : captureJob.status === 'failed' ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  )}
                  <Badge variant={
                    captureJob.status === 'completed' ? 'default' :
                    captureJob.status === 'failed' ? 'destructive' : 'secondary'
                  }>
                    {captureJob.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-slate-600">{captureJob.progress.message}</p>
            </div>

            {isFailed && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">
                    {error || captureJob.error || 'Capture failed. Please try again.'}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={onBack} variant="outline" size="sm">
                    Try a Different URL
                  </Button>
                  {onManualUpload && (
                    <Button
                      onClick={() => setShowUploader(true)}
                      variant="outline"
                      size="sm"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      <ImagePlus className="w-4 h-4 mr-1.5" />
                      Upload Screenshots Manually
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={onBack} variant="outline" className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={onNext}
                disabled={captureJob.status !== 'completed'}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {captureJob.status === 'completed' ? (
                  <>
                    View Results
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Please Wait...
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {showUploader && (
          <>
            {/* Drop zone / file picker */}
            <div
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">Click to select screenshots</p>
              <p className="text-xs text-slate-500 mt-1">PNG, JPG, WebP — multiple files supported</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Preview grid */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">{uploadedFiles.length} screenshot{uploadedFiles.length !== 1 ? 's' : ''} selected</p>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border border-slate-200">
                      <img src={f.dataUrl} alt={f.name} className="w-full h-20 object-cover" />
                      <button
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => setShowUploader(false)} variant="outline" className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleProceedWithUploads}
                disabled={uploadedFiles.length === 0}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Continue with {uploadedFiles.length > 0 ? uploadedFiles.length : ''} Screenshot{uploadedFiles.length !== 1 ? 's' : ''}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
