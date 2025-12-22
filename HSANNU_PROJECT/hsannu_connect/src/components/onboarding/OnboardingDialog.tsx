"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { IconLayoutNavbar, IconLayoutSidebarLeftExpand, IconCheck } from "@tabler/icons-react";

const THEMES = [
	{ id: "system", name: "System (Light/Dark/Default)", description: "Follows your system preference", preview: { bg: "linear-gradient(135deg, #ffffff 50%, #0a0a0a 50%)", text: "#666" } },
	{ id: "deep-sea", name: "Deep Sea", description: "Rich blues and calming depths", preview: { bg: "#0d1b2a", text: "#f9f9f8", accent: "#778da9", border: "#1b263b" } },
	{ id: "warm-tomes", name: "Warm Tomes", description: "Cozy earth tones and vintage feel", preview: { bg: "#f0efe9", text: "#333d29", accent: "#ba854f", border: "#d3cebc" } },
	{ id: "font-sans", name: "Font: Sans", description: "Coming soon", disabled: true, preview: { bg: "#ffffff", text: "#0a0a0a", border: "#e5e5e5" } },
	{ id: "font-serif", name: "Font: Serif", description: "Coming soon", disabled: true, preview: { bg: "#ffffff", text: "#0a0a0a", border: "#e5e5e5" } },
	{ id: "font-mono", name: "Font: Mono", description: "Coming soon", disabled: true, preview: { bg: "#ffffff", text: "#0a0a0a", border: "#e5e5e5" } },
] as const;

type ThemeKey = typeof THEMES[number]["id"];

type LayoutKey = "sidebar" | "dock";

