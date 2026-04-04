/**
 * Report Overview Page - Analysis Results Dashboard
 * 
 * Dynamic page component that displays comprehensive UX analysis
 * results for a specific report. Shows executive summary, page analyses,
 * and detailed insights with interactive visualizations.
 * 
 * @responsibilities
 * - Fetches and displays report data by ID
 * - Renders executive summary and overall scores
 * - Shows paginated list of analyzed pages
 * - Provides navigation to individual page analyses
 * - Handles data loading states and error conditions
 * - Displays screenshots and performance metrics
 */

"use client";

import { useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ExternalLink, ChevronRight, Zap, Lightbulb, ListChecks, MapIcon, Palette, Trophy, Route, FileText, TrendingUp, ShieldCheck, MessageSquareHeart, Target as TargetIcon, CheckCircle2, AlertTriangleIcon, AlertCircle, Bug, X, Download } from "lucide-react";

// Migrated Components
import { ExecutiveSummary } from "@/features/reports";
import { FormattedDate } from "@/components/common";

// --- Interfaces from original Index.tsx ---
interface PageIssue {
  issue: string;
  how_to_fix?: string;
}
interface PageRecommendation {
  recommendation: string;
  benefit?: string;
}
interface PageAnalysisDetail {
  id: string;
  page_type: string;
  title: string;
  overall_score: number;
  url: string;
  section_scores: { [key: string]: number };
  key_issues: PageIssue[];
  recommendations: PageRecommendation[];
  summary: string;
  overall_explanation?: string;
  sections?: Array<{ name: string; title: string; score: number; summary: string; points: string[]; evidence: string; score_explanation: string; }>;
  detailed_analysis?: string;
  raw_analysis?: string;
  screenshot_path?: string;
}
interface OverallSummary {
  executive_summary: string;
  overall_score: number;
  site_score_explanation?: string;
  total_pages_analyzed: number;
  most_critical_issues: string[];
  top_recommendations: string[];
  key_strengths: string[];
  performance_summary: string;
  detailed_markdown_content: string;
}
interface ReportMetadata {
  organization_name?: string;
  generated_at?: string;
  total_pages?: number;
  industry?: string;
  primary_goal?: string;
  target_audience?: string;
}
interface ReportData {
  organization: string;
  analysis_date: string;
  timestamp?: string;
  overall_summary: OverallSummary;
  page_analyses: PageAnalysisDetail[];
  metadata?: ReportMetadata;
  project?: {
    industry?: string;
    primaryGoal?: string;
    targetAudience?: string;
    [key: string]: unknown;
  };
}

// --- Helper Functions from original Index.tsx ---
const fetchReportData = async (reportId: string | undefined): Promise<ReportData & { captureJobId?: string }> => {
    if (!reportId) {
        throw new Error("Report ID is undefined. Cannot fetch report data.");
    }
    const response = await fetch(`/api/reports/${reportId}`);

    if (!response.ok) {
        throw new Error(`Report not found (${response.status})`);
    }
    const { reportData: data, captureJobId, project } = await response.json();
    if (!data.overall_summary) {
        data.overall_summary = {
            executive_summary: "Executive summary not available.",
            overall_score: 0,
            most_critical_issues: [],
            top_recommendations: [],
            key_strengths: [],
            detailed_markdown_content: "# Overview Not Available"
        };
    }
    if (!data.page_analyses) {
        data.page_analyses = [];
    }
    data.captureJobId = captureJobId;
    data.project = project;
    return data;
};

const getScoreBoxClasses = (score: number): string => {
  if (score >= 9) return "bg-teal-50 text-teal-800 border-teal-200";
  if (score >= 7) return "bg-teal-50 text-teal-700 border-teal-200";
  if (score >= 5) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
};

const getOverallScoreStatusText = (score: number) => {
  if (score >= 8) return "Excellent";
  if (score >= 6) return "Good";
  return "Needs Work";
};

const getProgressColorClass = (score: number): string => {
  if (score >= 8) return "bg-teal-400";
  if (score >= 6) return "bg-teal-300";
  if (score >= 4) return "bg-amber-300";
  return "bg-rose-300";
};

const getScoreColorTextClass = (score: number): string => {
  if (score >= 8) return "text-teal-700";
  if (score >= 6) return "text-teal-600";
  if (score >= 4) return "text-amber-600";
  return "text-rose-600";
};

