'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { PasswordInput } from '@/components/ui/password-input';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { API_URL } from '../../../config';
import { toast } from 'sonner';

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = useMemo(() => (params?.get('session_id') ?? ''), [params]);
  const verifiedCode = useMemo(() => (params?.get('code') ?? ''), [params]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  useEffect(() => {
    if (errorMsg) toast.error(errorMsg);
  }, [errorMsg]);

  const handleReset = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!sessionId || !verifiedCode) {
      setErrorMsg('Verification required. Please verify your code again.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    try {
      setIsResetting(true);
      const resp = await fetch(`${API_URL}/api/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, code: verifiedCode, new_password: newPassword }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error((data as { error?: string }).error || 'Failed to reset password');
      }
      setSuccessMsg('Password reset successful. Redirecting to login...');
      setTimeout(() => router.push('/login'), 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password';
      setErrorMsg(msg);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-neutral-800 rounded-lg">
        <button
          onClick={() => router.push('/verify-code')}
          className="mb-6 inline-flex items-center text-sm text-gray-700 dark:text-neutral-300 hover:text-black dark:hover:text-neutral-100"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
        </button>

        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800 dark:text-neutral-100">Set New Password</h1>
        <p className="text-center text-gray-600 dark:text-neutral-300 mb-6">
          Enter and confirm your new password.
        </p>

        <div className="mb-2">
          <label htmlFor="password" className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">
            New Password
          </label>
<PasswordInput
    id="password"
    value={newPassword}
    onChange={(e) => setNewPassword(e.target.value)}
    className="w-full border-b border-gray-300 dark:border-neutral-600 focus:border-black dark:focus:border-neutral-400 outline-none py-2 bg-transparent text-gray-800 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500"
    placeholder="At least 8 characters"
  />
        </div>

        <div className="mb-4">
          <label htmlFor="confirm" className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">
            Confirm Password
          </label>
<PasswordInput
    id="confirm"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
    className="w-full border-b border-gray-300 dark:border-neutral-600 focus:border-black dark:focus:border-neutral-400 outline-none py-2 bg-transparent text-gray-800 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500"
    placeholder="Re-enter new password"
  />
        </div>


        <button
          onClick={handleReset}
          disabled={isResetting}
          className="w-full py-3 mt-4 bg-black dark:bg-neutral-700 hover:bg-gray-800 dark:hover:bg-neutral-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-70"
        >
          {isResetting ? 'Resetting...' : 'Reset Password'}
        </button>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
} 