export function OnboardingDialog() {
	const { theme, setTheme } = useTheme();
	const [open, setOpen] = React.useState(false);
	const [step, setStep] = React.useState(-1); // -1: intro, 0: theme, 1: layout
	const [direction, setDirection] = React.useState(1);
	const [selectedLayout, setSelectedLayout] = React.useState<LayoutKey>(() => {
		if (typeof window === "undefined") return "sidebar";
		return (localStorage.getItem("ui-layout") as LayoutKey) || "sidebar";
	});

	React.useEffect(() => {
		try {
			const done = typeof window !== "undefined" ? localStorage.getItem("onboarding_done") : "true";
			if (done !== "true") {
				const t = setTimeout(() => setOpen(true), 400);
				return () => clearTimeout(t);
			}
		} catch {}
	}, []);

	const goNext = () => { setDirection(1); setStep((s) => Math.min(s + 1, 2)); };
	const goBack = () => { setDirection(-1); setStep((s) => Math.max(s - 1, -1)); };

	const finish = React.useCallback(() => {
		try {
			if (typeof window !== "undefined") {
				localStorage.setItem("ui-layout", selectedLayout);
				localStorage.setItem("onboarding_done", "true");
			}
		} finally {
			setOpen(false);
		}
	}, [selectedLayout]);

	const skipAll = React.useCallback(() => {
		try {
			setTheme("system");
			if (typeof window !== "undefined") {
				localStorage.setItem("ui-layout", "sidebar");
				localStorage.setItem("onboarding_done", "true");
			}
		} finally {
			setOpen(false);
		}
	}, [setTheme]);

	React.useEffect(() => {
		if (step === 2) {
			const timer = setTimeout(() => finish(), 5000);
			return () => clearTimeout(timer);
		}
	}, [step, finish]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="w-full max-w-5xl md:h-[60vh] md:max-h-[70%] p-0 overflow-hidden bg-background border rounded-xl shadow-lg">
				<div className="flex flex-col h-full">
					<div className="flex-1 px-6 py-6 md:px-8 md:py-8">
						<div className="relative min-h-[300px]">
							<AnimatePresence initial={false} custom={direction}>
								{step === -1 && (
									<motion.section
										key="step-intro"
										custom={direction}
										initial="enter"
										animate="center"
										exit="exit"
										variants={slideVariants}
										transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
										className="flex flex-col items-start text-left gap-3 sm:gap-4 max-w-2xl"
									>
										<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
											<span className="inline-block rounded-full bg-primary/10 px-3 py-1 mr-2">Shall we</span>
											customize your UI?
										</h2>
										<p className="text-sm sm:text-base text-muted-foreground">We can tailor the look and layout so everything feels just right.</p>
									</motion.section>
								)}

								{step === 0 && (
									<motion.section
										key="step-theme"
										custom={direction}
										initial="enter"
										animate="center"
										exit="exit"
										variants={slideVariants}
										transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
										className="flex flex-col gap-4"
									>
										<h3 className="text-sm font-medium">Theme</h3>
										<div className="grid grid-cols-2 gap-3 sm:gap-4">
											{THEMES.map((t) => (
												<ThemePreview
													key={t.id}
													theme={t}
													isSelected={!('disabled' in t && t.disabled === true) && theme === t.id}
													onClick={() => { if (!('disabled' in t && t.disabled === true)) setTheme(t.id as ThemeKey); }}
												/>
											))}
										</div>
									</motion.section>
								)}

								{step === 1 && (
									<motion.section
										key="step-layout"
										custom={direction}
										initial="enter"
										animate="center"
										exit="exit"
										variants={slideVariants}
										transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
										className="flex flex-col gap-4"
									>
										<h3 className="text-sm font-medium">Layout</h3>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
											<LayoutCard
												label="Sidebar"
												description="Traditional sidebar navigation"
												isActive={selectedLayout === "sidebar"}
												onClick={() => {
													setSelectedLayout("sidebar");
													if (typeof window !== "undefined") localStorage.setItem("ui-layout", "sidebar");
												}}
											>
												<SidebarMiniature isActive={selectedLayout === "sidebar"} />
											</LayoutCard>
											<LayoutCard
												label="Floating Dock"
												description="Modern floating dock"
												isActive={selectedLayout === "dock"}
												onClick={() => {
													setSelectedLayout("dock");
													if (typeof window !== "undefined") localStorage.setItem("ui-layout", "dock");
												}}
											>
												<DockMiniature isActive={selectedLayout === "dock"} />
											</LayoutCard>
										</div>
									</motion.section>
								)}
								{step === 2 && (
									<motion.section
										key="step-done"
										custom={direction}
										initial="enter"
										animate="center"
										exit="exit"
										variants={slideVariants}
										transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
										className="flex flex-col items-start text-left gap-3 sm:gap-4 max-w-2xl"
									>
										<h2 className="text-2xl sm:text-3xl font-semibold">All set!</h2>
										<p className="text-sm sm:text-base text-muted-foreground">Your theme and layout have been saved. This will close automatically in a few seconds.</p>
									</motion.section>
								)}
							</AnimatePresence>
						</div>
					</div>

					<div className="px-6 py-4 md:px-8 md:py-6 flex justify-end gap-2">
						{step === -1 && (
							<>
								<Button variant="ghost" onClick={skipAll}>Nah, I&apos;m good</Button>
								<Button onClick={goNext}>Let&apos;s go</Button>
							</>
						)}
						{step === 0 && (
							<>
								<Button variant="outline" onClick={goBack}>Back</Button>
								<Button onClick={goNext}>Next</Button>
							</>
						)}
						{step === 1 && (
							<>
								<Button variant="outline" onClick={goBack}>Back</Button>
								<Button onClick={() => { setDirection(1); setStep(2); }}>Finish</Button>
							</>
						)}
						{step === 2 && (
							<>
								<Button variant="outline" onClick={goBack}>Back</Button>
								<Button onClick={finish}>Finish</Button>
							</>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

const slideVariants = {
	enter: (direction: number) => ({ x: direction > 0 ? "100%" : "-100%", opacity: 0, position: "absolute", width: "100%" }),
	center: { x: 0, opacity: 1, position: "relative" },
	exit: (direction: number) => ({ x: direction > 0 ? "-100%" : "100%", opacity: 0, position: "absolute", width: "100%" }),
};

function ThemePreview({ theme, isSelected, onClick }: {
	theme: typeof THEMES[number];
	isSelected: boolean;
	onClick: () => void;
}) {
	const preview = theme.preview as { bg: string; text: string; border?: string; accent?: string; secondary?: string };
	const isDisabled = ('disabled' in theme) && theme.disabled === true;
	return (
		<Card
			className={cn(
				"cursor-pointer transition-all duration-200 hover:shadow-md",
				isSelected ? "ring-2 ring-primary ring-offset-2" : "",
				isDisabled ? "opacity-60 pointer-events-none" : ""
			)}
			onClick={onClick}
		>
			<CardContent className="p-3">
				<div className="space-y-2">
					<div
						className="h-16 rounded-md border-2 overflow-hidden relative"
						style={{ background: preview.bg, borderColor: preview.border ?? "#e5e5e5" }}
					>
						<div
							className="h-5 border-b flex items-center px-2 gap-1"
							style={{ backgroundColor: (preview.accent as string) || (preview.text + "10"), borderColor: preview.border ?? "#e5e5e5" }}
						>
							<div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
							<div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
							<div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
						</div>
						<div className="p-2 space-y-1">
							<div className="h-1.5 rounded w-3/4" style={{ backgroundColor: preview.text + "80" }}></div>
							<div className="h-1.5 rounded w-1/2" style={{ backgroundColor: preview.text + "60" }}></div>
							<div className="flex gap-1 mt-2">
								<div className="h-3 w-6 rounded text-[10px] flex items-center justify-center" style={{ backgroundColor: (preview.accent as string) || preview.text, color: preview.bg as string }}></div>
								{preview.secondary && (
									<div className="h-3 w-6 rounded" style={{ backgroundColor: preview.secondary }}></div>
								)}
							</div>
							{isSelected && (
								<div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full p-0.5">
									<IconCheck className="h-3 w-3" />
								</div>
							)}
						</div>
					</div>
					<div className="space-y-0.5">
						<div className="flex items-center justify-between">
							<h4 className="font-medium text-xs">{theme.name}</h4>
							{isSelected && <span className="text-[10px] px-1 py-0.5 rounded bg-primary/10 text-primary">Active</span>}
							{isDisabled && <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground">Soon</span>}
						</div>
						<p className="text-[11px] text-muted-foreground leading-tight">{theme.description}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function LayoutCard({ label, description, isActive, onClick, children }: {
	label: string;
	description: string;
	isActive: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<Card
			className={cn(
				"cursor-pointer transition-all duration-200 hover:shadow-md",
				isActive ? "ring-2 ring-primary ring-offset-2" : ""
			)}
			onClick={onClick}
		>
			<CardContent className="p-3">
				<div className="space-y-2">
					<div className="h-16 bg-muted rounded border overflow-hidden relative">
						{children}
					</div>
					<div className="space-y-0.5">
						<div className="flex items-center justify-between">
							<h4 className="font-medium text-xs flex items-center gap-2">
								{label === "Sidebar" ? (
									<IconLayoutSidebarLeftExpand className="h-4 w-4" />
								) : (
									<IconLayoutNavbar className="h-4 w-4" />
								)}
								{label}
							</h4>
							{isActive && <span className="text-[10px] px-1 py-0.5 rounded bg-primary/10 text-primary">Active</span>}
						</div>
						<p className="text-[11px] text-muted-foreground leading-tight">{description}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function SidebarMiniature({ isActive }: { isActive: boolean }) {
	return (
		<>
			<div className="absolute left-0 top-0 w-6 h-full bg-primary/20 border-r border-border">
				<div className="p-1 space-y-1 mt-1">
					<div className="h-1 bg-primary/40 rounded w-4 mx-auto"></div>
					<div className="h-1 bg-primary/30 rounded w-3 mx-auto"></div>
					<div className="h-1 bg-primary/30 rounded w-3 mx-auto"></div>
					<div className="h-1 bg-primary/30 rounded w-3 mx-auto"></div>
				</div>
			</div>
			<div className="ml-6 px-2 py-1 border-b border-border/50">
				<div className="h-1.5 bg-foreground/25 rounded w-1/3"></div>
			</div>
			<div className="ml-6 p-2 space-y-1">
				<div className="h-2 bg-foreground/20 rounded w-3/4"></div>
				<div className="h-1.5 bg-foreground/15 rounded w-1/2"></div>
				<div className="h-1.5 bg-foreground/10 rounded w-2/3"></div>
				<div className="flex gap-1 mt-2">
					<div className="h-1 bg-primary/30 rounded w-6"></div>
					<div className="h-1 bg-secondary/50 rounded w-4"></div>
				</div>
			</div>
			{isActive && (
				<div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
					<IconCheck className="h-2 w-2" />
				</div>
			)}
		</>
	);
}

function DockMiniature({ isActive }: { isActive: boolean }) {
	return (
		<>
			<div className="px-2 py-1 border-b border-border/50">
				<div className="h-1.5 bg-foreground/25 rounded w-1/3"></div>
			</div>
			<div className="p-2 space-y-1">
				<div className="h-2 bg-foreground/20 rounded w-3/4"></div>
				<div className="h-1.5 bg-foreground/15 rounded w-1/2"></div>
				<div className="h-1.5 bg-foreground/10 rounded w-2/3"></div>
				<div className="flex gap-1 mt-2">
					<div className="h-1 bg-primary/30 rounded w-6"></div>
					<div className="h-1 bg-secondary/50 rounded w-4"></div>
				</div>
			</div>
			<div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-primary/20 rounded-full px-2 py-1 flex gap-0.5">
				<div className="w-1.5 h-1.5 bg-primary/50 rounded-full"></div>
				<div className="w-1.5 h-1.5 bg-primary/40 rounded-full"></div>
				<div className="w-1.5 h-1.5 bg-primary/40 rounded-full"></div>
				<div className="w-1.5 h-1.5 bg-primary/40 rounded-full"></div>
			</div>
			{isActive && (
				<div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
					<IconCheck className="h-2 w-2" />
				</div>
			)}
		</>
	);
} 