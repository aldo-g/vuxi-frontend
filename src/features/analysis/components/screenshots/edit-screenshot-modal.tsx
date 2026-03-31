"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Camera, Globe, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Screenshot, ScreenshotData } from '@/types';

interface EditScreenshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (screenshots: Screenshot[]) => void;
  editingScreenshot?: Screenshot | null;
  editingIndex?: number;
  captureJobId: string;
  addToPageMode?: boolean;
}

type Tab = 'capture' | 'upload';
type CaptureState = 'idle' | 'capturing' | 'done' | 'error';
type UploadedFile = { preview: string; data: { path: string; filename: string; storageUrl?: string; timestamp?: string } };

export function EditScreenshotModal({
  isOpen,
  onClose,
  onSave,
  editingScreenshot,
  editingIndex,
  captureJobId,
  addToPageMode = false,
}: EditScreenshotModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('capture');

  // Capture tab state
  const [captureUrl, setCaptureUrl] = useState('');
  const [customPageName, setCustomPageName] = useState('');
  const [captureState, setCaptureState] = useState<CaptureState>('idle');
  const [capturedScreenshots, setCapturedScreenshots] = useState<Screenshot[]>([]);
  const [captureError, setCaptureError] = useState<string | null>(null);

  // Upload tab state
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageData, setUploadedImageData] = useState<{ path: string; filename: string; storageUrl?: string; timestamp?: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Multi-upload state (addToPageMode)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isEditMode = !!editingScreenshot;

  // Reset when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setCaptureState('idle');
    setCapturedScreenshots([]);
    setCaptureError(null);
    setIsSaving(false);
    setUploadedFiles([]);

    if (addToPageMode) {
      setActiveTab('upload');
      setCaptureUrl('');
      setCustomPageName('');
      setUploadUrl('');
      setUploadedImage(null);
      setUploadedImageData(null);
    } else if (isEditMode && editingScreenshot) {
      if (editingScreenshot.data?.isCustom) {
        setActiveTab('upload');
        setUploadUrl(editingScreenshot.url);
        setUploadedImage(editingScreenshot.data.dataUrl || null);
        setUploadedImageData(
          editingScreenshot.data.path
            ? {
                path: editingScreenshot.data.path,
                filename: editingScreenshot.data.filename || 'custom',
                storageUrl: editingScreenshot.data.storageUrl,
              }
            : null
        );
        setCustomPageName(editingScreenshot.data.customPageName || '');
        setCaptureUrl('');
      } else {
        setActiveTab('capture');
        setCaptureUrl(editingScreenshot.url);
        setCustomPageName(editingScreenshot.data?.customPageName || '');
        setUploadUrl('');
        setUploadedImage(null);
        setUploadedImageData(null);
      }
    } else {
      setActiveTab('capture');
      setCaptureUrl('');
      setCustomPageName('');
      setUploadUrl('');
      setUploadedImage(null);
      setUploadedImageData(null);
    }
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleCapture = async () => {
    let urlToCapture = captureUrl.trim();
    if (!urlToCapture) {
      toast({ title: 'URL required', description: 'Enter a URL to capture', variant: 'destructive' });
      return;
    }
    try { new URL(urlToCapture); } catch {
      toast({ title: 'Invalid URL', description: 'Enter a valid URL (e.g. https://example.com)', variant: 'destructive' });
      return;
    }
    if (!captureJobId) {
      toast({ title: 'No capture session', description: 'Cannot capture without an active capture job', variant: 'destructive' });
      return;
    }

    setCaptureState('capturing');
    setCaptureError(null);
    setCapturedScreenshots([]);

    try {
      const res = await fetch('/api/capture/refresh-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToCapture, jobId: captureJobId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Capture failed' }));
        throw new Error(err.error || 'Capture failed');
      }

      const data = await res.json();

      const results: Screenshot[] = [
        {
          url: urlToCapture,
          success: true,
          data: {
            url: urlToCapture,
            filename: data.filename,
            path: data.path,
            timestamp: data.timestamp,
            customPageName: customPageName.trim() || undefined,
          },
        },
        ...(data.interactions ?? [])
          .filter((i: { status: string }) => i.status === 'captured')
          .map((i: { filename: string; path?: string }) => ({
            url: urlToCapture,
            success: true,
            data: {
              url: urlToCapture,
              filename: i.filename,
              path: i.path ?? `desktop/${i.filename}`,
              timestamp: data.timestamp,
            },
          })),
      ];

      setCapturedScreenshots(results);
      setCaptureState('done');
    } catch (err) {
      setCaptureError(err instanceof Error ? err.message : 'Capture failed');
      setCaptureState('error');
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('captureJobId', captureJobId);
    const res = await fetch('/api/upload-screenshot', { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Upload failed');
    }
    return res.json();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid file type', description: `${file.name} is not an image`, variant: 'destructive' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'File too large', description: `${file.name} exceeds 10MB`, variant: 'destructive' });
        return;
      }
    }

    setIsUploading(true);
    try {
      if (addToPageMode) {
        const results = await Promise.all(files.map(uploadFile));
        const previews = await Promise.all(
          files.map(
            (file) =>
              new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (ev) => resolve(ev.target?.result as string);
                reader.readAsDataURL(file);
              })
          )
        );
        setUploadedFiles((prev) => [
          ...prev,
          ...results.map((result, i) => ({
            preview: previews[i],
            data: { path: result.path, filename: result.filename, storageUrl: result.storageUrl, timestamp: result.timestamp },
          })),
        ]);
        toast({ title: `${files.length} image${files.length > 1 ? 's' : ''} uploaded` });
      } else {
        const file = files[0];
        const result = await uploadFile(file);
        setUploadedImageData({ path: result.path, filename: result.filename, storageUrl: result.storageUrl, timestamp: result.timestamp });
        const reader = new FileReader();
        reader.onload = (ev) => setUploadedImage(ev.target?.result as string);
        reader.readAsDataURL(file);
        if (!customPageName) setCustomPageName(file.name.replace(/\.[^/.]+$/, ''));
        toast({ title: 'Upload successful' });
      }
    } catch (err) {
      toast({ title: 'Upload failed', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      // Reset input so same files can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (activeTab === 'capture') {
      if (captureState !== 'done' || !capturedScreenshots.length) {
        toast({ title: 'Nothing to save', description: 'Capture a page first', variant: 'destructive' });
        return;
      }
      // Apply custom page name to base screenshot if provided
      const named = capturedScreenshots.map((s, i) =>
        i === 0 && customPageName.trim()
          ? { ...s, data: { ...s.data, customPageName: customPageName.trim() } }
          : s
      );
      onSave(named);
      onClose();
    } else {
      if (addToPageMode) {
        if (!uploadedFiles.length) {
          toast({ title: 'Image required', description: 'Upload at least one image first', variant: 'destructive' });
          return;
        }
        setIsSaving(true);
        try {
          const pageUrl = editingScreenshot?.url || 'Custom Screenshot';
          const screenshots: Screenshot[] = uploadedFiles.map(({ data }) => ({
            url: pageUrl,
            success: true,
            data: {
              isCustom: true,
              path: data.path,
              filename: data.filename,
              storageUrl: data.storageUrl,
              customPageName: data.filename.replace(/\.[^/.]+$/, ''),
              timestamp: data.timestamp,
              viewport: { width: 1920, height: 1080 },
            } as ScreenshotData,
            error: null,
          }));
          onSave(screenshots);
          onClose();
          toast({ title: `${screenshots.length} screenshot${screenshots.length > 1 ? 's' : ''} added` });
        } finally {
          setIsSaving(false);
        }
      } else {
        if (!uploadedImageData) {
          toast({ title: 'Image required', description: 'Upload an image first', variant: 'destructive' });
          return;
        }
        setIsSaving(true);
        try {
          const screenshotData: ScreenshotData = {
            isCustom: true,
            path: uploadedImageData.path,
            filename: uploadedImageData.filename,
            storageUrl: uploadedImageData.storageUrl,
            customPageName: customPageName.trim() || uploadedImageData.filename.replace(/\.[^/.]+$/, ''),
            timestamp: uploadedImageData.timestamp,
            viewport: { width: 1920, height: 1080 },
          };
          const screenshot: Screenshot = {
            url: uploadUrl.trim() || (isEditMode ? editingScreenshot?.url : undefined) || customPageName.trim() || 'Custom Screenshot',
            success: true,
            data: screenshotData,
            error: null,
          };
          onSave([screenshot]);
          onClose();
          toast({ title: isEditMode ? 'Screenshot updated' : 'Screenshot added' });
        } finally {
          setIsSaving(false);
        }
      }
    }
  };

  if (!isOpen) return null;

  const canSave =
    (activeTab === 'capture' && captureState === 'done' && capturedScreenshots.length > 0) ||
    (activeTab === 'upload' && (addToPageMode ? uploadedFiles.length > 0 : !!uploadedImageData));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {addToPageMode ? 'Add Screenshots to Page' : isEditMode ? 'Edit Screenshot' : 'Add New Screenshot'}
            </CardTitle>
            <Button onClick={onClose} variant="ghost" size="icon" className="h-8 w-8" disabled={captureState === 'capturing' || isUploading}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Tab selector — hidden in addToPageMode */}
          {!addToPageMode && <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveTab('capture')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                activeTab === 'capture'
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Globe className="w-4 h-4" />
              Capture URL
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                activeTab === 'upload'
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload Image
            </button>
          </div>}

          {/* Capture URL tab */}
          {activeTab === 'capture' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="capture-url">Page URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="capture-url"
                    type="url"
                    placeholder="https://example.com/about"
                    value={captureUrl}
                    onChange={(e) => {
                      setCaptureUrl(e.target.value);
                      if (captureState !== 'idle') {
                        setCaptureState('idle');
                        setCapturedScreenshots([]);
                      }
                    }}
                    disabled={captureState === 'capturing'}
                    onKeyDown={(e) => e.key === 'Enter' && handleCapture()}
                  />
                  <Button
                    onClick={handleCapture}
                    disabled={captureState === 'capturing' || !captureUrl.trim()}
                    className="shrink-0"
                  >
                    {captureState === 'capturing' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    <span className="ml-2">{captureState === 'capturing' ? 'Capturing…' : 'Capture'}</span>
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Captures a full-page screenshot including any interactive states
                </p>
              </div>

              {/* Capture result */}
              {captureState === 'capturing' && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span className="text-sm">Launching browser and capturing page…</span>
                </div>
              )}

              {captureState === 'done' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-1">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-medium">
                      Captured {capturedScreenshots.length} screenshot{capturedScreenshots.length !== 1 ? 's' : ''}
                      {capturedScreenshots.length > 1 ? ` (1 base + ${capturedScreenshots.length - 1} interaction state${capturedScreenshots.length - 1 !== 1 ? 's' : ''})` : ''}
                    </span>
                  </div>
                  <p className="text-xs text-green-600 ml-6">
                    Preview the image at the top of the page after saving
                  </p>
                </div>
              )}

              {captureState === 'error' && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Capture failed</p>
                    <p className="text-xs mt-0.5">{captureError}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="capture-page-name">Page Name (optional)</Label>
                <Input
                  id="capture-page-name"
                  placeholder="e.g. About Page, Pricing, Contact"
                  value={customPageName}
                  onChange={(e) => setCustomPageName(e.target.value)}
                  disabled={captureState === 'capturing'}
                />
                <p className="text-xs text-slate-500">Label shown in the analysis report</p>
              </div>
            </div>
          )}

          {/* Upload Image tab */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {addToPageMode ? (
                /* Multi-file upload for addToPageMode */
                <div className="space-y-3">
                  <div
                    className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors cursor-pointer"
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <div className="space-y-2">
                        <div className="w-10 h-10 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-slate-600">Uploading…</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-10 h-10 mx-auto text-slate-400" />
                        <p className="text-sm font-medium text-slate-700">Click to upload screenshots</p>
                        <p className="text-xs text-slate-500">PNG, JPG, WebP · max 10MB · multiple allowed</p>
                      </div>
                    )}
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {uploadedFiles.map((f, i) => (
                        <div key={i} className="relative group">
                          <img src={f.preview} alt={f.data.filename} className="w-full h-20 object-cover rounded border" />
                          <button
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setUploadedFiles((prev) => prev.filter((_, j) => j !== i))}
                            type="button"
                          >
                            ×
                          </button>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{f.data.filename}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Single-file upload */
                <div className="space-y-2">
                  <Label>Screenshot Image</Label>
                  <div
                    className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors cursor-pointer"
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <div className="space-y-2">
                        <div className="w-10 h-10 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-slate-600">Uploading…</p>
                      </div>
                    ) : uploadedImage ? (
                      <div className="space-y-3">
                        <img src={uploadedImage} alt="Preview" className="max-w-full max-h-40 mx-auto rounded border" />
                        <Button variant="outline" size="sm" type="button">
                          <Upload className="w-3.5 h-3.5 mr-2" />
                          Change Image
                        </Button>
                        {uploadedImageData && (
                          <p className="text-xs text-green-600">Saved as {uploadedImageData.filename}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Camera className="w-10 h-10 mx-auto text-slate-400" />
                        <p className="text-sm font-medium text-slate-700">Click to upload screenshot</p>
                        <p className="text-xs text-slate-500">PNG, JPG, WebP · max 10MB</p>
                      </div>
                    )}
                  </div>

                  {!isEditMode && (
                    <>
                      <div className="space-y-2 pt-2">
                        <Label htmlFor="upload-url">Associated URL (optional)</Label>
                        <Input
                          id="upload-url"
                          type="url"
                          placeholder="https://example.com"
                          value={uploadUrl}
                          onChange={(e) => setUploadUrl(e.target.value)}
                        />
                        <p className="text-xs text-slate-500">The page this screenshot represents</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="upload-page-name">Page Name (optional)</Label>
                        <Input
                          id="upload-page-name"
                          placeholder="e.g. Homepage, Checkout"
                          value={customPageName}
                          onChange={(e) => setCustomPageName(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple={addToPageMode}
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t">
            <Button onClick={onClose} variant="outline" className="flex-1" disabled={captureState === 'capturing' || isUploading}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1" disabled={!canSave || isSaving || captureState === 'capturing' || isUploading}>
              {isSaving ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving…</>
              ) : (
                addToPageMode
                  ? `Add Screenshot${uploadedFiles.length > 1 ? `s (${uploadedFiles.length})` : ''}`
                  : isEditMode ? 'Save Changes' : `Add Screenshot${captureState === 'done' && capturedScreenshots.length > 1 ? `s (${capturedScreenshots.length})` : ''}`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
