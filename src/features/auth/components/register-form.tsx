/**
 * Register Form Component - New User Registration Interface
 * 
 * Registration form component for new user account creation.
 * Handles form validation, password requirements, and account
 * creation workflow.
 * 
 * @responsibilities
 * - Renders registration form with name/email/password fields
 * - Validates password strength and requirements
 * - Handles user registration and account creation
 * - Manages registration errors and success states
 * - Provides loading states during registration
 * - Redirects users after successful registration
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Home, UserPlus, Loader2, AlertTriangle, Zap, Clock, Gift } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useAuth } from '../hooks/use-auth';

export function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const { register, isLoading, error } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await register(formData);
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-300 shadow-sm transition-all duration-200"
        >
          <Home size={18} />
        </Link>
      </div>

      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Vuxi</h1>
          <p className="text-slate-600">AI-Powered Web Analysis</p>
        </div>

        <Card className="bg-white shadow-2xl rounded-xl border-slate-200/80">
          <CardHeader className="p-6 sm:p-8 bg-slate-50/70 rounded-t-xl border-b border-slate-200/70">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white border-2 border-slate-900 text-slate-900 rounded-lg flex items-center justify-center shadow-sm">
                <UserPlus size={24} />
              </div>
              <div>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-800">
                  Create Account
                </CardTitle>
                <CardDescription className="text-slate-500 mt-1 text-sm sm:text-base">
                  Free to join — your first analysis is on us
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Name
                </Label>
                <Input 
                  id="name" 
                  type="text" 
                  value={formData.name} 
                  onChange={handleInputChange('name')} 
                  placeholder="e.g., John Smith"
                  required 
                  disabled={isLoading}
                  className="w-full border-slate-300 shadow-sm focus:ring-teal-400 focus:border-teal-400 sm:text-sm rounded-md"
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email Address
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={handleInputChange('email')} 
                  placeholder="your@email.com"
                  required 
                  disabled={isLoading}
                  className="w-full border-slate-300 shadow-sm focus:ring-teal-400 focus:border-teal-400 sm:text-sm rounded-md"
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={formData.password} 
                  onChange={handleInputChange('password')} 
                  placeholder="Create a secure password"
                  required 
                  disabled={isLoading}
                  className="w-full border-slate-300 shadow-sm focus:ring-teal-400 focus:border-teal-400 sm:text-sm rounded-md"
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm flex items-center gap-2">
                  <AlertTriangle size={18} /> {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full btn-atmo text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 size={20} className="mr-2 animate-spin" />
                ) : (
                  <UserPlus size={20} className="mr-2" />
                )}
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => signIn('google')}
                className="w-full flex items-center justify-center gap-3 border border-slate-300 rounded-lg px-6 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </form>
          </CardContent>
          
          <CardFooter className="px-6 sm:px-8 py-5 border-t border-slate-200/70 bg-slate-50/30 flex flex-col items-center gap-4">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/login" className="inline-block min-h-[44px] leading-[44px] font-medium text-teal-600 hover:text-teal-700 hover:underline transition-colors duration-200">
                Sign in here
              </Link>
            </p>
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-full px-4 py-2">
                <Gift size={13} className="text-teal-600 shrink-0" />
                <span className="text-xs font-semibold text-teal-700">1 free credit on signup</span>
              </div>
              <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-full px-4 py-2">
                <Clock size={13} className="text-teal-600 shrink-0" />
                <span className="text-xs font-semibold text-teal-700">Up & running in minutes</span>
              </div>
              <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-full px-4 py-2">
                <Zap size={13} className="text-teal-600 shrink-0" />
                <span className="text-xs font-semibold text-teal-700">No credit card required</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}