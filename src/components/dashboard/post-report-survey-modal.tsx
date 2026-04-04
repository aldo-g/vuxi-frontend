"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

interface PostReportSurveyModalProps {
  open: boolean;
  onClose: () => void;
  onCompleted: (newTotalCredits: number) => void;
}

const PREVIOUS_FEEDBACK_OPTIONS = [
  { value: "user_testing", label: "User testing / usability sessions" },
  { value: "ux_consultant", label: "Hired a UX consultant or agency" },
  { value: "colleagues", label: "Asked colleagues or stakeholders" },
  { value: "analytics", label: "Just shipped and watched analytics" },
  { value: "no_feedback", label: "I didn't — this was a gap I had" },
  { value: "other", label: "Other" },
];

const FREQUENCY_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "once_or_twice", label: "Once or twice ever" },
  { value: "few_times_year", label: "A few times a year" },
  { value: "monthly", label: "Monthly or more" },
];

const ACTIONABILITY_OPTIONS = [
  { value: "yes_fixing", label: "Yes, I know exactly what I'm fixing" },
  { value: "maybe", label: "Maybe — I need to think about it" },
  { value: "real_not_priority", label: "The issues were real but not a priority right now" },
  { value: "not_really", label: "Not really" },
];

const ACCURACY_OPTIONS = [
  { value: "spot_on", label: "Spot on" },
  { value: "mostly_right", label: "Mostly right, a few misses" },
  { value: "mixed", label: "Mixed — some good, some off" },
  { value: "missed", label: "Mostly missed the mark" },
];

const ROLE_OPTIONS = [
  { value: "founder", label: "Founder / co-founder" },
  { value: "product", label: "Product manager" },
  { value: "designer", label: "Designer" },
  { value: "developer", label: "Developer" },
  { value: "marketer", label: "Marketer" },
  { value: "freelancer", label: "Freelancer / agency" },
  { value: "other", label: "Other" },
];

const SITE_TYPE_OPTIONS = [
  { value: "saas", label: "SaaS / web app" },
  { value: "marketing", label: "Marketing / landing page" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "portfolio", label: "Portfolio / personal site" },
  { value: "internal", label: "Internal tool" },
  { value: "other", label: "Other" },
];

const PREVIOUS_COST_OPTIONS = [
  { value: "under_50", label: "Under £50 one-off" },
  { value: "50_200", label: "£50–£200 one-off" },
  { value: "200_plus", label: "£200+ one-off" },
  { value: "subscription", label: "Monthly subscription" },
];

const EARLY_ACCESS_OPTIONS = [
  { value: "yes", label: "Yes, sign me up" },
  { value: "maybe", label: "Maybe, tell me more" },
  { value: "no", label: "Not right now" },
];

type Step = 1 | 2 | 3 | 4;

