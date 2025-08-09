"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight, Bot, FileText, Users, Info, X } from 'lucide-react';

// Main UI Component for the landing page
function VuxiLandingPage() {
  const router = useRouter();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBetaModal, setShowBetaModal] = useState(true);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setLoginError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }
      
      // On success, the cookie is set by the server. We just need to navigate.
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">
      {/* Closed Beta Modal */}
      <Dialog open={showBetaModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-lg" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Info className="h-5 w-5" />
              Closed Beta Access
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed pt-2 space-y-4">
              <p>
                This app is currently in <span className="font-semibold">closed beta</span>. 
                If you would like to trial this app, please contact{' '}
                <a 
                  href="mailto:alastairegrant@pm.me" 
                  className="font-semibold text-blue-600 hover:text-blue-700 underline transition-colors"
                >
                  alastairegrant@pm.me
                </a>
              </p>
              <p>
                If you would like to see examples of the content the app creates, 
                please view our open examples below.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link href="/reports" className="flex-1">
              <Button 
                variant="outline" 
                className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
              >
                <FileText className="mr-2 h-4 w-4" />
                View Example Reports
              </Button>
            </Link>
            <a href="mailto:alastairegrant@pm.me" className="flex-1">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Request Access
              </Button>
            </a>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-3xl font-bold text-slate-900 tracking-tight">
                Vuxi
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="text-slate-400 hover:text-slate-500 cursor-not-allowed opacity-50"
                    disabled
                  >
                    Sign In
                  </Button>
                </PopoverTrigger>
              </Popover>
              <Button 
                asChild 
                variant="outline" 
                className="text-slate-400 border-slate-300 hover:text-slate-500 cursor-not-allowed opacity-50"
                disabled
              >
                <span>Sign Up</span>
              </Button>
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
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 opacity-50 cursor-not-allowed"
                disabled
              >
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
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