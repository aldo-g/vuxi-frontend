"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, ArrowLeft, Zap, AlertCircle, Pencil, Check, X } from 'lucide-react';
import { ScreenshotGrid } from '../screenshots';
import { ScreenshotModal } from '../screenshots/screenshot-modal';
import { EditScreenshotModal } from '../screenshots/edit-screenshot-modal';
import { useToast } from '@/hooks/use-toast';
import type { ScreenshotReviewProps } from '../../types';
import type { Screenshot } from '@/types';

export function ScreenshotReview({
  screenshots,
  captureJobId,
  organizationName,
  primaryGoal,
  onStartAnalysis,
  onBack,
  isAnalyzing,
  updateAnalysisData,
  error
}: ScreenshotReviewProps) {
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingScreenshot, setEditingScreenshot] = useState<Screenshot | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | undefined>(undefined);
  const [isAddToPageMode, setIsAddToPageMode] = useState(false);
  const [isEditingConfig, setIsEditingConfig] = useState(!organizationName || !primaryGoal);
  const [draftOrg, setDraftOrg] = useState(organizationName);
  const [draftGoal, setDraftGoal] = useState(primaryGoal);
  const { toast } = useToast();

  const handleSaveConfig = () => {
    updateAnalysisData({ organizationName: draftOrg, primaryGoal: draftGoal });
    setIsEditingConfig(false);
  };

  const handleCancelConfig = () => {
    setDraftOrg(organizationName);
    setDraftGoal(primaryGoal);
    setIsEditingConfig(false);
  };

  const handleScreenshotClick = (index: number) => {
    setModalStartIndex(index);
    setIsModalOpen(true);
    setSelectedScreenshotIndex(index);
  };

  const handleEditClick = (index: number) => {
    const screenshot = screenshots[index];
    setEditingScreenshot(screenshot);
    setEditingIndex(index);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (index: number) => {
    const screenshotToDelete = screenshots[index];
    
    // Create a new array without the screenshot at the specified index
    const updatedScreenshots = screenshots.filter((_, i) => i !== index);
    
    // Update the analysis data with the new screenshots array
    updateAnalysisData({ screenshots: updatedScreenshots });
    
    // Reset selected index if it was the deleted one
    if (selectedScreenshotIndex === index) {
      setSelectedScreenshotIndex(null);
    } else if (selectedScreenshotIndex !== null && selectedScreenshotIndex > index) {
      setSelectedScreenshotIndex(selectedScreenshotIndex - 1);
    }
    
    // Show success toast
    toast({
      title: "Screenshot deleted",
      description: `Removed screenshot of ${screenshotToDelete.url}`,
      variant: "default"
    });
    
    console.log(`Deleted screenshot at index ${index}. Remaining screenshots: ${updatedScreenshots.length}`);
  };

  const handleAddClick = () => {
    setEditingScreenshot(null);
    setEditingIndex(undefined);
    setIsEditModalOpen(true);
  };

  const handleDeletePage = (url: string) => {
    const updated = screenshots.filter((s) => s.url !== url);
    updateAnalysisData({ screenshots: updated });
    toast({ title: "Page removed", description: `Removed all screenshots for ${url}` });
  };

  const handleAddToPage = (url: string) => {
    setEditingScreenshot({ url, success: true, data: { url } });
    setEditingIndex(undefined);
    setIsAddToPageMode(true);
    setIsEditModalOpen(true);
  };

  const handleRefreshScreenshots = (url: string, newScreenshots: Screenshot[]) => {
    // Replace all screenshots for this URL with the freshly captured ones
    const withoutOld = screenshots.filter((s) => s.url !== url);
    updateAnalysisData({ screenshots: [...withoutOld, ...newScreenshots] });
  };

  const handleSaveScreenshot = (newScreenshots: Screenshot[]) => {
    if (typeof editingIndex === 'number' && newScreenshots.length === 1) {
      // Editing a single existing screenshot
      const updatedScreenshots = [...screenshots];
      updatedScreenshots[editingIndex] = newScreenshots[0];
      updateAnalysisData({ screenshots: updatedScreenshots });
    } else if (typeof editingIndex === 'number') {
      // Edit replaced with multiple (e.g. recaptured with interactions) — replace the one entry
      const updatedScreenshots = [
        ...screenshots.slice(0, editingIndex),
        ...newScreenshots,
        ...screenshots.slice(editingIndex + 1),
      ];
      updateAnalysisData({ screenshots: updatedScreenshots });
    } else {
      // Add new screenshots
      updateAnalysisData({ screenshots: [...screenshots, ...newScreenshots] });
    }

    // Close edit modal
    closeEditModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalStartIndex(0);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingScreenshot(null);
    setEditingIndex(undefined);
    setIsAddToPageMode(false);
  };

  return (
    <Card className="border-slate-200 bg-white shadow-lg">
      <CardHeader className="text-center pb-6">
        <div className="w-16 h-16 bg-white border-2 border-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-slate-900" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Review your captures</CardTitle>
        <p className="text-slate-500 mt-2 max-w-md mx-auto">
          Take a moment to check what was grabbed. Some pages may have been missed due to auth, bot protection, or lazy loading — that&apos;s totally normal.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Heads-up notice */}
        <div className="flex gap-3 p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-xl">
          <AlertCircle className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-indigo-700 leading-relaxed">
            <strong>The more pages the better.</strong> If anything looks incomplete, upload your own screenshots using the &quot;Add new page&quot; button below — a good mix of pages gives the AI a much fuller picture of your site.
          </p>
        </div>

        {/* Screenshot Grid */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Captured Pages ({new Set(screenshots.map(s => s.url)).size})</h3>
          <ScreenshotGrid
            screenshots={screenshots}
            captureJobId={captureJobId}
            onScreenshotClick={handleScreenshotClick}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            onAddClick={handleAddClick}
            onAddToPage={handleAddToPage}
            onDeletePage={handleDeletePage}
            onRefreshScreenshots={handleRefreshScreenshots}
          />
        </div>

        {/* Analysis Configuration */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Analysis Configuration</h3>
            {!isEditingConfig ? (
              <Button variant="ghost" size="sm" onClick={() => setIsEditingConfig(true)} className="h-8 text-slate-500 hover:text-slate-900">
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancelConfig} className="h-8 text-slate-500">
                  <X className="w-3.5 h-3.5 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveConfig} className="h-8">
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Save
                </Button>
              </div>
            )}
          </div>
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-slate-900">Analysis Summary</h4>
            <div className="text-sm text-slate-600 space-y-2">
              <p><strong>Website:</strong> {screenshots[0]?.url || ''}</p>
              <div className="flex items-start gap-2">
                <strong className="shrink-0 mt-1.5">Organization:</strong>
                {isEditingConfig ? (
                  <Input
                    value={draftOrg}
                    onChange={e => setDraftOrg(e.target.value)}
                    className="h-8 text-sm"
                  />
                ) : (
                  <span className="mt-1">{organizationName}</span>
                )}
              </div>
              <div className="flex items-start gap-2">
                <strong className="shrink-0 mt-1.5">Primary goal:</strong>
                {isEditingConfig ? (
                  <Textarea
                    value={draftGoal}
                    onChange={e => setDraftGoal(e.target.value)}
                    className="text-sm min-h-[60px]"
                  />
                ) : (
                  <span className="mt-1">{primaryGoal}</span>
                )}
              </div>
              <p><strong>Pages Captured:</strong> {new Set(screenshots.map(s => s.url)).size}</p>
            </div>
          </div>
        </div>

        {/* Missing config warning */}
        {(!organizationName || !primaryGoal) && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">Please fill in the Organization name and Primary goal above before starting analysis.</span>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t border-slate-200">
          <Button 
            onClick={onBack}
            variant="outline"
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={onStartAnalysis}
            disabled={screenshots.length === 0 || isAnalyzing || !organizationName || !primaryGoal}
            title={!organizationName || !primaryGoal ? 'Fill in Organization and Primary goal before starting analysis' : undefined}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Zap className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Starting Analysis...' : 'Start AI Analysis'}
          </Button>
        </div>
      </CardContent>

      {/* Full-Screen Screenshot Modal */}
      <ScreenshotModal
        screenshots={screenshots}
        initialIndex={modalStartIndex}
        isOpen={isModalOpen}
        onClose={closeModal}
        captureJobId={captureJobId}
        onDelete={handleDeleteClick}
      />

      {/* Add/Edit Screenshot Modal */}
      <EditScreenshotModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={handleSaveScreenshot}
        editingScreenshot={editingScreenshot}
        editingIndex={editingIndex}
        captureJobId={captureJobId}
        addToPageMode={isAddToPageMode}
      />
    </Card>
  );
}