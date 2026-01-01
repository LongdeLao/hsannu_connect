'use client';

export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FingerprintIcon } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button as StatefulButton } from '@/components/ui/stateful-button';
import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { API_URL } from '../../../config';
import {
  isWebAuthnSupported,
  createCredentialRequestOptions,
  preparePublicKeyCredential,
} from '../../../lib/webauthn';
import Image from 'next/image';
import { setCookie } from 'cookies-next'

interface UserData {
  id: number | null;
  username: string;
  name?: string;
  role?: 'student' | 'staff' | string;
  additional_roles?: string[];
  status?: string;
  email?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    setPasskeySupported(isWebAuthnSupported());
  }, []);

  useEffect(() => {
    if (errorMsg) toast.error(errorMsg);
  }, [errorMsg]);

  const navigateToRoleHome = useCallback((_role?: string) => {
    router.push('/shared/events');
  }, [router]);

  // Check for existing authentication on page load
  useEffect(() => {
    const checkExistingAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const isLoggedIn = localStorage.getItem('loggedIn');
        
        if (storedUser && isLoggedIn === 'true') {
          const userData = JSON.parse(storedUser);
          console.log('Found existing authentication, redirecting...', userData);
          navigateToRoleHome(userData.role);
        }
      } catch (error) {
        console.error('Error checking existing auth:', error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('loggedIn');
      }
    };

    checkExistingAuth();
  }, [navigateToRoleHome]);

  const setAuthCookies = (role?: string) => {
    setCookie('loggedIn', 'true', { maxAge: 60 * 60 * 24 * 7 })
    if (role) setCookie('userRole', role, { maxAge: 60 * 60 * 24 * 7 })
    }

  const handleLogin = async (): Promise<boolean> => {
    try {
      setErrorMsg('');

      if (username === 'staff' && password === 'password') {
        const userData: UserData = {
          username: 'staff',
          role: 'staff',
          name: 'Staff User',
          id: 1001,
          additional_roles: ['teacher', 'admin'],
          status: 'active',
	          email: 'staff@hsannu.com',
        };
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('loggedIn', 'true');
        setAuthCookies(userData.role)
        setCurrentUser(userData);
        return true;
      } else if (username === 'student' && password === 'password') {
        const userData: UserData = {
          username: 'student',
          role: 'student',
          name: 'Student User',
          id: 2001,
          additional_roles: ['class_representative'],
          status: 'active',
	          email: 'student@hsannu.com',
        };
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('loggedIn', 'true');
        setAuthCookies(userData.role)
        setCurrentUser(userData);
        return true;
      }

      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        type ApiUser = UserData & { password?: string; [key: string]: unknown };
        const apiUser = data as ApiUser;
        const { password: _unusedPassword, ...rest } = apiUser;
        void _unusedPassword;
        const userData: UserData = {
          ...rest,
          id: apiUser.id ? parseInt(String(apiUser.id), 10) : null,
          additional_roles: apiUser.additional_roles || [],
        } as UserData;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('loggedIn', 'true');
        setAuthCookies(userData.role)
        setCurrentUser(userData);
        return true;
      } else {
        setErrorMsg((data as { error?: string }).error || 'Login failed');
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred while logging in.';
      setErrorMsg(message);
      return false;
    } finally {
    }
  };

  const handlePasskeyLogin = async () => {
    if (!username) {
      setErrorMsg('Please enter your username first');
      return;
    }

    try {
      setIsPasskeyLoading(true);
      setErrorMsg('');

      const beginResponse = await fetch(`${API_URL}/api/login-passkey-begin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!beginResponse.ok) {
        const errorData = await beginResponse.json();
        throw new Error(errorData.error || 'Failed to start passkey authentication');
      }

      const beginData = await beginResponse.json();
      const publicKeyCredentialRequestOptions = createCredentialRequestOptions(beginData);

      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      });

      if (!credential) throw new Error('No credential returned');

      const webAuthnResponse = preparePublicKeyCredential(credential as PublicKeyCredential);

      const finishResponse = await fetch(`${API_URL}/api/login-passkey-finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          session_id: beginData.sessionId,
          webauthn_response: webAuthnResponse,
        }),
      });

      if (!finishResponse.ok) {
        const errorData = await finishResponse.json();
        throw new Error(errorData.error || 'Passkey authentication failed');
      }

      const userData: UserData = await finishResponse.json();
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('loggedIn', 'true');
      setAuthCookies(userData.role)
      await new Promise((r) => setTimeout(r, 400));
      navigateToRoleHome(userData.role);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Passkey authentication failed';
      setErrorMsg(message);
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  // Move the form JSX directly into the return statement to avoid recreating the component

  return (
    <div className={cn("grid min-h-svh lg:grid-cols-2 overflow-hidden", exiting && "opacity-0 transition-opacity duration-300")}>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium dark:text-neutral-100">
            <Image 
              src="/logo.png" 
              alt="HSANNU Connect Logo" 
              width={24} 
              height={24} 
              className="rounded-md"
              unoptimized
            />
            HSANNU Connect
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <form className={cn("flex flex-col gap-6")} onSubmit={(e) => { e.preventDefault(); }}>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-neutral-100">Login to your account</h1>
                <p className="text-muted-foreground text-sm text-balance dark:text-neutral-400">
                  Enter your username and password to login
                </p>
              </div>
              
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="username" className="dark:text-neutral-200">Username</Label>
                  <Input 
                    id="username" 
                    type="text" 
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100"
                    required 
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password" className="dark:text-neutral-200">Password</Label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="ml-auto text-sm underline-offset-4 hover:underline text-gray-700 dark:text-neutral-300 hover:text-black dark:hover:text-neutral-100"
                    >
                      Forgot your password?
                    </button>
                  </div>
<PasswordInput 
   id="password" 
   value={password}
   onChange={(e) => setPassword(e.target.value)}
   className="dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100"
   required 
/>
                </div>
                <StatefulButton 
                  type="button" 
                  className="w-full"
                  onClick={async () => {
                                                                const ok = await handleLogin();
                      if (ok) {
                        setExiting(true);
                        await new Promise((r) => setTimeout(r, 450));
                        const stored = localStorage.getItem('user');
                        const role = stored ? (JSON.parse(stored) as UserData).role : currentUser?.role;
                        navigateToRoleHome(role);
                      }
                      return ok;
                  }}
                >
                  Login
                </StatefulButton>
                
                {passkeySupported && (
                  <>
                    <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t dark:after:border-neutral-600">
                      <span className="bg-background text-muted-foreground relative z-10 px-2 dark:bg-neutral-800 dark:text-neutral-400">
                        Or continue with
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-600"
                      onClick={handlePasskeyLogin}
                      disabled={isPasskeyLoading}
                      type="button"
                    >
                      {isPasskeyLoading ? (
                        <span>Authenticating...</span>
                      ) : (
                        <>
                          <FingerprintIcon className="mr-2 h-4 w-4" />
                          Login with Passkey
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
              <AuroraBackground className="relative hidden lg:block">
          <motion.div
            initial={{ opacity: 0.0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              ease: "easeInOut",
            }}
            className="relative flex flex-col gap-4 items-center justify-center px-4 h-full"
          >
                         <div className="mx-auto max-w-lg text-2xl font-bold tracking-tight md:text-4xl text-center text-white dark:text-black will-change-transform">
              Stay on track with HSANNU <PointerHighlight><span>Connect</span></PointerHighlight>
            </div>
            <div className="font-extralight text-base md:text-xl text-neutral-200 dark:text-neutral-700 py-2 text-center max-w-md">
              
              
            </div>
          </motion.div>
        </AuroraBackground>
    </div>
  );
}

 