"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Target, ArrowRight, ArrowLeft } from 'lucide-react';
import type { PurposeStepProps } from '../../../types';
import { CaptureStatus } from '../capture-status';


const INDUSTRIES = [
  'Technology / SaaS',
  'E-commerce / Retail',
  'Professional Services',
  'Healthcare',
  'Finance / Fintech',
  'Education',
  'Non-profit',
  'Real Estate',
  'Hospitality / Travel',
  'Media / Publishing',
  'Manufacturing / Industrial',
  'Creative / Agency',
  'Other',
];

const OTHER_SENTINEL = '__other__';

export function PurposeStep({
  targetAudience,
  primaryGoal,
  industry,
  onTargetAudienceChange,
  onPrimaryGoalChange,
  onIndustryChange,
  onNext,
  onBack,
  captureJob,
  captureStarted,
}: PurposeStepProps) {
  const isOther = industry === OTHER_SENTINEL || (industry !== '' && !INDUSTRIES.includes(industry));
  const [selectValue, setSelectValue] = useState(isOther ? OTHER_SENTINEL : industry);

  const handleSelectChange = (value: string) => {
    setSelectValue(value);
    if (value !== OTHER_SENTINEL) {
      onIndustryChange(value);
    } else {
      onIndustryChange('');
    }
  };

  const handleOtherInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onIndustryChange(e.target.value);
  };

  const primaryGoalFilled = primaryGoal.trim() && primaryGoal !== '_other_';
  const isValid = primaryGoalFilled && targetAudience.trim() && industry.trim();

  return (
    <Card className="border-slate-200 bg-white shadow-lg">
      <CardHeader className="text-center pb-6">
        <div className="w-16 h-16 bg-white border-2 border-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-slate-900" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Website Context</CardTitle>
        <p className="text-slate-600 mt-2">
          Help us understand the site so we can tailor the analysis.
        </p>

        <CaptureStatus captureJob={captureJob} captureStarted={captureStarted} />
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Industry */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Industry</Label>
          <Select value={selectValue} onValueChange={handleSelectChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select an industry…" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((ind) => (
                <SelectItem key={ind} value={ind === 'Other' ? OTHER_SENTINEL : ind}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectValue === OTHER_SENTINEL && (
            <Input
              placeholder="Please specify your industry"
              value={industry}
              onChange={handleOtherInputChange}
              autoFocus
            />
          )}
        </div>

        {/* Primary Goal */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Primary goal of this website</Label>
          <Textarea
            placeholder="e.g., Sell customisable contour maps as wall art to outdoor enthusiasts"
            value={primaryGoal}
            onChange={(e) => onPrimaryGoalChange(e.target.value)}
            className="min-h-[80px] resize-none"
          />
        </div>

        {/* Target Audience */}
        <div className="space-y-2">
          <Label htmlFor="target-audience" className="text-sm font-medium">
            Target audience
          </Label>
          <Input
            id="target-audience"
            type="text"
            placeholder="e.g., Small business owners in the UK, Gen-Z fashion shoppers"
            value={targetAudience}
            onChange={(e) => onTargetAudienceChange(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={onNext}
            disabled={!isValid}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
