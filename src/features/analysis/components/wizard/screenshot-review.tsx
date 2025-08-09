"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, ArrowLeft, Zap } from 'lucide-react';
import { ScreenshotGrid } from '../screenshots';
import { ScreenshotModal } from '../screenshots/screenshot-modal';
import { EditScreenshotModal } from '../screenshots/edit-screenshot-modal';
import { AnalysisSummary } from '../analysis-summary';
import { useToast } from '@/hooks/use-toast';
import type { ScreenshotReviewProps } from '../../types';
import type { Screenshot } from '@/types';

export function ScreenshotReview({
  screenshots,
  captureJobId,
  onStartAnalysis,
  onBack,
  isAnalyzing,
  updateAnalysisData
}: ScreenshotReviewProps) {
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingScreenshot, setEditingScreenshot] = useState<Screenshot | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { toast } = useToast();

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
    setEditingIndex(null);
    setIsEditModalOpen(true);
  };

  const handleSaveScreenshot = (newScreenshot: Screenshot) => {
    if (editingIndex !== null) {
      // Edit existing screenshot
      const updatedScreenshots = [...screenshots];
      updatedScreenshots[editingIndex] = newScreenshot;
      updateAnalysisData({ screenshots: updatedScreenshots });
    } else {
      // Add new screenshot
      const updatedScreenshots = [...screenshots, newScreenshot];
      updateAnalysisData({ screenshots: updatedScreenshots });
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
    setEditingIndex(null);
  };

  return (
    <Card className="border-slate-200 bg-white shadow-lg">
      <CardHeader className="text-center pb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-semibold">Review Captured Screenshots</CardTitle>
        <p className="text-slate-600 mt-2">
          Review the captured screenshots and start the AI analysis when ready.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Screenshot Grid */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Captured Pages ({screenshots.length})</h3>
          <ScreenshotGrid
            screenshots={screenshots}
            captureJobId={captureJobId}
            onScreenshotClick={handleScreenshotClick}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            onAddClick={handleAddClick}
          />
        </div>

        {/* Analysis Summary */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Analysis Configuration</h3>
          <AnalysisSummary analysisData={{
            websiteUrl: screenshots[0]?.url || '',
            organizationName: 'Current Analysis',
            sitePurpose: 'Website analysis',
            screenshots
          }} />
        </div>

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
            disabled={screenshots.length === 0 || isAnalyzing}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
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
      />

      {/* Add/Edit Screenshot Modal */}
      <EditScreenshotModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={handleSaveScreenshot}
        editingScreenshot={editingScreenshot}
        editingIndex={editingIndex}
        captureJobId={captureJobId}
      />
    </Card>
  );
}