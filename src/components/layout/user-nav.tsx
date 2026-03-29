'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ticket } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/constants';

type User = {
  Name: string;
  email: string;
  credits: number;
};

export function UserNav() {
  const [user, setUser] = useState<User | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [voucherOpen, setVoucherOpen] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [voucherSuccess, setVoucherSuccess] = useState('');

  useEffect(() => {
    fetch(API_ENDPOINTS.AUTH.ME)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setUser(data.user ?? data); })
      .catch(() => {});
  }, []);

  const getInitials = (name: string): string => {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const openVoucher = () => {
    setVoucherCode('');
    setVoucherError('');
    setVoucherSuccess('');
    setVoucherOpen(true);
  };

  const handleRedeem = async () => {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    setVoucherError('');
    setVoucherSuccess('');
    try {
      const res = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVoucherError(data.error ?? 'Failed to redeem voucher.');
      } else {
        setVoucherSuccess(`${data.creditsAdded} credit${data.creditsAdded !== 1 ? 's' : ''} added! You now have ${data.totalCredits}.`);
        setUser(prev => prev ? { ...prev, credits: data.totalCredits } : prev);
        setVoucherCode('');
      }
    } catch {
      setVoucherError('Something went wrong.');
    } finally {
      setVoucherLoading(false);
    }
  };

  const openEdit = () => {
    setName(user?.Name ?? '');
    setEmail(user?.email ?? '');
    setError('');
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(API_ENDPOINTS.AUTH.UPDATE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to save.');
      } else {
        setUser(prev => ({ credits: prev?.credits ?? 0, Name: data.Name, email: data.email }));
        setEditOpen(false);
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={openVoucher}
        className="h-8 text-xs gap-1.5 text-slate-600"
      >
        <Ticket className="h-3.5 w-3.5" />
        {user != null ? `${user.credits} credit${user.credits !== 1 ? 's' : ''}` : 'Credits'}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-slate-200 text-slate-800 text-xs font-medium">
                {user ? getInitials(user.Name) : ''}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.Name || 'Loading...'}</p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email || ''}</p>
              {user != null && (
                <p className="text-xs leading-none text-muted-foreground pt-1">
                  {user.credits} credit{user.credits !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={openVoucher}>
            Redeem Voucher
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={openEdit}>
            Edit Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href={API_ENDPOINTS.AUTH.LOGOUT} className="w-full">Log out</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={voucherOpen} onOpenChange={setVoucherOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redeem Voucher</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Enter your voucher code below. Each code adds credits to your account — one credit per analysis.
            </p>
            <div className="space-y-1">
              <Label htmlFor="voucher-code">Voucher Code</Label>
              <Input
                id="voucher-code"
                placeholder="XXXX-XXXX-XXXX"
                value={voucherCode}
                onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') handleRedeem(); }}
              />
            </div>
            {voucherError && <p className="text-sm text-red-500">{voucherError}</p>}
            {voucherSuccess && <p className="text-sm text-green-600">{voucherSuccess}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setVoucherOpen(false)}>Close</Button>
              <Button onClick={handleRedeem} disabled={voucherLoading || !voucherCode.trim()}>
                {voucherLoading ? 'Redeeming...' : 'Redeem'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
