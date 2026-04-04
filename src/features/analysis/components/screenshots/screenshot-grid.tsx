"use client";

import React, { useState } from 'react';
import { Globe, ExternalLink, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { getScreenshotUrl, getPageDisplayName } from '@/lib/report-utils';
import type { Screenshot } from '@/types';

interface ScreenshotGridProps {
  screenshots: Screenshot[];
  captureJobId: string;
  onScreenshotClick: (index: number) => void;
  onEditClick: (index: number) => void;
  onDeleteClick: (index: number) => void;
  onAddClick: () => void;
  onAddToPage?: (url: string) => void;
  onDeletePage?: (url: string) => void;
  onRefreshScreenshots?: (url: string, newScreenshots: Screenshot[]) => void;
}

export function ScreenshotGrid({
  screenshots,
  captureJobId,
  onScreenshotClick,
  onEditClick,
  onDeleteClick,
  onAddClick,
  onAddToPage,
  onDeletePage,
  onRefreshScreenshots
}: ScreenshotGridProps) {
  // Group screenshots by URL, preserving original indices
  const grouped = React.useMemo(() => {
    const map = new Map<string, { items: { screenshot: Screenshot; index: number }[]; primaryIndex: number }>();
    screenshots.forEach((screenshot, index) => {
      const key = screenshot.url;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { items: [{ screenshot, index }], primaryIndex: index });
      } else {
        existing.items.push({ screenshot, index });
        // Prefer baseline/standard as primary
        const filename = screenshot.data?.filename ?? '';
        if (filename.includes('baseline') || filename.includes('standard')) {
          existing.primaryIndex = index;
        }
      }
    });
    return Array.from(map.values());
  }, [screenshots]);

  return (
    <div className="space-y-4">
      {grouped.map(({ items, primaryIndex }) => {
        const primary = screenshots[primaryIndex];
        const pageName = getPageDisplayName(primary.url, primary.data?.customPageName);
        return (
          <PageGroup
            key={primary.url}
            pageName={pageName}
            items={items}
            primaryIndex={primaryIndex}
            captureJobId={captureJobId}
            screenshots={screenshots}
            onScreenshotClick={onScreenshotClick}
            onEditClick={onEditClick}
            onDeleteClick={onDeleteClick}
            onAddToPage={onAddToPage}
            onDeletePage={onDeletePage}
            onRefreshScreenshots={onRefreshScreenshots}
          />
        );
      })}

      {/* Add new page card */}
      <div
        className="border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-colors cursor-pointer group p-4 flex items-center gap-3"
        onClick={onAddClick}
      >
        <div className="flex-shrink-0 w-8 h-8 bg-slate-200 group-hover:bg-slate-300 rounded-lg flex items-center justify-center transition-colors">
          <Plus className="w-4 h-4 text-slate-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-600 group-hover:text-slate-700">Add new page</p>
          <p className="text-xs text-slate-400">Capture or upload a screenshot for a new URL</p>
        </div>
      </div>
    </div>
  );
}

interface PageGroupProps {
  pageName: string;
  items: { screenshot: Screenshot; index: number }[];
  primaryIndex: number;
  captureJobId: string;
  screenshots: Screenshot[];
  onScreenshotClick: (index: number) => void;
  onEditClick: (index: number) => void;
  onDeleteClick: (index: number) => void;
  onAddToPage?: (url: string) => void;
  onDeletePage?: (url: string) => void;
  onRefreshScreenshots?: (url: string, newScreenshots: Screenshot[]) => void;
}

