"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Globe, ScanSearch, Sparkles, ClipboardList, ChevronRight } from 'lucide-react';
import { UserNav } from '@/components/layout/user-nav';
import { API_ENDPOINTS } from '@/lib/constants';

interface PublicReport {
  id: string;
  name: string;
  date: string;
  overall_score: number;
  website_url: string;
  preview_screenshot: string | null;
}

function VuxiLandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  useEffect(() => {
    fetch(API_ENDPOINTS.AUTH.ME)
      .then(res => { if (res.ok) setIsLoggedIn(true); })
      .catch(() => {});
    fetch('/api/reports')
      .then(res => res.ok ? res.json() : [])
      .then(setReports)
      .catch(() => {})
      .finally(() => setReportsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-3xl font-bold text-slate-900 tracking-tight">
                Vuxi
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8 items-center">
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                  <UserNav />
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/create-account">
                    <Button variant="outline">Sign Up</Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main>
        {/* Hero + How It Works */}
        <section className="px-4 pt-12 pb-12 md:pt-16 md:pb-16 lg:pt-20 lg:pb-20">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-slate-900 mb-6">
              A Claude-powered review of{' '}
              <span className="text-gradient-atmo">
                every page of your site
              </span>
              {' '}— in minutes.
            </h1>
            <p className="max-w-[700px] text-xl md:text-2xl text-slate-600 mx-auto leading-relaxed mb-6">
              Vuxi visits every page of your site, captures what users actually see, and delivers a prioritised report of exactly what to fix and why.
            </p>

            {/* Step flow */}
            <h2 className="sr-only">How it works</h2>
            <div className="grid grid-cols-4 gap-0 mt-12 mb-10">
              {[
                {
                  icon: <Globe className="h-7 w-7 text-slate-900" />,
                  title: 'Enter your URL',
                  description: "Paste in the address of any website you want to evaluate — yours, a competitor's, or a client's.",
                },
                {
                  icon: <ScanSearch className="h-7 w-7 text-slate-900" />,
                  title: 'We capture every page',
                  description: 'Vuxi visits each page of the site and takes a full screenshot, covering the full range of your user experience.',
                },
                {
                  icon: <Sparkles className="h-7 w-7 text-slate-900" />,
                  title: 'AI analyses what it sees',
                  description: 'Each screenshot is reviewed by a vision model that evaluates layout, clarity, and usability.',
                },
                {
                  icon: <ClipboardList className="h-7 w-7 text-slate-900" />,
                  title: 'Your report is ready',
                  description: "A clear, prioritised report highlights what's working, what isn't, and exactly what to fix first.",
                },
              ].map((step, i, arr) => (
                <div key={i} className="flex flex-col items-center text-center px-4">
                  <div className="flex items-center w-full mb-5">
                    <div className={`flex-1 h-0.5 ${i === 0 ? 'invisible' : 'bg-slate-200'}`} />
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-900 flex items-center justify-center shadow-sm">
                        {step.icon}
                      </div>
                      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border-2 border-slate-200 text-xs font-bold text-slate-500 flex items-center justify-center shadow-sm">
                        {i + 1}
                      </span>
                    </div>
                    <div className={`flex-1 h-0.5 ${i === arr.length - 1 ? 'invisible' : 'bg-slate-200'}`} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <Link href="/create-account">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="mt-10">
                <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-6">See example reports</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportsLoading ? (
                    [0, 1, 2].map((i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-pulse motion-reduce:animate-none">
                        <div className="aspect-square w-full bg-slate-100" />
                        <div className="px-4 py-3 flex items-center justify-between">
                          <div className="h-4 bg-slate-200 rounded w-2/3" />
                          <div className="h-4 w-4 bg-slate-200 rounded" />
                        </div>
                      </div>
                    ))
                  ) : reports.map((report) => (
                    <Link key={report.id} href={`/report/${report.id}`} className="group">
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:scale-[1.02]">
                        {/* Screenshot */}
                        <div className="aspect-square w-full bg-slate-100 overflow-hidden relative">
                          {report.preview_screenshot ? (
                            <img
                              src={report.preview_screenshot}
                              alt={`Screenshot of ${report.website_url}`}
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Globe className="w-10 h-10 text-slate-300" />
                            </div>
                          )}
                          {/* Score badge */}
                          <div className={`absolute top-3 right-3 w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold shadow-md bg-white ${
                            report.overall_score >= 7 ? 'border-green-400 text-green-600' :
                            report.overall_score >= 5 ? 'border-yellow-400 text-yellow-600' :
                            'border-red-400 text-red-600'
                          }`}>
                            {report.overall_score}
                          </div>
                        </div>
                        {/* Footer */}
                        <div className="px-4 py-3 flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors truncate">{report.name}</p>
                          </div>
                          <ChevronRight className="ml-2 h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
          </div>
        </section>

        {/* Beta CTA Section */}
        <section className="w-full py-20 md:py-28 bg-white border-t">
          <div className="max-w-2xl mx-auto px-4 md:px-6 text-center">
            <span className="inline-block bg-blue-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6">
              Beta
            </span>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-slate-900 mb-4">
              Currently in beta
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              Vuxi is free to try during the beta. Sign up and get a free credit to run your first analysis — no payment required.
            </p>
            <Link href="/create-account">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Try it free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function Home() {
  return <VuxiLandingPage />;
}
