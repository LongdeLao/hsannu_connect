"use client";

import { useState, useEffect, useId, useRef } from "react";
import Link from "next/link";
import { Home, ChevronRight, BookOpen, User } from "lucide-react";
import { API_URL } from "@/config";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";

// Subject interface based on the API structure
interface Subject {
	subject: string;
	code: string;
	initials: string;
	teaching_group: string;
	teacher_id: number;
	teacher_name: string;
}

export default function ClassesPage() {
	const [classes, setClasses] = useState<Subject[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [active, setActive] = useState<Subject | null>(null);
	const ref = useRef<HTMLDivElement>(null);
	const id = useId();

	// Function to clean subject names by removing Chinese text
	const cleanSubjectName = (subject: string) => {
		// Remove Chinese characters (anything that's not Latin alphabet, numbers, or common punctuation)
		return subject.replace(/[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\uf900-\ufaff\u3300-\u33ff\ufe30-\ufe4f\uf900-\ufaff\u{2f800}-\u{2fa1f}]/gu, '').trim();
	};

	// Fetch classes data
	useEffect(() => {
		const fetchClasses = async () => {
			try {
				setLoading(true);
				setError(null);
				
				// Get user ID from localStorage
				const userStr = localStorage.getItem("user");
				if (!userStr) {
					throw new Error("User not found");
				}
				
				const user = JSON.parse(userStr);
				const response = await fetch(`${API_URL}/api/get_student_information?userid=${user.id}`);
				
				if (!response.ok) {
					throw new Error("Failed to fetch classes");
				}
				
				const data = await response.json();
				
				if (!data.success) {
					throw new Error(data.message || "Failed to load classes");
				}
				
				setClasses(data.student?.classes || []);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Something went wrong");
			} finally {
				setLoading(false);
			}
		};

		fetchClasses();
	}, []);

	// Ensure body scroll lock when modal is open
	useEffect(() => {
		if (active) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "auto";
		}
		return () => { document.body.style.overflow = "auto" };
	}, [active]);

	useOutsideClick(ref, () => setActive(null));

	// Get level badge variant (neutral)
	const getLevelBadge = (subject: string) => {
		if (subject.includes("HL")) return { text: "HL", variant: "outline" as const };
		if (subject.includes("SL")) return { text: "SL", variant: "outline" as const };
		return null;
	};

	// Filter to IB1 / IB2 only and cap at 6
	const filtered = classes
		.filter((c) => c?.teaching_group?.startsWith("IB1") || c?.teaching_group?.startsWith("IB2"))
		.slice(0, 6);

	return (
		<div className="p-6">
			{/* Breadcrumbs */}
			<div className="mb-4">
				<nav className="flex items-center space-x-2 text-sm text-muted-foreground">
					<Link href="/shared" className="hover:text-foreground transition-colors">
						<Home className="h-4 w-4" />
					</Link>
					<ChevronRight className="h-4 w-4" />
					<span className="text-foreground font-medium">Classes</span>
				</nav>
			</div>

			{/* Header */}
			<div className="mb-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-semibold text-foreground">My Classes</h1>
						<p className="text-sm text-muted-foreground mt-1">
							Only showing IB1 and IB2 classes
						</p>
					</div>
					<div className="flex items-center gap-2 text-muted-foreground">
						<span className="text-sm font-medium text-foreground">
							{filtered.length} {filtered.length === 1 ? 'Class' : 'Classes'}
						</span>
					</div>
				</div>
			</div>

			{/* Overlay for modal */}
			<AnimatePresence>
				{active && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/20 backdrop-blur-sm h-full w-full z-10"
					/>
				)}
			</AnimatePresence>

			{/* Modal */}
			<AnimatePresence>
				{active ? (
					<div className="fixed inset-0 grid place-items-center z-[100] p-4">
						<motion.div
							layoutId={`card-${active.code}-${id}`}
							ref={ref}
							className="w-full max-w-xl h-full md:h-fit md:max-h-[85%] flex flex-col bg-background border rounded-xl shadow-lg overflow-hidden"
							initial={{ opacity: 0, scale: 0.98 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.98 }}
						>
							<div className="flex flex-col min-h-0 flex-1">
								<div className="flex justify-between items-start p-6 border-b">
									<div className="flex-1 min-w-0">
										<motion.h3 layoutId={`title-${active.code}-${id}`} className="text-xl font-semibold text-foreground truncate">
											{cleanSubjectName(active.subject)}
										</motion.h3>
										<p className="text-sm text-muted-foreground mt-1">
											{active.code} • Group {active.teaching_group}
										</p>
									</div>
									<div className="ml-4 shrink-0">
										{getLevelBadge(active.subject) && (
											<Badge variant="outline">{getLevelBadge(active.subject)!.text}</Badge>
										)}
									</div>
								</div>

								<div className="flex-1 overflow-y-auto p-6 space-y-4">
									<Card className="p-4">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-sm text-muted-foreground">Teacher</p>
												<p className="text-base font-medium text-foreground">{active.teacher_name || "No teacher assigned"}</p>
											</div>
											<div className="p-2 rounded-full bg-muted">
												<User className="h-4 w-4 text-muted-foreground" />
											</div>
										</div>
									</Card>

									<Card className="p-4">
										<p className="text-sm text-muted-foreground mb-1">Subject code</p>
										<p className="text-base font-medium text-foreground">{active.code}</p>
									</Card>
								</div>
							</div>
						</motion.div>
					</div>
				) : null}
			</AnimatePresence>

			{/* Content */}
			<div className="space-y-4">
				{loading ? (
					// Loading State (6 skeletons)
					<div className="space-y-3">
						{Array.from({ length: 6 }).map((_, i) => (
							<Card key={i}>
								<CardContent className="p-4">
									<div className="flex items-center justify-between">
										<div className="flex-1 space-y-2">
											<Skeleton className="h-4 w-2/3" />
											<Skeleton className="h-3 w-1/3" />
										</div>
										<div className="flex items-center gap-3">
											<Skeleton className="h-5 w-12" />
											<Skeleton className="h-6 w-6 rounded-full" />
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				) : error ? (
					// Error State
					<div className="text-center py-12">
						<div className="text-muted-foreground mb-4">
							<BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
							<h3 className="text-lg font-medium mb-1">Failed to load classes</h3>
							<p className="text-sm">{error}</p>
						</div>
						<Button onClick={() => window.location.reload()} variant="outline">
							Try Again
						</Button>
					</div>
				) : filtered.length === 0 ? (
					// Empty State
					<div className="text-center py-12">
						<div className="text-muted-foreground mb-4">
							<BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
							<h3 className="text-lg font-medium mb-1">No IB1/IB2 classes</h3>
							<p className="text-sm">PIB classes are hidden from this view</p>
						</div>
					</div>
				) : (
					// Compact Classes List (neutral)
					<div className="space-y-2">
						{filtered.map((classItem, index) => {
							const levelBadge = getLevelBadge(classItem.subject);
							const cleanedSubject = cleanSubjectName(classItem.subject);
							
							return (
								<motion.div
									layoutId={`card-${classItem.code}-${id}`}
									key={`${classItem.code}-${index}`}
									onClick={() => setActive(classItem)}
									className="p-3 flex items-center justify-between hover:bg-muted/50 rounded-xl cursor-pointer transition-colors border bg-background"
								>
									<div className="flex items-center gap-3 min-w-0">
										<div className="p-2 rounded-lg bg-muted">
											<BookOpen className="h-4 w-4 text-muted-foreground" />
										</div>
										<div className="min-w-0">
											<div className="flex items-center gap-2">
												<h3 className="font-medium text-foreground truncate">{cleanedSubject}</h3>
												{levelBadge && (
													<Badge variant="outline" className="text-xs">
														{levelBadge.text}
													</Badge>
												)}
											</div>
											<p className="text-xs text-muted-foreground truncate">
												{classItem.code} • Group {classItem.teaching_group}
											</p>
										</div>
									</div>
									<div className="shrink-0 text-right">
										<p className="text-sm font-medium text-foreground truncate max-w-[12rem]">
											{classItem.teacher_name || "No teacher"}
										</p>
										<p className="text-xs text-muted-foreground">{classItem.initials}</p>
									</div>
								</motion.div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
} 