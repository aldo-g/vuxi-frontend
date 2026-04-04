"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function NoCreditsDialog({ open, onClose, onRedeemed }: {
  open: boolean;
  onClose: () => void;
  onRedeemed: (newTotal: number) => void;
}) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRedeem = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to redeem voucher.');
      } else {
        setSuccess(`${data.creditsAdded} credit${data.creditsAdded !== 1 ? 's' : ''} added!`);
        onRedeemed(data.totalCredits);
        setCode('');
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) { setCode(''); setError(''); setSuccess(''); onClose(); }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>You need credits to run an analysis</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-1">
          <p className="text-sm text-slate-600">
            Each analysis costs 1 credit. You currently have none.{' '}
            <a
              href="mailto:alastairegrant@pm.me?subject=Vuxi beta access"
              className="text-teal-600 hover:underline"
            >
              Email alastairegrant@pm.me
            </a>{' '}
            to get a voucher code during the beta.
          </p>

          <div className="border-t pt-4 space-y-3">
            <Label htmlFor="nc-voucher-code">Already have a code? Redeem it here</Label>
            <div className="flex gap-2">
              <Input
                id="nc-voucher-code"
                placeholder="XXXX-XXXX-XXXX"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') handleRedeem(); }}
              />
              <Button onClick={handleRedeem} disabled={loading || !code.trim()}>
                {loading ? '...' : 'Redeem'}
              </Button>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-600">{success} You can now run your analysis.</p>}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
