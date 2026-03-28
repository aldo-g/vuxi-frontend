"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, FileText, Users } from 'lucide-react';
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
              Professional{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                UX Analysis
              </span>{' '}
              Made Simple
            </h1>
            <p className="max-w-[700px] text-xl md:text-2xl text-slate-600 mx-auto leading-relaxed mb-8">
              Get comprehensive UX insights with AI-powered analysis that evaluates your website against industry best practices and provides actionable recommendations.
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

        {/* Features Section */}
        <section className="w-full py-20 md:py-28 lg:py-36 bg-white border-t border-b">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Professional UX Analysis
              </h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto mt-4">
                Access comprehensive UX reports and insights from our expert analysis platform.
              </p>
            </div>

            <div className="grid gap-10 sm:grid-cols-1 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">AI-Powered Insights</h3>
                <p className="text-muted-foreground mt-2">
                  Advanced AI models analyze user experience against industry best practices and proven methodologies.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Detailed Reports</h3>
                <p className="text-muted-foreground mt-2">
                  Comprehensive reports with prioritized recommendations and clear implementation guidance.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Expert Analysis</h3>
                <p className="text-muted-foreground mt-2">
                  Professional-grade UX evaluation backed by years of user experience research and best practices.
                </p>
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
