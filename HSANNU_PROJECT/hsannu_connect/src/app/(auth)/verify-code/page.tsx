'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { API_URL } from '../../../config';

function VerifyCodeContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = useMemo(() => (params?.get('session_id') ?? ''), [params]);

  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const combinedCode = useMemo(() => codeDigits.join(''), [codeDigits]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(0, 1);
    setCodeDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      const prevIndex = index - 1;
      setCodeDigits((prev) => {
        const next = [...prev];
        next[prevIndex] = '';
        return next;
      });
      inputRefs.current[prevIndex]?.focus();
      return;
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      return;
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (combinedCode.length === 6) {
        handleVerify();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = text.split('');
    while (next.length < 6) next.push('');
    setCodeDigits(next);
    const focusIndex = Math.min(text.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  useEffect(() => {
    if (errorMsg) toast.error(errorMsg);
  }, [errorMsg]);

  const handleVerify = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!sessionId || !combinedCode) {
      setErrorMsg('Session and code are required');
      return;
    }

    try {
      setIsVerifying(true);
      const resp = await fetch(`${API_URL}/api/password/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, code: combinedCode }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error((data as { error?: string }).error || 'Invalid verification code');
      }
      setSuccessMsg('Code verified. Continue to set a new password.');
      setTimeout(() => router.push(`/reset-password?session_id=${encodeURIComponent(sessionId)}&code=${encodeURIComponent(combinedCode)}`), 700);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid verification code';
      setErrorMsg(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-neutral-800 rounded-lg">
        <button
          onClick={() => router.push('/forgot-password')}
          className="mb-6 inline-flex items-center text-sm text-gray-700 dark:text-neutral-300 hover:text-black dark:hover:text-neutral-100"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
        </button>

        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800 dark:text-neutral-100">Verify Code</h1>
        <p className="text-center text-gray-600 dark:text-neutral-300 mb-6">
          Enter the 6-digit code we sent to your email.
        </p>

        <div className="mb-4">
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-2">
            Verification Code
          </label>
          <div className="flex items-center justify-center gap-3">
            {codeDigits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-2xl font-semibold rounded-lg border border-gray-300 dark:border-neutral-600 focus:border-black dark:focus:border-neutral-400 outline-none bg-transparent text-gray-800 dark:text-neutral-100"
                aria-label={`Digit ${index + 1}`}
              />
            ))}
            <button
              onClick={handleVerify}
              disabled={isVerifying || combinedCode.length !== 6}
              className="ml-2 px-4 py-2 bg-black dark:bg-neutral-700 hover:bg-gray-800 dark:hover:bg-neutral-600 text-white font-semibold rounded-md flex items-center gap-2 disabled:opacity-70"
            >
              {isVerifying ? 'Verifying...' : (<><span>Verify</span><CheckCircleIcon className="h-5 w-5" /></>)}
            </button>
          </div>
        </div>

        {/* Error messages are shown via Sonner */}
        {successMsg && <div className="mt-2 text-center text-green-600 dark:text-green-400">{successMsg}</div>}
      </div>
    </div>
  );
}

export default function VerifyCodePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <VerifyCodeContent />
    </Suspense>
  );
} 