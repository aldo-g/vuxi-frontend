"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Globe, ScanSearch, Sparkles, ClipboardList } from 'lucide-react';
import { UserNav } from '@/components/layout/user-nav';
import { API_ENDPOINTS } from '@/lib/constants';

function VuxiLandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch(API_ENDPOINTS.AUTH.ME)
      .then(res => { if (res.ok) setIsLoggedIn(true); })
      .catch(() => {});
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
        {/* Hero Section */}
        <section className="px-4 py-20 md:py-28 lg:py-36">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-slate-900 mb-6">
              A consultant-quality UX audit{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                in minutes, not days
              </span>
            </h1>
            <p className="max-w-[700px] text-xl md:text-2xl text-slate-600 mx-auto leading-relaxed mb-8">
              Vuxi visits every page of your site, captures what users actually see, and delivers a prioritised report of exactly what to fix and why.
            </p>

            <div className="flex justify-center gap-4 mt-8">
              <Link href="/create-account">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline" size="lg">
                  View Example Reports
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-20 md:py-28 lg:py-36 bg-white border-t">
          <div className="max-w-5xl mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                How It Works
              </h2>
              <p className="text-muted-foreground md:text-xl mx-auto mt-4">
                From URL to actionable insights in four steps.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-0">
              {[
                {
                  icon: <Globe className="h-6 w-6 text-white" />,
                  title: 'Enter your URL',
                  description: "Paste in the address of any website you want to evaluate — yours, a competitor's, or a client's.",
                },
                {
                  icon: <ScanSearch className="h-6 w-6 text-white" />,
                  title: 'We capture every page',
                  description: 'Vuxi visits each page of the site and takes a full screenshot, covering the full range of your user experience.',
                },
                {
                  icon: <Sparkles className="h-6 w-6 text-white" />,
                  title: 'AI analyses what it sees',
                  description: 'Each screenshot is reviewed by a vision model that evaluates layout, clarity, and usability.',
                },
                {
                  icon: <ClipboardList className="h-6 w-6 text-white" />,
                  title: 'Your report is ready',
                  description: "A clear, prioritised report highlights what's working, what isn't, and exactly what to fix first.",
                },
              ].map((step, i, arr) => (
                <div key={i} className="flex flex-col items-center text-center px-4">
                  <div className="flex items-center w-full mb-6">
                    <div className="flex-1 h-px bg-slate-200" style={{ visibility: i === 0 ? 'hidden' : 'visible' }} />
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                      {step.icon}
                    </div>
                    <div className="flex-1 h-px bg-slate-200" style={{ visibility: i === arr.length - 1 ? 'hidden' : 'visible' }} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Step {i + 1}</p>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-4">
              <Link href="/create-account">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Analyse My Website <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Report Preview Section */}
        <section className="w-full py-20 md:py-28 bg-slate-50 border-t">
          <div className="max-w-5xl mx-auto px-4 md:px-6">
            {/* Browser chrome */}
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="ml-3 flex-1 bg-white rounded-md px-3 py-1 text-xs text-slate-400 font-mono border border-slate-200 max-w-xs">
                  vuxi.app/report/cgmt-2025
                </div>
              </div>

              {/* Report UI mock */}
              <div className="bg-white">
                {/* Report header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6 text-white">
                  <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">UX Analysis Report</p>
                  <h3 className="text-xl font-bold">Cameron Grant Memorial Trust</h3>
                  <p className="text-slate-400 text-sm mt-1">camgrant.org.uk · 10 pages analysed · June 2025</p>
                </div>

                <div className="p-8 grid grid-cols-3 gap-6">
                  {/* Left col: overall score + issues */}
                  <div className="col-span-1 space-y-4">
                    {/* Score ring */}
                    <div className="border border-slate-200 rounded-xl p-5 text-center">
                      <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Overall Score</p>
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-yellow-400 bg-yellow-50 mb-3">
                        <span className="text-3xl font-bold text-yellow-700">5</span>
                      </div>
                      <p className="text-xs font-semibold text-yellow-700 bg-yellow-100 rounded-full px-3 py-1 inline-block">Needs Work</p>
                    </div>

                    {/* Page scores */}
                    <div className="border border-slate-200 rounded-xl p-5">
                      <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Pages Analysed</p>
                      <div className="space-y-2">
                        {[
                          { page: 'Homepage', score: 4 },
                          { page: 'About Us', score: 6 },
                          { page: 'What We Do', score: 5 },
                          { page: 'News', score: 7 },
                          { page: 'Contact', score: 6 },
                        ].map(({ page, score }) => (
                          <div key={page} className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 truncate">{page}</span>
                            <span className={`ml-2 font-bold px-2 py-0.5 rounded text-xs border ${
                              score >= 7 ? 'bg-green-100 text-green-800 border-green-300' :
                              score >= 5 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                              'bg-red-100 text-red-700 border-red-300'
                            }`}>{score}/10</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right col: findings */}
                  <div className="col-span-2 space-y-4">
                    {/* Critical issues */}
                    <div className="border border-red-200 rounded-xl p-5 bg-red-50/40">
                      <p className="text-xs uppercase tracking-widest text-red-500 mb-3 font-semibold">Critical Issues</p>
                      <ul className="space-y-2">
                        {[
                          'Homepage leads with events, not the mental health mission',
                          'CTAs are understated — donors don\'t know what to do next',
                          'The Cameron story is underdeveloped across the site',
                        ].map((issue) => (
                          <li key={issue} className="flex gap-2 text-sm text-slate-700">
                            <span className="text-red-500 mt-0.5 flex-shrink-0">✕</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Top recommendations */}
                    <div className="border border-blue-200 rounded-xl p-5 bg-blue-50/40">
                      <p className="text-xs uppercase tracking-widest text-blue-500 mb-3 font-semibold">Top Recommendations</p>
                      <ul className="space-y-2">
                        {[
                          'Rewrite the homepage hero to lead with the mental health mission',
                          'Add a clear primary CTA on every page above the fold',
                          'Create a dedicated "Cameron\'s Story" narrative page',
                        ].map((rec) => (
                          <li key={rec} className="flex gap-2 text-sm text-slate-700">
                            <span className="text-blue-500 mt-0.5 flex-shrink-0">→</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Strengths */}
                    <div className="border border-green-200 rounded-xl p-5 bg-green-50/40">
                      <p className="text-xs uppercase tracking-widest text-green-600 mb-3 font-semibold">Strengths</p>
                      <ul className="space-y-2">
                        {[
                          'Authentic personal narrative builds genuine emotional connection',
                          'Practical mental health resources are clearly presented',
                        ].map((s) => (
                          <li key={s} className="flex gap-2 text-sm text-slate-700">
                            <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-slate-500 mt-4">
              A real Vuxi report — scored, prioritised, and ready to share.
            </p>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="w-full py-20 md:py-28 bg-white border-t">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Simple, transparent pricing
              </h2>
              <p className="text-muted-foreground md:text-xl mx-auto mt-4">
                Pay only for the reports you need. No subscriptions, no surprises.
              </p>
            </div>

            <div className="relative">
              {/* Greyed-out pricing cards */}
              <div className="grid gap-6 sm:grid-cols-3 select-none pointer-events-none opacity-40 blur-[2px]">
                <div className="flex flex-col rounded-2xl border border-slate-200 p-8 text-center">
                  <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">Starter</p>
                  <p className="text-5xl font-bold text-slate-900 mb-1">$9</p>
                  <p className="text-slate-500 mb-6">1 report</p>
                  <Button variant="outline" className="w-full mt-auto">Get started</Button>
                </div>
                <div className="flex flex-col rounded-2xl border border-slate-200 p-8 text-center">
                  <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">Plus</p>
                  <p className="text-5xl font-bold text-slate-900 mb-1">$39</p>
                  <p className="text-slate-500 mb-6">5 reports</p>
                  <Button variant="outline" className="w-full mt-auto">Get started</Button>
                </div>
                <div className="flex flex-col rounded-2xl border-2 border-blue-600 p-8 text-center relative">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    Best Value
                  </span>
                  <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">Pro</p>
                  <p className="text-5xl font-bold text-slate-900 mb-1">$99</p>
                  <p className="text-slate-500 mb-6">15 reports</p>
                  <Button className="w-full mt-auto bg-gradient-to-r from-blue-600 to-purple-600">Get started</Button>
                </div>
              </div>

              {/* Beta overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xl px-8 py-7 text-center max-w-sm mx-4">
                  <span className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                    Beta
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Currently in beta testing</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Paid plans aren't live yet. To get access, email us for a free credit voucher.
                  </p>
                  <a
                    href="mailto:alastairegrant@pm.me?subject=Vuxi beta access"
                    className="mt-5 inline-flex items-center justify-center w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-semibold px-4 py-2.5 transition-all"
                  >
                    alastairegrant@pm.me
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function Home() {
  return <VuxiLandingPage />;
}
