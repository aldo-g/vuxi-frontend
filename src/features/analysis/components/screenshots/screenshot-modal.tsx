"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getScreenshotUrl } from '@/lib/report-utils';
import type { Screenshot } from '@/types';

interface ScreenshotModalProps {
  screenshots: Screenshot[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  captureJobId: string;
}

export function ScreenshotModal({ screenshots, initialIndex, isOpen, onClose, captureJobId }: ScreenshotModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const currentScreenshot = screenshots[currentIndex];
  const currentImageUrl = currentScreenshot ? getScreenshotUrl(currentScreenshot, captureJobId) : null;

  // Reset when modal opens or index changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % screenshots.length);
  }, [screenshots.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  }, [screenshots.length]);

  const downloadScreenshot = () => {
    if (currentImageUrl && currentScreenshot) {
      window.open(currentImageUrl, '_blank');
    }
  };

  const openInNewTab = () => {
    if (currentScreenshot?.url) {
      window.open(currentScreenshot.url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
      {/* Close Button */}
      <Button
        onClick={onClose}
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Navigation Arrows */}
      {screenshots.length > 1 && (
        <>
          <Button
            onClick={goToPrevious}
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
          <Button
            onClick={goToNext}
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        </>
      )}

      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        {currentImageUrl && (
          <>
            <Button
              onClick={downloadScreenshot}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              title="Open Screenshot"
            >
              <Download className="w-5 h-5" />
            </Button>
            <Button
              onClick={openInNewTab}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              title="Open Original URL"
            >
              <ExternalLink className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="relative w-full h-full flex items-center justify-center p-8">
        {currentImageUrl && currentScreenshot?.success ? (
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img
              src={currentImageUrl}
              alt={`Screenshot of ${currentScreenshot.url}`}
              className="max-w-full max-h-[calc(100vh-8rem)] object-contain rounded-lg shadow-2xl"
            /></div>
        ) : (
          <div className="text-white text-center">
            <div className="w-24 h-24 mx-auto mb-4 opacity-50">
              <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-lg">Screenshot not available</p>
            <p className="text-sm opacity-75">The image could not be loaded</p>
            {currentImageUrl && (
              <button
                onClick={() => window.open(currentImageUrl, '_blank')}
                className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
              >
                Open in New Tab
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        <div className="flex items-center justify-between text-white">
          <div className="flex-1 min-w-0">
            <p className="text-lg font-medium truncate">{currentScreenshot?.url}</p>
            {currentScreenshot?.data?.viewport && (
              <p className="text-sm opacity-75">
                {currentScreenshot.data.viewport.width} × {currentScreenshot.data.viewport.height}
                {currentScreenshot.data.duration_ms && ` • ${currentScreenshot.data.duration_ms}ms`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 ml-4">
            {screenshots.length > 1 && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {currentIndex + 1} of {screenshots.length}
              </Badge>
            )}
            {currentScreenshot?.data?.isCustom && (
              <Badge variant="secondary" className="bg-green-500/80 text-white border-green-400">
                Custom
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-4 right-4 text-white/60 text-xs">
        <p>ESC: Close • ← →: Navigate</p>
      </div>
    </div>
  );
}