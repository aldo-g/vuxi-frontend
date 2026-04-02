"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Plus, ExternalLink, Calendar, Trash2, Building2, ChevronDown, ChevronUp, TrendingUp, Play, Ticket, Bug, X } from 'lucide-react';
import { FormattedDate } from '@/components/common';
import { QuickActions, DashboardStats } from '@/components/dashboard';
import { NoCreditsDialog } from './no-credits-dialog';
import { useCurrentUser } from '@/hooks/use-current-user';
import Link from 'next/link';

interface AnalysisRun {
  id: number;
  status: string;
  overallScore?: number;
  createdAt: string;
}

interface Project {
  id: number;
  name: string;
  baseUrl: string;
  orgName?: string;
  orgPurpose?: string;
  createdAt: string;
  analysisRuns?: AnalysisRun[];
}

interface DashboardClientProps {
  projects?: Project[];
}

function getProjectStatus(project: Project): { 
  status: string; 
  icon: React.ReactNode;
  iconColor: string;
} {
  if (!project.analysisRuns || project.analysisRuns.length === 0) {
    return { 
      status: 'No Analysis',
      icon: <div className="h-3 w-3 rounded-full bg-slate-400"></div>,
      iconColor: 'text-slate-400'
    };
  }

  // If any run is completed, show Available regardless of newer pending/running runs
  const hasCompleted = project.analysisRuns.some(r => r.status === 'completed');
  if (hasCompleted) {
    return {
      status: 'Available',
      icon: <div className="h-3 w-3 rounded-full bg-green-500"></div>,
      iconColor: 'text-green-500'
    };
  }

  const latestRun = project.analysisRuns[0]; // Sorted by creation date desc

  switch (latestRun.status) {
    case 'running':
    case 'pending':
      return {
        status: 'Pending',
        icon: <div className="h-3 w-3 rounded-full bg-orange-500"></div>,
        iconColor: 'text-orange-500'
      };
    case 'failed':
    case 'error':
      return {
        status: 'Failed',
        icon: <div className="h-3 w-3 rounded-full bg-red-500"></div>,
        iconColor: 'text-red-500'
      };
    default:
      return {
        status: 'Unknown',
        icon: <div className="h-3 w-3 rounded-full bg-slate-400"></div>,
        iconColor: 'text-slate-400'
      };
  }
}

function getScoreColor(score: number): string {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-yellow-600';
  return 'text-red-500';
}

