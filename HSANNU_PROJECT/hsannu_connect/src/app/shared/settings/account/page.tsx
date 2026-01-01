"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCookie } from "cookies-next";
import { API_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Home, User, LockKeyhole } from "lucide-react";

interface UserProfile {
	id: number
	username: string
	name: string
	role: string
	email: string
	status: string
	profile_picture: string
	additional_roles: string[]
}

export default function AccountSettingsPage() {
	const [profile, setProfile] = useState<UserProfile | null>(null)
	const [loading, setLoading] = useState(true)
	const [email, setEmail] = useState("")
	const [savingEmail, setSavingEmail] = useState(false)
	const [emailMsg, setEmailMsg] = useState<string>("")

	const [currentPassword, setCurrentPassword] = useState("")
	const [newPassword, setNewPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [changingPassword, setChangingPassword] = useState(false)
	const [passwordMsg, setPasswordMsg] = useState<string>("")

	useEffect(() => {
		async function fetchProfile() {
			try {
				const cookieUserId = getCookie('userId')
				let currentUserId: string | number | null = cookieUserId ? String(cookieUserId) : null
				if (!currentUserId) {
					const stored = localStorage.getItem('user')
					if (stored) {
						const parsed = JSON.parse(stored)
						currentUserId = parsed?.id ?? null
					}
				}
				if (!currentUserId) {
					setLoading(false)
					return
				}
				const resp = await fetch(`${API_URL}/api/profile/${currentUserId}`, { cache: 'no-store' })
				if (!resp.ok) {
					setLoading(false)
					return
				}
				const data: UserProfile = await resp.json()
				setProfile(data)
				setEmail(data.email === 'not-registered' ? '' : data.email)
			} finally {
				setLoading(false)
			}
		}
		fetchProfile()
	}, [])

	async function handleSaveEmail() {
		if (!profile) return
		setSavingEmail(true)
		setEmailMsg("")
		try {
			const token = getCookie('token')
			const resp = await fetch(`${API_URL}/api/profile/update-email/${profile.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ email })
			})
			if (!resp.ok) {
				const text = await resp.text()
				throw new Error(text || 'Failed to update email')
			}
			setProfile({ ...profile, email })
			setEmailMsg('Email updated successfully')
		} catch (e) {
			setEmailMsg(e instanceof Error ? e.message : 'Failed to update email')
		} finally {
			setSavingEmail(false)
		}
	}

	async function handleChangePassword() {
		if (!profile) return
		if (!currentPassword || !newPassword || !confirmPassword) {
			setPasswordMsg('All fields are required')
			return
		}
		if (newPassword !== confirmPassword) {
			setPasswordMsg('New passwords do not match')
			return
		}
		if (newPassword.length < 8) {
			setPasswordMsg('New password must be at least 8 characters long')
			return
		}
		setChangingPassword(true)
		setPasswordMsg("")
		try {
			const resp = await fetch(`${API_URL}/api/profile/change-password/${profile.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ currentPassword, newPassword })
			})
			if (!resp.ok) {
				const text = await resp.text()
				throw new Error(text || 'Failed to change password')
			}
			setPasswordMsg('Password changed successfully')
			setCurrentPassword('')
			setNewPassword('')
			setConfirmPassword('')
		} catch (e) {
			setPasswordMsg(e instanceof Error ? e.message : 'Failed to change password')
		} finally {
			setChangingPassword(false)
		}
	}

	return (
		<div className="p-6">
			<div className="mb-4">
				<nav className="flex items-center space-x-2 text-sm text-muted-foreground">
					<Link href="/shared" className="hover:text-foreground transition-colors">
						<Home className="h-4 w-4" />
					</Link>
					<ChevronRight className="h-4 w-4" />
					<Link href="/shared/settings" className="hover:text-foreground transition-colors">
						Settings
					</Link>
					<ChevronRight className="h-4 w-4" />
					<span className="text-foreground font-medium">Account</span>
				</nav>
			</div>

			<div className="mb-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
							<User className="h-6 w-6" />
							Account
						</h1>
						<p className="text-sm text-muted-foreground mt-1">
							Manage your profile email and password
						</p>
					</div>
					<Button variant="secondary" asChild>
						<Link href="/shared/settings">Back to Settings</Link>
					</Button>
				</div>
			</div>

			<div className="space-y-6">
				<Card className="border-0 shadow-none bg-transparent">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">Profile Email</CardTitle>
						<CardDescription>Set or update the email linked to your account</CardDescription>
					</CardHeader>
					<CardContent>
						{loading ? (
							<div className="text-sm text-muted-foreground">Loading...</div>
						) : (
							<div className="grid gap-3 max-w-md">
								<Label htmlFor="email">Email</Label>
								<Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
								<div className="flex items-center gap-3">
									<Button onClick={handleSaveEmail} disabled={savingEmail || !email.trim()}>
										{savingEmail ? 'Saving...' : 'Save Email'}
									</Button>
									{emailMsg && (
										<span className="text-xs text-muted-foreground">{emailMsg}</span>
									)}
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				<Card className="border-0 shadow-none bg-transparent">
					<CardHeader>
						<CardTitle className="flex items-center gap-2"><LockKeyhole className="h-5 w-5" />Change Password</CardTitle>
						<CardDescription>Update your password to keep your account secure</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-3 max-w-md">
							<Label htmlFor="currentPassword">Current Password</Label>
							<PasswordInput id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />

							<Label htmlFor="newPassword">New Password</Label>
							<PasswordInput id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />

							<Label htmlFor="confirmPassword">Confirm New Password</Label>
							<PasswordInput id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />

							<div className="text-xs text-muted-foreground">
								Password must be at least 8 characters long
							</div>

							<div className="flex items-center gap-3">
								<Button onClick={handleChangePassword} disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}>
									{changingPassword ? 'Changing...' : 'Change Password'}
								</Button>
								{passwordMsg && (
									<span className="text-xs text-muted-foreground">{passwordMsg}</span>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
} 