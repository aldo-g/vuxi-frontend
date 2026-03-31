"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Info } from "lucide-react";

interface AnalysisContext {
  industry: string;
  primaryGoal: string;
  targetAudience: string;
  sitePurpose: string;
}

interface ExecutiveSummaryProps {
  summary: {
    executive_summary: string;
    overall_score: number;
    total_pages_analyzed: number;
  };
  analysisContext?: AnalysisContext | null;
}

export function ExecutiveSummary({ summary, analysisContext }: ExecutiveSummaryProps) {
  return (
    <Card className="bg-white rounded-2xl border border-slate-200/70 shadow-lg">
      <CardHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
        <CardTitle className="flex items-center gap-3 text-slate-900">
          <div className="h-8 w-8 bg-blue-50 rounded-xl flex items-center justify-center">
            <FileText className="h-4 w-4 text-blue-500" />
          </div>
          <span className="text-xl font-semibold">Executive Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-5 space-y-4">
        <p className="text-slate-600 leading-relaxed text-sm">
          {summary.executive_summary}
        </p>
        {analysisContext && (
          <div className="border-t border-slate-100 pt-4 space-y-2.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3 h-3" /> Analysis Context
            </p>
            <div className="flex flex-wrap gap-2">
              {analysisContext.industry && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-medium">
                  <span className="text-violet-400">Industry</span>
                  <span className="w-px h-3 bg-violet-200" />
                  {analysisContext.industry}
                </span>
              )}
              {analysisContext.targetAudience && analysisContext.targetAudience.split(',').map((a: string, i: number) => (
                <span key={a.trim()} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                  {i === 0 && <><span className="text-blue-400">Audience</span><span className="w-px h-3 bg-blue-200" /></>}
                  {a.trim()}
                </span>
              ))}
            </div>
            {analysisContext.primaryGoal && (
              <p className="text-sm text-slate-500 italic">{analysisContext.primaryGoal}</p>
            )}
            {analysisContext.sitePurpose && (
              <p className="text-sm text-slate-500 italic">{analysisContext.sitePurpose}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