function ScoreTrend({ runs }: { runs: AnalysisRun[] }) {
  const scored = runs.filter(r => r.overallScore != null && r.status === 'completed').slice().reverse();
  if (scored.length < 2) return null;
  const first = scored[0].overallScore!;
  const last = scored[scored.length - 1].overallScore!;
  const diff = last - first;
  if (diff === 0) return null;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${diff > 0 ? 'text-green-600' : 'text-red-500'}`}>
      <TrendingUp className={`h-3 w-3 ${diff < 0 ? 'rotate-180' : ''}`} />
      {diff > 0 ? '+' : ''}{diff.toFixed(1)}
    </span>
  );
}

function RunRow({ run, isLatest, reportHref, onDeleted }: {
  run: AnalysisRun;
  isLatest: boolean;
  reportHref: string | null;
  onDeleted: (id: number) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      onDeleted(run.id);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500">
          <FormattedDate dateString={run.createdAt} />
        </span>
        {isLatest && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Latest</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {run.overallScore != null && (
          <span className={`text-sm font-semibold ${getScoreColor(run.overallScore)}`}>
            {run.overallScore}/10
          </span>
        )}
        <span className={`text-xs font-medium ${
          run.status === 'completed' ? 'text-green-600' :
          run.status === 'failed' || run.status === 'error' ? 'text-red-500' :
          'text-orange-500'
        }`}>
          {run.status === 'completed' ? 'Completed' :
           run.status === 'failed' || run.status === 'error' ? 'Failed' : 'Pending'}
        </span>
        {reportHref ? (
          <Button asChild size="sm" variant="outline" className="h-7 text-xs px-3">
            <Link href={reportHref}>View</Link>
          </Button>
        ) : (
          <div className="w-[52px]" />
        )}
        {confirming ? (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="h-7 text-xs px-2"
            >
              {deleting ? '...' : 'Delete'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirming(false)}
              className="h-7 text-xs px-2"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirming(true)}
            className="h-7 w-7 p-0 text-slate-300 hover:text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project, onDeleted, userCredits }: {
  project: Project;
  onDeleted: (id: number) => void;
  userCredits: number;
}) {
  const { status, icon, iconColor } = getProjectStatus(project);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [runs, setRuns] = useState<AnalysisRun[]>(project.analysisRuns || []);
  const [noCreditsOpen, setNoCreditsOpen] = useState(false);
  const [credits, setCredits] = useState(userCredits);

  React.useEffect(() => { setCredits(userCredits); }, [userCredits]);

  const latestCompletedRun = runs.find(run => run.status === 'completed');
  const reportHref = latestCompletedRun ? `/report/${latestCompletedRun.id}` : null;
  const hasMultipleRuns = runs.length > 1;

  const handleRunDeleted = async (runId: number) => {
    const res = await fetch(`/api/reports/${runId}`, { method: 'DELETE' });
    if (res.ok) {
      setRuns(prev => prev.filter(r => r.id !== runId));
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDeleted(project.id);
      }
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <Card className="w-full bg-white/90 backdrop-blur-sm border-slate-200/80 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Left side - Project info */}
          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-slate-900 line-clamp-1">
                {project.orgName || project.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="line-clamp-1">{project.baseUrl}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created: <FormattedDate dateString={project.createdAt} />
              </span>
              {runs.length > 0 && (
                <span className="text-slate-400">·</span>
              )}
              {runs.length > 0 && (
                <span>{runs.length} report{runs.length === 1 ? '' : 's'}</span>
              )}
              <ScoreTrend runs={runs} />
            </div>
          </div>

          {/* Right side - Status + View Report + Delete */}
          <div className="flex items-center gap-4 ml-6">
            {latestCompletedRun?.overallScore != null && (
              <div className="text-right">
                <div className={`text-lg font-bold ${getScoreColor(latestCompletedRun.overallScore)}`}>
                  {latestCompletedRun.overallScore}/10
                </div>
                <div className="text-xs text-slate-400">Score</div>
              </div>
            )}
            <div className="flex items-center gap-2">
              {icon}
              <span className={`text-sm font-medium ${iconColor}`}>{status}</span>
            </div>

            {credits > 0 ? (
              <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                <Link href={`/create-analysis?url=${encodeURIComponent(project.baseUrl)}&projectId=${project.id}`}>
                  <Play className="h-3 w-3 mr-1" />
                  Run Analysis
                </Link>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs text-slate-400 border-slate-200"
                onClick={() => setNoCreditsOpen(true)}
              >
                <Ticket className="h-3 w-3 mr-1" />
                Run Analysis
              </Button>
            )}

            {reportHref && (
              <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                <Link href={reportHref}>
                  View Latest
                </Link>
              </Button>
            )}

            {hasMultipleRuns && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpanded(!expanded)}
                className="h-8 px-2 text-slate-500 hover:text-slate-700"
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span className="ml-1 text-xs">History</span>
              </Button>
            )}

            {confirming ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Delete project?</span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="h-7 text-xs px-2"
                >
                  {deleting ? 'Deleting...' : 'Yes, delete'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirming(false)}
                  className="h-7 text-xs px-2"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirming(true)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <NoCreditsDialog
          open={noCreditsOpen}
          onClose={() => setNoCreditsOpen(false)}
          onRedeemed={(newTotal) => setCredits(newTotal)}
        />

        {/* Report history */}
        {expanded && hasMultipleRuns && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Analysis History</h4>
            <div className="space-y-2">
              {runs.map((run, index) => {
                const isLatest = index === 0;
                const runReportHref = run.status === 'completed' ? `/report/${run.id}` : null;
                return (
                  <RunRow
                    key={run.id}
                    run={run}
                    isLatest={isLatest}
                    reportHref={runReportHref}
                    onDeleted={handleRunDeleted}
                  />
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreateProjectCard() {
  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] border-dashed">
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Plus className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Create Your First Analysis
            </h3>
            <p className="text-slate-600 text-sm">
              Start analyzing any website to gain valuable UX insights and optimization opportunities.
            </p>
          </div>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 shrink-0">
          <Link href="/analysis">
            Start Analysis
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function DashboardClient({ projects: initialProjects = [] }: DashboardClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [bugMessage, setBugMessage] = useState("");
  const [bugSending, setBugSending] = useState(false);
  const [bugSent, setBugSent] = useState(false);
  const { user, loading: userLoading } = useCurrentUser();

  const handleProjectDeleted = (id: number) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  // Calculate stats from projects
  const stats = {
    totalReports: projects.reduce((acc, project) => acc + (project.analysisRuns?.length || 0), 0),
    avgScore: projects.length > 0
      ? projects
          .flatMap(p => p.analysisRuns?.filter(run => run.overallScore) || [])
          .reduce((acc, run, idx, arr) => {
            const sum = acc + (run.overallScore || 0);
            return idx === arr.length - 1 ? sum / arr.length : sum;
          }, 0) || 0
      : 0,
    lastAnalysis: projects[0]?.analysisRuns?.[0]?.createdAt || projects[0]?.createdAt,
    completedAnalyses: projects.reduce((acc, project) =>
      acc + (project.analysisRuns?.filter(run => run.status === 'completed').length || 0), 0
    ),
  };

  async function handleSendIssue() {
    if (!bugMessage.trim() || bugSending) return;
    setBugSending(true);
    try {
      await fetch('/api/report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: bugMessage, context: 'Dashboard', userName: user?.Name, userEmail: user?.email }),
      });
      setBugSent(true);
      setTimeout(() => {
        setBugReportOpen(false);
        setBugMessage('');
        setBugSent(false);
      }, 1500);
    } finally {
      setBugSending(false);
    }
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Welcome to Vuxi
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {projects.length > 0 
              ? "Access your UX analysis reports and explore insights from professional evaluations."
              : "Get started by creating your first UX analysis to gain valuable insights."
            }
          </p>
        </div>

        {/* Stats Section */}
        <DashboardStats stats={stats} />

        {/* Quick Actions */}
        <QuickActions userCredits={user?.credits ?? 0} />

        {/* Projects Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                {projects.length > 0 ? 'Your Projects' : 'Get Started'}
              </h2>
              <p className="text-slate-600 mt-1">
                {projects.length > 0
                  ? `${projects.length} website${projects.length === 1 ? '' : 's'} · ${projects.reduce((acc, p) => acc + (p.analysisRuns?.length || 0), 0)} total report${projects.reduce((acc, p) => acc + (p.analysisRuns?.length || 0), 0) === 1 ? '' : 's'}`
                  : 'Create your first UX analysis project'
                }
              </p>
            </div>
          </div>

          {/* Project List - Full Width Cards */}
          <div className="space-y-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onDeleted={handleProjectDeleted} userCredits={user?.credits ?? 0} />
            ))}
          </div>
        </div>

        {/* Recent Activity Section - Only show if there are multiple projects */}
        {projects && projects.length > 3 && (
          <Card className="bg-white/90 backdrop-blur-sm border-slate-200/80 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-2xl font-semibold text-slate-900">Recent Activity</CardTitle>
              <CardDescription className="text-slate-600">
                Your most recent analysis projects and their performance.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {projects.slice(0, 5).map((project) => {
                  const latestRun = project.analysisRuns?.[0];
                  const { status, icon, iconColor } = getProjectStatus(project);
                  
                  return (
                    <div key={project.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <Building2 className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{project.orgName || project.name}</h3>
                          <p className="text-sm text-slate-600">{project.baseUrl}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {latestRun?.overallScore && (
                          <div className="text-right">
                            <div className="font-semibold text-slate-900">{latestRun.overallScore}/10</div>
                            <div className="text-xs text-slate-500">Score</div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {icon}
                          <span className={`text-sm font-medium ${iconColor}`}>
                            {status}
                          </span>
                        </div>
                        <span className="text-sm text-slate-500 min-w-fit">
                          <FormattedDate dateString={project.createdAt} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>

      {/* Floating Bug Report Button */}
      <button
        onClick={() => setBugReportOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-4 py-3 rounded-full shadow-lg transition-colors duration-200"
        aria-label="Report an issue"
      >
        <Bug className="w-4 h-4" />
        Report Issue
      </button>

      {/* Bug Report Modal */}
      {bugReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Bug className="w-5 h-5 text-slate-600" />
                Report an Issue
              </h2>
              <button
                onClick={() => { setBugReportOpen(false); setBugMessage(""); }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Describe the issue and we&apos;ll look into it.
            </p>
            <textarea
              className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
              rows={5}
              placeholder="Describe the issue..."
              value={bugMessage}
              onChange={(e) => setBugMessage(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setBugReportOpen(false); setBugMessage(""); }}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendIssue}
                disabled={bugSending || bugSent || !bugMessage.trim()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {bugSent ? 'Sent!' : bugSending ? 'Sending…' : 'Send Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}