function PageGroup({
  pageName,
  items,
  primaryIndex,
  captureJobId,
  screenshots,
  onScreenshotClick,
  onEditClick,
  onDeleteClick,
  onAddToPage,
  onDeletePage,
  onRefreshScreenshots,
}: PageGroupProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const primary = screenshots[primaryIndex];
  const url = primary.url;

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!captureJobId || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/capture/refresh-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, jobId: captureJobId }),
      });
      if (!res.ok) throw new Error('Refresh failed');
      const data = await res.json();
      const freshScreenshots: Screenshot[] = [
        { url, success: true, data: { url, filename: data.filename, path: data.path, timestamp: data.timestamp } },
        ...(data.interactions ?? [])
          .filter((i: { status: string }) => i.status === 'captured')
          .map((i: { filename: string; path?: string }) => ({
            url,
            success: true,
            data: { url, filename: i.filename, path: i.path ?? `desktop/${i.filename}`, timestamp: data.timestamp },
          })),
      ];
      onRefreshScreenshots?.(url, freshScreenshots);
    } catch (err) {
      console.error('Failed to refresh screenshot:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
      {/* Page header */}
      <div className="p-3 border-b border-slate-100 flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (url.startsWith('http')) window.open(url, '_blank', 'noopener,noreferrer');
          }}
          disabled={!url.startsWith('http')}
          className={`flex-shrink-0 w-7 h-7 bg-slate-100 rounded-md flex items-center justify-center transition-colors ${
            url.startsWith('http') ? 'hover:bg-teal-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'
          }`}
          title={url.startsWith('http') ? `Open ${url}` : undefined}
        >
          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 text-sm truncate">{pageName}</p>
          <p className="text-xs text-slate-400 font-mono truncate">{url}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-slate-400">{items.length} screenshot{items.length !== 1 ? 's' : ''}</span>
          {captureJobId && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all disabled:opacity-40"
              title="Recapture this page"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
          {onDeletePage && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
              title="Delete this page"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDeletePage && confirmDelete && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-red-500">Delete page?</span>
              <button
                onClick={() => onDeletePage(url)}
                className="text-xs px-2 py-0.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Screenshots row */}
      <div className="p-3 flex gap-3 overflow-x-auto">
        {items.map(({ screenshot, index }) => (
          <ScreenshotThumb
            key={index}
            screenshot={screenshot}
            index={index}
            captureJobId={captureJobId}
            onScreenshotClick={onScreenshotClick}
            onEditClick={onEditClick}
            onDeleteClick={onDeleteClick}
            canDelete={items.length > 1}
          />
        ))}

        {/* Add screenshot to this page */}
        <button
          onClick={() => onAddToPage?.(url)}
          className="flex-shrink-0 w-32 aspect-video border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all"
          title="Add screenshot to this page"
        >
          <Plus className="w-4 h-4" />
          <span className="text-xs">Add state</span>
        </button>
      </div>
    </div>
  );
}

interface ScreenshotThumbProps {
  screenshot: Screenshot;
  index: number;
  captureJobId: string;
  onScreenshotClick: (index: number) => void;
  onEditClick: (index: number) => void;
  onDeleteClick: (index: number) => void;
  canDelete: boolean;
}

function ScreenshotThumb({
  screenshot,
  index,
  captureJobId,
  onScreenshotClick,
  onEditClick,
  onDeleteClick,
  canDelete,
}: ScreenshotThumbProps) {
  const imageUrl = getScreenshotUrl(screenshot, captureJobId);
  const filename = screenshot.data?.filename ?? '';
  const label = screenshot.data?.customPageName
    ?? (filename.includes('baseline') || filename.includes('standard') ? 'Baseline'
      : filename ? filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      : 'Screenshot');

  return (
    <div className="flex-shrink-0 w-32 group/thumb relative">
      {/* Image */}
      <div
        className="w-32 aspect-video bg-slate-100 rounded-lg overflow-hidden cursor-pointer relative border border-slate-200 hover:border-teal-300 transition-colors"
        onClick={() => onScreenshotClick(index)}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={label}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Globe className="w-6 h-6" />
          </div>
        )}
        {screenshot.data?.isCustom && (
          <div className="absolute top-1 left-1 bg-green-500 rounded-full w-2 h-2" title="Custom upload" />
        )}
        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/20 transition-colors rounded-lg" />
      </div>

      {/* Label + actions */}
      <div className="mt-1 flex items-center justify-between gap-1">
        <span className="text-xs text-slate-500 truncate flex-1 capitalize">{label}</span>
        <div className="flex gap-0.5 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEditClick(index); }}
            className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all"
            title="Replace screenshot"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteClick(index); }}
              className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
              title="Delete this screenshot"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