const extractPageRoleAnalysis = (content: string | undefined): string | null => {
  if (!content) return null;
  const lines = content.split('\n');
  let pageRoleContent: string[] = [];
  let inPageRoleSection = false;
  const pageRoleKeywords = ['PAGE ROLE ANALYSIS', 'PAGE ROLE:', 'ROLE OF THIS PAGE:'];
  lines.forEach((line) => {
    const trimmedLine = line.trim();
    const upperLine = trimmedLine.toUpperCase();
    if (pageRoleKeywords.some(keyword => upperLine.startsWith(keyword))) {
      inPageRoleSection = true;
      const contentAfterKeyword = trimmedLine.substring(upperLine.indexOf(':') + 1).trim();
      if (contentAfterKeyword) pageRoleContent.push(contentAfterKeyword);
    } else if (trimmedLine.startsWith('## ') && inPageRoleSection) {
      if (!pageRoleKeywords.some(keyword => upperLine.startsWith(keyword))) inPageRoleSection = false;
    } else if (inPageRoleSection && trimmedLine && !trimmedLine.toUpperCase().includes('EVIDENCE:')) {
      pageRoleContent.push(trimmedLine);
    }
  });
  const result = pageRoleContent.join(' ').trim();
  return result || null;
};

const parseDetailedAnalysisSections = (content: string | undefined, sectionScores: { [key: string]: number } = {}): Array<{ name: string; title: string; score: number; summary: string; points: string[]; evidence: string; score_explanation: string; rawContent?: string }> => {
  if (!content) return [];
  const lines = content.split('\n');
  const parsedSections: Array<{ name: string; title: string; score: number; summary: string; points: string[]; evidence: string; score_explanation: string; rawContent?: string }> = [];
  const titleToScoreKey: { [key: string]: string } = {
    'FIRST IMPRESSION & CLARITY': 'first_impression_clarity',
    'GOAL ALIGNMENT': 'goal_alignment',
    'VISUAL DESIGN': 'visual_design',
    'CONTENT QUALITY': 'content_quality',
    'USABILITY & ACCESSIBILITY': 'usability_accessibility',
    'CONVERSION OPTIMIZATION': 'conversion_optimization',
    'TECHNICAL EXECUTION': 'technical_execution'
  };
  let currentSectionData: { title?: string; name?: string; score?: number; summary?: string; points?: string[]; evidence?: string; score_explanation?: string; contentBuffer?: string[] } = {};
  let collectingEvidence = false;

  const finalizeSection = () => {
    if (currentSectionData.title) {
      const scoreKey = titleToScoreKey[currentSectionData.title.toUpperCase() as keyof typeof titleToScoreKey];
      const scoreValue = scoreKey ? sectionScores[scoreKey] : undefined;
      const sectionRawScoreMatch = currentSectionData.title.match(/\(Score:\s*(\d+)\/10\)/i);
      let finalScore = 5;
      if (typeof scoreValue === 'number') finalScore = scoreValue;
      else if (sectionRawScoreMatch?.[1]) finalScore = parseInt(sectionRawScoreMatch[1], 10);
      else if (typeof currentSectionData.score === 'number') finalScore = currentSectionData.score;
      const cleanTitle = currentSectionData.title.replace(/\s*\(Score:\s*\d+\/10\)/i, '').trim();
      parsedSections.push({
        name: currentSectionData.name || cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        title: cleanTitle,
        score: finalScore,
        summary: currentSectionData.summary || "Summary not available.",
        points: currentSectionData.points || [],
        evidence: currentSectionData.evidence || "Evidence not specified.",
        score_explanation: currentSectionData.score_explanation || "Score explanation not provided.",
        rawContent: (currentSectionData.contentBuffer || []).join('\n').trim() || undefined,
      });
    }
    currentSectionData = {};
    collectingEvidence = false;
  };

  for (const line of lines) {
    const trimmedLine = line.trim();
    const sectionMatch = trimmedLine.match(/^##\s*\d*\.?\s*([^(\n]+)(?:\s*\(Score:\s*(\d+)\/10\))?/i);
    if (sectionMatch) {
      finalizeSection();
      currentSectionData.title = sectionMatch[1].trim();
      currentSectionData.name = currentSectionData.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      currentSectionData.points = [];
      currentSectionData.contentBuffer = [];
      if (sectionMatch[2]) currentSectionData.score = parseInt(sectionMatch[2], 10);
      collectingEvidence = false;
    } else if (currentSectionData.title) {
      if (trimmedLine.toUpperCase().startsWith('EVIDENCE:')) {
        collectingEvidence = true;
        currentSectionData.evidence = trimmedLine.substring(9).trim();
      } else if (collectingEvidence) {
        currentSectionData.evidence += `\n${trimmedLine}`;
      } else if (trimmedLine.startsWith('- ')) {
        (currentSectionData.points = currentSectionData.points || []).push(trimmedLine.substring(2).trim());
      } else if (trimmedLine.toUpperCase().startsWith('SUMMARY:')) {
        currentSectionData.summary = trimmedLine.substring(8).trim();
      } else if (trimmedLine.toUpperCase().startsWith('SCORE EXPLANATION:')) {
        currentSectionData.score_explanation = trimmedLine.substring(18).trim();
      } else if (trimmedLine) {
        (currentSectionData.contentBuffer = currentSectionData.contentBuffer || []).push(trimmedLine);
      }
    }
  }
  finalizeSection();
  return parsedSections;
};

const MarkdownSectionRenderer: React.FC<{
    title: string; mainContent: string; subsections: Array<{ title: string; content: string }>;
    performanceSummary?: string; goalAchievementAssessment?: string;
    icon?: React.ElementType; sectionKey: string;
}> = ({ title, mainContent, subsections, performanceSummary, goalAchievementAssessment, icon: Icon, sectionKey }) => (
    <div className="space-y-6">
        {mainContent && mainContent.trim() && (
            <div className="prose prose-lg max-w-none text-slate-700 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{mainContent}</ReactMarkdown>
            </div>
        )}
        
        {sectionKey === 'key-findings' && (
            <>
                {goalAchievementAssessment && (
                    <div className="p-6 bg-teal-50/60 border border-teal-100 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <TargetIcon className="w-6 h-6 text-slate-600 flex-shrink-0" />
                            <h4 className="text-xl font-semibold text-slate-800">Goal Achievement Assessment</h4>
                        </div>
                        <div className="prose prose-base max-w-none text-slate-600 leading-relaxed">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{goalAchievementAssessment}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </>
        )}

        {subsections && subsections.length > 0 && (
            <div className="space-y-4">
                {subsections.map((sub, idx) => (
                    <div key={idx}>
                        {/* Screen: collapsible accordion */}
                        <Accordion type="single" collapsible className="w-full print-hide">
                            <AccordionItem value={`subsection-${sectionKey}-${idx}`} className="border bg-white rounded-lg shadow-sm data-[state=open]:shadow-md overflow-hidden">
                                <AccordionTrigger className="text-lg font-semibold text-slate-700 hover:text-teal-700 py-4 px-6 bg-slate-50/80 hover:bg-slate-100/90 transition-colors w-full text-left data-[state=open]:bg-slate-100 data-[state=open]:border-b border-slate-200">
                                    {sub.title}
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 pb-6 px-6">
                                    <div className="prose prose-base max-w-none text-slate-600 leading-relaxed">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{sub.content}</ReactMarkdown>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                        {/* Print: always visible */}
                        <div className="print-only border bg-white rounded-lg overflow-hidden">
                            <div className="text-lg font-semibold text-slate-700 py-4 px-6 bg-slate-50/80 border-b border-slate-200">
                                {sub.title}
                            </div>
                            <div className="pt-4 pb-6 px-6 prose prose-base max-w-none text-slate-600 leading-relaxed">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{sub.content}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
        {sectionKey === 'key-findings' && performanceSummary && (
            <div className="p-6 bg-teal-50/60 border border-teal-100 rounded-xl shadow-sm mt-6">
                <div className="flex items-center gap-3 mb-3">
                    <Zap className="w-6 h-6 text-slate-600 flex-shrink-0" />
                    <h4 className="text-xl font-semibold text-slate-800">Performance Snapshot</h4>
                </div>
                <p className="text-slate-600 leading-relaxed text-base">{performanceSummary}</p>
            </div>
        )}
        {(!mainContent || !mainContent.trim()) && (!subsections || subsections.length === 0) && sectionKey !== 'key-findings' && (
            <p className="text-slate-500 p-4 text-center">No specific details available for this section.</p>
        )}
    </div>
);

// --- The Main Page Component ---
export default function ReportOverviewPage({ params }: { params: { reportId: string } }) {
    const { reportId } = params;
    const [activeDetailedTab, setActiveDetailedTab] = useState("key-findings");
    const [bugReportOpen, setBugReportOpen] = useState(false);
    const [bugMessage, setBugMessage] = useState("");
    const [bugSending, setBugSending] = useState(false);
    const [bugSent, setBugSent] = useState(false);
    const { user } = useCurrentUser();

    const { data: reportData, isLoading, error, isError } = useQuery<ReportData, Error>({
        queryKey: ["reportData", reportId],
        queryFn: () => fetchReportData(reportId),
        enabled: !!reportId,
    });

    // --- All state and effects from original Index.tsx ---
    const [organizationName, setOrganizationName] = useState("Analysis Report");
    const [analysisDate, setAnalysisDate] = useState<string | null>(null);
    const [overallScore, setOverallScore] = useState(0);
    const [siteScoreExplanation, setSiteScoreExplanation] = useState("Overall site score explanation not available.");
    const [totalPagesAnalyzed, setTotalPagesAnalyzed] = useState(0);
    const [pageAnalyses, setPageAnalyses] = useState<PageAnalysisDetail[]>([]);
    const [mainExecutiveSummary, setMainExecutiveSummary] = useState("");
    const [parsedDetailedSections, setParsedDetailedSections] = useState<{ [key: string]: { title: string; content: string; subsections: Array<{title:string; content:string}> } }>({});
    const [goalAchievement, setGoalAchievement] = useState<string>("");
    const [performanceSummary, setPerformanceSummary] = useState("No performance summary available.");
    const [analysisContext, setAnalysisContext] = useState<{ industry: string; primaryGoal: string; targetAudience: string; sitePurpose: string } | null>(null);

    useEffect(() => {
        if (reportData) {
            const { overall_summary, page_analyses = [], metadata, organization, timestamp, analysis_date, project } = reportData;
            setOrganizationName(metadata?.organization_name || organization || `Report ID: ${reportId}`);
            setAnalysisDate(metadata?.generated_at || timestamp || analysis_date || new Date().toISOString());
            setOverallScore(overall_summary.overall_score || 0);
            setSiteScoreExplanation(overall_summary.site_score_explanation || "Not available.");
            setTotalPagesAnalyzed(overall_summary.total_pages_analyzed || page_analyses.length);
            setPageAnalyses(page_analyses);
            setMainExecutiveSummary(overall_summary.executive_summary || "Not available.");
            setPerformanceSummary(overall_summary.performance_summary || "Not available.");

            // Build analysis context from project fields, falling back to metadata
            const industry = project?.industry || metadata?.industry || '';
            const primaryGoal = project?.primaryGoal || metadata?.primary_goal || '';
            const targetAudience = project?.targetAudience || metadata?.target_audience || '';
            const sitePurpose = (metadata as any)?.site_purpose || '';
            if (industry || primaryGoal || targetAudience || sitePurpose) {
                setAnalysisContext({ industry, primaryGoal, targetAudience, sitePurpose });
            }

            // --- All data parsing logic from original useEffect ---
            const dmc = overall_summary.detailed_markdown_content || "";
            
            const extractedGoalAssessment = (() => {
                if (!dmc) return "";
                const goalAssessmentMatch = dmc.match(/###?\s*Goal Achievement Assessment[:\s]*\n([\s\S]*?)(?=\n\n(?:###?|##|\*\*Performance Summary|\*\*Key Strengths|$))/i);
                if (goalAssessmentMatch && goalAssessmentMatch[1]) return goalAssessmentMatch[1].trim();
                const keyFindingsMatch = dmc.match(/## KEY FINDINGS([\s\S]*?)(?=\n\n## |$)/i);
                if (keyFindingsMatch && keyFindingsMatch[1]) {
                    const keyFindingsContent = keyFindingsMatch[1];
                    const goalInKeyFindings = keyFindingsContent.match(/Goal Achievement Assessment[:\s]*\n([\s\S]*?)(?=\n\n(?:###?|##|\*\*|$))/i);
                    if (goalInKeyFindings && goalInKeyFindings[1]) return goalInKeyFindings[1].trim();
                }
                return "";
            })();
            setGoalAchievement(extractedGoalAssessment);

            const parsedSectionsResult = (() => {
                if (!dmc) return {};
                const sections: { [key: string]: { title: string; content: string; subsections: Array<{title:string; content:string}> } } = {};
                const lines = dmc.split('\n');
                let currentSectionKey: string | null = null;
                let currentSectionTitle: string | null = null;
                let currentSubsectionTitle: string | null = null;
                let mainSectionContentAccumulator: string[] = [];
                let subSectionContentAccumulator: string[] = [];
                const normalizeKey = (title: string) => title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

                const commitSubSection = () => {
                    if (currentSubsectionTitle && currentSectionKey && sections[currentSectionKey]) {
                        if (!(currentSectionKey === 'executive-summary' && (currentSubsectionTitle.toLowerCase().includes('key strengths') || currentSubsectionTitle.toLowerCase().includes('critical weaknesses')))) {
                            sections[currentSectionKey].subsections.push({ title: currentSubsectionTitle, content: subSectionContentAccumulator.join('\n').trim() });
                        }
                    }
                    subSectionContentAccumulator = [];
                    currentSubsectionTitle = null;
                };

                const commitMainSection = () => {
                    commitSubSection();
                    if (currentSectionKey && sections[currentSectionKey]) {
                        let contentToAdd = mainSectionContentAccumulator.join('\n').trim();
                        if (currentSectionKey === 'executive-summary' && mainExecutiveSummary) {
                            const mainParaLines = mainExecutiveSummary.split('\n');
                            let tempContent = contentToAdd;
                            mainParaLines.forEach(line => {
                                const trimmedLine = line.trim();
                                const regex = new RegExp(`(^|\\n)${trimmedLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*')}(\\n|$)`, 'gi');
                                tempContent = tempContent.replace(regex, (match, p1, p2) => (p1 && p2) ? p1 : ''); 
                            });
                            contentToAdd = tempContent.replace(/\n\s*\n/g, '\n\n').trim();
                            contentToAdd = contentToAdd.replace(/(\n\n)?\*\*Goal Achievement Assessment:\*\*[\s\S]*?(?=\n\n##|$)/i, '').trim();
                            contentToAdd = contentToAdd.replace(/(\n\n)?###?\s*Goal Achievement Assessment[\s\S]*?(?=\n\n##|$)/i, '').trim();
                        }
                        sections[currentSectionKey].content = contentToAdd;
                    }
                    mainSectionContentAccumulator = [];
                };

                for (const line of lines) {
                    if (line.startsWith('## ')) {
                        commitMainSection();
                        currentSectionTitle = line.substring(3).trim();
                        currentSectionKey = normalizeKey(currentSectionTitle);
                        if (!currentSectionKey) continue;
                        sections[currentSectionKey] = { title: currentSectionTitle, content: '', subsections: [] };
                    } else if (line.startsWith('### ')) {
                        commitSubSection();
                        if (currentSectionKey) {
                            currentSubsectionTitle = line.substring(4).trim();
                            if (currentSectionKey === 'key-findings' && currentSubsectionTitle.toLowerCase().includes('goal achievement assessment')) {
                                currentSubsectionTitle = null;
                            }
                        }
                    } else if (currentSectionKey) {
                        if (currentSubsectionTitle) {
                            subSectionContentAccumulator.push(line);
                        } else {
                            mainSectionContentAccumulator.push(line);
                        }
                    }
                }
                commitMainSection();
                return sections;
            })();
            setParsedDetailedSections(parsedSectionsResult);
        }
    }, [reportData, reportId]);

    useEffect(() => {
        if (overallScore > 0) {
            const timer = setTimeout(() => {
                const scoreRing = document.querySelector('.score-ring-progress') as SVGCircleElement;
                if (scoreRing) {
                    const circumference = 2 * Math.PI * 45;
                    const offset = circumference - ((overallScore / 10) * circumference);
                    scoreRing.style.strokeDashoffset = offset.toString();
                    if (overallScore >= 8) scoreRing.style.stroke = '#10b981';
                    else if (overallScore >= 6) scoreRing.style.stroke = '#f59e0b';
                    else scoreRing.style.stroke = '#f43f5e';
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [overallScore]);

    const sectionDetails: { [key: string]: { icon: React.ElementType; title: string } } = {
        'key-findings': { icon: Lightbulb, title: "Key Findings" },
        'strategic-recommendations': { icon: ListChecks, title: "Strategic Recommendations" },
        'overall-theme-assessment': { icon: Palette, title: "Overall Theme Assessment" },
        'implementation-roadmap': { icon: Route, title: "Implementation Roadmap" },
    };

    useEffect(() => {
        const availableParsedKeys = Object.keys(parsedDetailedSections).filter(key => key !== 'executive-summary' && sectionDetails[key]);
        
        if (availableParsedKeys.length > 0) {
            if (!availableParsedKeys.includes(activeDetailedTab) || activeDetailedTab === 'executive-summary') {
                setActiveDetailedTab(availableParsedKeys[0]);
            }
        } else if (Object.keys(parsedDetailedSections).length === 0) {
            const firstKeyFromDetails = Object.keys(sectionDetails).find(key => key !== 'executive-summary');
            if (firstKeyFromDetails && activeDetailedTab !== firstKeyFromDetails && sectionDetails[activeDetailedTab] === undefined) {
                setActiveDetailedTab(firstKeyFromDetails);
            }
        }
    }, [parsedDetailedSections, activeDetailedTab, sectionDetails]);
    
    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-6">
                <div className="relative h-16 w-16">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
                    <div className="absolute inset-0 rounded-full border-4 border-slate-400 border-t-transparent animate-spin" />
                </div>
                <div className="text-center space-y-1">
                    <p className="text-lg font-semibold text-slate-800">Loading Report</p>
                    <p className="text-sm text-slate-500">Fetching your analysis results...</p>
                </div>
            </div>
        </div>
    );
    if (isError) return <div className="min-h-screen flex items-center justify-center">Error: {error.message}</div>;
    if (!reportData) return <div className="min-h-screen flex items-center justify-center">No report data found.</div>;

    const { overall_summary } = reportData;

    async function handleSendIssue() {
        if (!bugMessage.trim() || bugSending) return;
        setBugSending(true);
        try {
            await fetch('/api/report-issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: bugMessage, context: `Report ${reportId}`, userName: user?.Name, userEmail: user?.email }),
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
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-10 flex items-center justify-between print-hide">
                    <Link href={user ? "/dashboard" : "/"} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors group">
                        <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                        {user ? "Dashboard" : "Home"}
                    </Link>
                    <button
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow transition-colors duration-200"
                    >
                        <Download className="w-4 h-4" />
                        Export PDF
                    </button>
                </div>
                <header className="text-center mb-10">
                    <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-2">Web Analysis Report</p>
                    <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3 tracking-tight">
                        <span className="text-gradient-atmo">
                            {organizationName}
                        </span>
                    </h1>
                    {analysisDate && (
                      <p className="text-base text-slate-500">
                          Conducted on <FormattedDate dateString={analysisDate} />
                      </p>
                    )}
                </header>

                <section className="grid lg:grid-cols-3 gap-6 mb-10">
                    <div className="lg:col-span-2 flex flex-col">
                        <ExecutiveSummary
                            summary={{
                                executive_summary: mainExecutiveSummary,
                                overall_score: overallScore,
                                total_pages_analyzed: totalPagesAnalyzed
                            }}
                            analysisContext={analysisContext}
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <Card className="bg-white rounded-2xl border border-slate-200/70 shadow-lg h-full flex flex-col">
                            <CardHeader className="p-6 sm:p-8 pb-4 border-b border-slate-100">
                                <CardTitle className="flex items-center gap-3 text-slate-900">
                                    <div className="h-8 w-8 bg-white border-2 border-slate-900 rounded-xl flex items-center justify-center">
                                        <Trophy className="w-4 h-4 text-slate-900" />
                                    </div>
                                    <span className="text-xl font-semibold">Overall Site Score</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center flex-1">
                                <div className="relative mb-4 score-ring-container">
                                    <svg className="score-ring transform -rotate-90" width="120" height="120">
                                        <circle cx="60" cy="60" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                                        <circle className="score-ring-progress" cx="60" cy="60" r="45" fill="none" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 45}`} strokeDashoffset={`${2 * Math.PI * 45}`} style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1) .5s' }} />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-slate-900">{overallScore.toFixed(1)}</div>
                                            <div className="text-sm text-slate-500 font-medium">/10</div>
                                        </div>
                                    </div>
                                </div>
                                {/* Print fallback for score ring */}
                                <div className="print-score-display items-center justify-center mb-4">
                                    <div className={`text-5xl font-bold px-6 py-4 rounded-2xl border-2 ${getScoreBoxClasses(overallScore)}`}>
                                        {overallScore.toFixed(1)}<span className="text-2xl font-medium">/10</span>
                                    </div>
                                </div>
                                <div className="text-center w-full">
                                    <Badge variant="outline" className={`text-sm font-semibold mb-3 px-3 py-1.5 border ${getScoreBoxClasses(overallScore)}`}>
                                        {getOverallScoreStatusText(overallScore)}
                                    </Badge>
                                    <p className="text-xs text-slate-500 leading-relaxed">{siteScoreExplanation}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
                
                {/* Detailed tabs section */}
                <section className="mt-10">
                    <h2 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">Detailed Findings</h2>
                    {Object.keys(parsedDetailedSections).filter(key => key !== 'executive-summary' && sectionDetails[key]).length > 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden">
                            <Tabs value={activeDetailedTab} onValueChange={setActiveDetailedTab} className="w-full">
                                <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50/90 to-white/90 backdrop-blur-sm px-4 sm:px-6 py-3">
                                    <TabsList className="grid w-full grid-cols-2 sm:flex sm:w-auto bg-transparent p-0 h-auto gap-1 sm:gap-2 justify-start overflow-x-auto scrollbar-hide">
                                        {Object.keys(sectionDetails).map((key) => {
                                            if (key === 'executive-summary') return null;
                                            const sectionInfo = sectionDetails[key];
                                            const Icon = sectionInfo?.icon;
                                            return parsedDetailedSections[key] ? (
                                                <TabsTrigger
                                                    key={key}
                                                    value={key}
                                                    className="group flex items-center justify-center sm:justify-start text-center sm:text-left gap-2.5 px-4 py-3 h-auto sm:min-h-[56px] whitespace-nowrap rounded-lg border-2 border-transparent bg-slate-100/80 hover:bg-slate-200/80 data-[state=active]:bg-white data-[state=active]:border-teal-200 data-[state=active]:shadow-md data-[state=active]:text-teal-800 text-slate-600 font-medium transition-all duration-300 flex-shrink-0 text-xs sm:text-sm"
                                                >
                                                    {Icon && (
                                                        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-slate-200 group-data-[state=active]:bg-teal-50 flex items-center justify-center transition-colors duration-300">
                                                            <Icon className="w-3.5 h-3.5 group-data-[state=active]:text-teal-800" />
                                                        </div>
                                                    )}
                                                    <span className="font-semibold">
                                                        {sectionInfo?.title || parsedDetailedSections[key]!.title}
                                                    </span>
                                                </TabsTrigger>
                                            ) : null;
                                        })}
                                    </TabsList>
                                </div>

                                <div className="p-6 sm:p-8">
                                    {Object.keys(parsedDetailedSections).map((key) => {
                                        if (key === 'executive-summary') return null;
                                        return parsedDetailedSections[key] && sectionDetails[key] && (
                                            <TabsContent key={key} value={key} className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none">
                                                <h3 className="print-tab-heading">{sectionDetails[key]!.title}</h3>
                                                <MarkdownSectionRenderer
                                                    title={parsedDetailedSections[key]!.title}
                                                    mainContent={parsedDetailedSections[key]!.content}
                                                    subsections={parsedDetailedSections[key]!.subsections}
                                                    performanceSummary={key === 'key-findings' ? performanceSummary : undefined}
                                                    goalAchievementAssessment={key === 'key-findings' ? goalAchievement : undefined}
                                                    icon={sectionDetails[key]!.icon}
                                                    sectionKey={key}
                                                />
                                            </TabsContent>
                                        )
                                    })}
                                </div>
                            </Tabs>
                        </div>
                    ) : (
                        <Card className="text-center p-10 border-slate-200/80 bg-white shadow-lg">
                            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-6"/>
                            <p className="text-slate-600 text-xl font-medium mb-2">Detailed Overview Not Available</p>
                            <p className="text-sm text-slate-500">
                                The comprehensive markdown content could not be loaded or parsed correctly.
                            </p>
                        </Card>
                    )}
                </section>

                <section className="mt-20 print-hide">
                    <h2 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">Page-by-Page Analysis</h2>
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {pageAnalyses.map((page) => (
                            <Link key={page.id} href={`/report/${reportId}/page/${page.id}`} className="group block">
                                <Card className="h-full flex flex-col hover:shadow-xl transition-shadow">
                                    <CardHeader className="p-6 pb-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <CardTitle className="text-xl font-semibold text-slate-800 group-hover:text-slate-900 transition-colors duration-300">
                                                {page.title}
                                            </CardTitle>
                                            <div className={`flex items-center justify-center text-base font-bold p-1.5 px-3 rounded-lg min-w-[40px] h-9 border ${getScoreBoxClasses(page.overall_score)} shadow-sm`}>
                                                {page.overall_score}/10
                                            </div>
                                        </div>
                                        <CardDescription className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 truncate">
                                            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                                            <span className="truncate font-mono" title={page.url}>{page.url}</span>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-0 flex-grow">
                                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                                            {page.summary}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="p-6 pt-4 mt-auto border-t border-slate-100/90">
                                        <div className="text-sm font-semibold text-teal-600 group-hover:text-teal-800 flex items-center gap-1.5 transition-colors duration-300">
                                            View Detailed Analysis
                                            <ChevronRight className="h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1" />
                                        </div>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* ── Print-only: full page analyses ── */}
                <section className="print-only mt-0">
                    {pageAnalyses.map((page, pageIdx) => {
                        const sections = page.sections && page.sections.length > 0
                            ? page.sections.map(s => ({ ...s, score: typeof s.score === 'number' ? s.score : 5 }))
                            : parseDetailedAnalysisSections(page.detailed_analysis || page.raw_analysis, page.section_scores || {});
                        const pageRole = extractPageRoleAnalysis(page.detailed_analysis || page.raw_analysis);

                        return (
                            <div key={page.id} className="page-break-before mt-0">
                                {/* Page header */}
                                <div className="mb-6 pb-4 border-b-2 border-slate-200">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900">{page.title}</h2>
                                            <p className="text-sm text-slate-500 font-mono mt-1">{page.url}</p>
                                        </div>
                                        <div className={`flex-shrink-0 text-xl font-bold px-4 py-2 rounded-xl border-2 ${getScoreBoxClasses(page.overall_score)}`}>
                                            {page.overall_score}/10
                                        </div>
                                    </div>
                                    <p className="text-slate-700 mt-3 text-sm leading-relaxed">{page.summary}</p>
                                    {page.overall_explanation && (
                                        <p className="text-slate-600 mt-2 text-xs italic">{page.overall_explanation}</p>
                                    )}
                                </div>

                                {/* Page Role */}
                                {pageRole && (
                                    <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Page Role & Purpose</h4>
                                        <div className="prose prose-sm max-w-none text-slate-700">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{pageRole}</ReactMarkdown>
                                        </div>
                                    </div>
                                )}

                                {/* Analysis sections */}
                                {sections.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Analysis Sections</h4>
                                        <div className="space-y-5">
                                            {sections.map((section, idx) => (
                                                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white page-break-avoid">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h5 className="font-bold text-slate-900 text-base">{idx + 1}. {section.title}</h5>
                                                        <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${getScoreBoxClasses(section.score)}`}>{section.score}/10</span>
                                                    </div>
                                                    {section.summary && section.summary !== "Summary not available." && (
                                                        <p className="text-slate-700 text-sm leading-relaxed mb-3">{section.summary}</p>
                                                    )}
                                                    {section.points && section.points.length > 0 && (
                                                        <ul className="space-y-1.5 mb-3">
                                                            {section.points.map((point: string, i: number) => (
                                                                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${getProgressColorClass(section.score)}`} />
                                                                    {point}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                    {section.evidence && section.evidence !== "Evidence not specified." && (
                                                        <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">{section.evidence}</p>
                                                    )}
                                                    {section.score_explanation && section.score_explanation !== "Score explanation not provided." && (
                                                        <p className="text-xs text-slate-600 mt-2"><span className="font-semibold">Score rationale:</span> {section.score_explanation}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Key Issues */}
                                {page.key_issues && page.key_issues.length > 0 && (
                                    <div className="mb-6 page-break-avoid">
                                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Key Issues</h4>
                                        <div className="space-y-3">
                                            {page.key_issues.map((issue, idx) => (
                                                <div key={idx} className="flex gap-3 p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
                                                    <div className="flex-shrink-0 w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                                                    <div className="flex-1">
                                                        <p className="text-slate-900 font-semibold text-sm">{issue.issue}</p>
                                                        {issue.how_to_fix && (
                                                            <p className="text-slate-600 text-xs mt-1"><span className="font-semibold text-rose-700">Fix:</span> {issue.how_to_fix}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recommendations */}
                                {page.recommendations && page.recommendations.length > 0 && (
                                    <div className="mb-2 page-break-avoid">
                                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Recommendations</h4>
                                        <div className="space-y-3">
                                            {page.recommendations.map((rec, idx) => (
                                                <div key={idx} className="flex gap-3 p-3 bg-teal-50/50 border border-teal-100 rounded-xl">
                                                    <div className="flex-shrink-0 w-7 h-7 bg-teal-700 text-white rounded-lg flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                                                    <div className="flex-1">
                                                        <p className="text-slate-900 font-semibold text-sm">{rec.recommendation}</p>
                                                        {rec.benefit && (
                                                            <p className="text-slate-600 text-xs mt-1"><span className="font-semibold text-teal-700">Benefit:</span> {rec.benefit}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </section>
            </div>
        </div>

      {/* Floating Bug Report Button */}
      <button
        onClick={() => setBugReportOpen(true)}
        className="print-hide fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-4 py-3 rounded-full shadow-lg transition-colors duration-200"
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
              Describe the issue with this report and we&apos;ll look into it.
            </p>
            <textarea
              className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-teal-300 mb-4"
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