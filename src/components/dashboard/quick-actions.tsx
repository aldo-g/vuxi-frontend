"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Plus, TrendingUp, ArrowRight } from 'lucide-react';
import { NoCreditsDialog } from './no-credits-dialog';

export function QuickActions({ userCredits }: { userCredits: number }) {
  const [noCreditsOpen, setNoCreditsOpen] = useState(false);

  const actions = [
    {
      title: "Create New Analysis",
      description: "Start a comprehensive UX analysis of any website",
      icon: Plus,
      href: "/create-analysis",
      color: "from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
      bgColor: "from-purple-500 to-pink-600"
    },
{
      title: "Latest Analysis",
      description: "Quick access to the most recent UX evaluation report",
      icon: TrendingUp,
      href: "/reports",
      color: "border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 text-emerald-700",
      bgColor: "from-emerald-500 to-green-600",
      variant: "outline" as const
    }
  ];

  return (
    <>
      <div className="grid gap-8 md:grid-cols-2 mb-16">
        {actions.map((action) => {
          const IconComponent = action.icon;
          const isCreateAction = action.title.includes('New');
          const hasNoCredits = isCreateAction && userCredits === 0;

          const buttonLabel = isCreateAction ? 'Start Analysis' :
                              action.title.includes('Example') ? 'Browse Examples' : 'View Latest';

          const buttonEl = (
            <Button
              className={`w-full font-semibold py-3 group ${
                action.variant === 'outline'
                  ? action.color
                  : `bg-gradient-to-r ${action.color} text-white`
              }`}
              variant={action.variant || "default"}
              onClick={hasNoCredits ? () => setNoCreditsOpen(true) : undefined}
            >
              <IconComponent className="mr-2 h-5 w-5" />
              {buttonLabel}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          );

          return (
            <Card
              key={action.title}
              className="group hover:shadow-xl transition-all duration-300 border-slate-200/80 bg-white/90 backdrop-blur-sm hover:scale-[1.02]"
            >
              <CardHeader className="pb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${action.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                  {action.title}
                </CardTitle>
                <CardDescription className="text-slate-600 text-base">
                  {action.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasNoCredits ? buttonEl : <Link href={action.href}>{buttonEl}</Link>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <NoCreditsDialog
        open={noCreditsOpen}
        onClose={() => setNoCreditsOpen(false)}
        onRedeemed={() => setNoCreditsOpen(false)}
      />
    </>
  );
}