export function PostReportSurveyModal({ open, onClose, onCompleted }: PostReportSurveyModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [previousFeedbackMethods, setPreviousFeedbackMethods] = useState<string[]>([]);
  const [feedbackFrequency, setFeedbackFrequency] = useState("");
  const [surprisedBy, setSurprisedBy] = useState("");
  const [actionability, setActionability] = useState("");
  const [accuracy, setAccuracy] = useState("");
  const [role, setRole] = useState("");
  const [siteType, setSiteType] = useState("");
  const [alternativeIfGone, setAlternativeIfGone] = useState("");
  const [paidBefore, setPaidBefore] = useState<boolean | null>(null);
  const [paidForWhat, setPaidForWhat] = useState("");
  const [previousCost, setPreviousCost] = useState("");
  const [earlyAccessInterest, setEarlyAccessInterest] = useState("");

  const toggleMethod = (value: string) => {
    setPreviousFeedbackMethods(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previousFeedbackMethods,
          feedbackFrequency,
          surprisedBy,
          actionability,
          accuracy,
          role,
          siteType,
          alternativeIfGone,
          paidBefore,
          paidForWhat: paidBefore ? paidForWhat : null,
          previousCost: paidBefore ? previousCost : null,
          earlyAccessInterest,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        onCompleted(data.totalCredits);
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalSteps = 4;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Quick feedback — earn 1 free credit
            </DialogTitle>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            2 minutes. Helps us improve. You get a free analysis credit when done.
          </p>
          {/* Progress bar */}
          <div className="flex gap-1 mt-3">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-slate-800" : "bg-slate-200"}`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-5">

          {/* Step 1 — Before Vuxi */}
          {step === 1 && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-800">
                  Before trying Vuxi, how did you get feedback on your site?
                  <span className="text-slate-400 font-normal ml-1">(select all that apply)</span>
                </Label>
                <div className="space-y-2">
                  {PREVIOUS_FEEDBACK_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleMethod(opt.value)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                        previousFeedbackMethods.includes(opt.value)
                          ? "border-slate-800 bg-slate-800 text-white font-medium"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-800">
                  How often were you getting web feedback before today?
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {FREQUENCY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFeedbackFrequency(opt.value)}
                      className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                        feedbackFrequency === opt.value
                          ? "border-slate-800 bg-slate-800 text-white font-medium"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 2 — The report */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-800">
                  Looking at the report — did anything surprise you?
                  <span className="text-slate-400 font-normal ml-1">(optional)</span>
                </Label>
                <Textarea
                  placeholder="e.g. I didn't realise the navigation was so confusing..."
                  value={surprisedBy}
                  onChange={e => setSurprisedBy(e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-800">
                  Did the report identify anything you're actually going to do something about?
                </Label>
                <div className="space-y-2">
                  {ACTIONABILITY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setActionability(opt.value)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                        actionability === opt.value
                          ? "border-slate-800 bg-slate-800 text-white font-medium"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-800">
                  How accurate did the analysis feel overall?
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {ACCURACY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAccuracy(opt.value)}
                      className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                        accuracy === opt.value
                          ? "border-slate-800 bg-slate-800 text-white font-medium"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 3 — Context */}
          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-800">
                  What best describes your role?
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                        role === opt.value
                          ? "border-slate-800 bg-slate-800 text-white font-medium"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-800">
                  What kind of site did you analyse?
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {SITE_TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSiteType(opt.value)}
                      className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                        siteType === opt.value
                          ? "border-slate-800 bg-slate-800 text-white font-medium"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 4 — Mom test + pricing */}
          {step === 4 && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-800">
                  If Vuxi stopped working tomorrow, what would you do instead?
                </Label>
                <Textarea
                  placeholder="e.g. Go back to asking colleagues, or just skip feedback altogether..."
                  value={alternativeIfGone}
                  onChange={e => setAlternativeIfGone(e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-800">
                  Have you ever paid for any kind of web or site feedback before?
                </Label>
                <div className="flex gap-2">
                  {[{ value: true, label: "Yes" }, { value: false, label: "No" }].map(opt => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setPaidBefore(opt.value)}
                      className={`flex-1 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                        paidBefore === opt.value
                          ? "border-slate-800 bg-slate-800 text-white font-medium"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {paidBefore && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-800">
                      What did you pay for?
                      <span className="text-slate-400 font-normal ml-1">(optional)</span>
                    </Label>
                    <Textarea
                      placeholder="e.g. UserTesting.com sessions, a freelance UX reviewer..."
                      value={paidForWhat}
                      onChange={e => setPaidForWhat(e.target.value)}
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-800">
                      Roughly what did it cost?
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {PREVIOUS_COST_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setPreviousCost(opt.value)}
                          className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                            previousCost === opt.value
                              ? "border-slate-800 bg-slate-800 text-white font-medium"
                              : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-800">
                  We're planning paid early access. Interested?
                </Label>
                <div className="space-y-2">
                  {EARLY_ACCESS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEarlyAccessInterest(opt.value)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                        earlyAccessInterest === opt.value
                          ? "border-slate-800 bg-slate-800 text-white font-medium"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              {step > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep((s) => (s - 1) as Step)}
                  className="text-slate-500"
                >
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                Skip
              </button>
              {step < totalSteps ? (
                <Button
                  size="sm"
                  onClick={() => setStep((s) => (s + 1) as Step)}
                  className="bg-slate-800 hover:bg-slate-700 text-white"
                >
                  Next
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-slate-800 hover:bg-slate-700 text-white"
                >
                  {submitting ? "Submitting…" : "Submit & claim credit"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
