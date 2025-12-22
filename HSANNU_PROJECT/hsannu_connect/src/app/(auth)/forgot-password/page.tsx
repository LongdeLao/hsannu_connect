'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EnvelopeIcon, ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { API_URL } from '../../../config';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (errorMsg) toast.error(errorMsg);
  }, [errorMsg]);

  const validateEmail = (value: string) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(value).toLowerCase());
  };

  const handleSubmit = async () => {
    if (!emailOrUsername || !validateEmail(emailOrUsername)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg('');
      setMessage('');

      const resp = await fetch(`${API_URL}/api/password/reset-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOrUsername }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error((data as { error?: string }).error || 'Failed to send verification code');
      }

      setMessage('Verification code sent to your email');
      const sessionId = (data as { session_id?: string }).session_id;
      if (sessionId) {
        router.push(`/verify-code?session_id=${encodeURIComponent(sessionId)}&email=${encodeURIComponent(emailOrUsername)}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send verification code';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-neutral-800 rounded-lg">
        <button
          onClick={() => router.push('/login')}
          className="mb-6 inline-flex items-center text-sm text-gray-700 dark:text-neutral-300 hover:text-black dark:hover:text-neutral-100"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Login
        </button>

        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800 dark:text-neutral-100">Forgot Password</h1>
        <p className="text-center text-gray-600 dark:text-neutral-300 mb-6">
          Enter your email address to receive a verification code.
        </p>

        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
            <EnvelopeIcon className="h-5 w-5 text-gray-400 dark:text-neutral-500" />
          </div>
          <input
            id="email"
            type="email"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            className="block w-full border-b border-gray-300 dark:border-neutral-600 focus:border-black dark:focus:border-neutral-400 outline-none py-2 pl-10 bg-transparent text-gray-800 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500"
            placeholder="Email address"
            autoComplete="email"
          />
        </div>


        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full py-3 mt-6 bg-black dark:bg-neutral-700 hover:bg-gray-800 dark:hover:bg-neutral-600 text-white font-semibold rounded-lg flex justify-center items-center space-x-2 transition-colors disabled:opacity-70"
        >
          {isLoading ? (
            <span>Sending...</span>
          ) : (
            <>
              <span>Send Code</span>
              <PaperAirplaneIcon className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
} 