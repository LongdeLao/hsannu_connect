"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { IconLayoutNavbar, IconLayoutSidebarLeftExpand, IconCheck } from "@tabler/icons-react";

// Theme options mirror the UI settings page miniatures
const THEMES = [
  {
    id: "system",
    name: "System",
    description: "Follows your system preference",
    preview: { bg: "linear-gradient(135deg, #ffffff 50%, #0a0a0a 50%)", text: "#666" },
  },
  {
    id: "light",
    name: "Light",
    description: "Clean and bright interface",
    preview: { bg: "#ffffff", text: "#0a0a0a", border: "#e5e5e5" },
  },
  {
    id: "dark",
    name: "Dark",
    description: "Easy on the eyes in low light",
    preview: { bg: "#0a0a0a", text: "#ffffff", border: "#262626" },
  },
  {
    id: "deep-sea",
    name: "Deep Sea",
    description: "Rich blues and calming depths",
    preview: { bg: "#0d1b2a", text: "#f9f9f8", accent: "#778da9", border: "#1b263b" },
  },
  {
    id: "warm-tomes",
    name: "Warm Tomes",
    description: "Cozy earth tones and vintage feel",
    preview: { bg: "#f0efe9", text: "#333d29", accent: "#ba854f", border: "#d3cebc" },
  },
] as const;

type ThemeKey = typeof THEMES[number]["id"];

type LayoutKey = "sidebar" | "dock";

export default function OnboardingPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [step, setStep] = React.useState(0); // 0: theme, 1: layout
  const [direction, setDirection] = React.useState(1);
  const [selectedLayout, setSelectedLayout] = React.useState<LayoutKey>(() => {
    if (typeof window === "undefined") return "sidebar";
    return (localStorage.getItem("ui-layout") as LayoutKey) || "sidebar";
  });

  const stepsTotal = 2;
  const stepsLeft = stepsTotal - step - 1;

  const handleNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, stepsTotal - 1));
  };

  const handleBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const finish = React.useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("ui-layout", selectedLayout);
      }
    } finally {
      router.push("/shared/dashboard");
    }
  }, [router, selectedLayout]);

  const skipAll = () => {
    try {
      setTheme("system");
      if (typeof window !== "undefined") {
        localStorage.setItem("ui-layout", "sidebar");
      }
    } finally {
      router.push("/shared/dashboard");
    }
  };

  return (
    <div className="min-h-dvh w-full grid grid-rows-[1fr_auto] gap-6 p-6 sm:p-10">
      <div className="mx-auto w-full max-w-5xl flex flex-col gap-10">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Welcome</h1>
          <p className="text-muted-foreground text-base">Let&apos;s make it yours. Choose your look and workspace layout.</p>
        </div>

        <div className="relative overflow-y-hidden overflow-x-visible min-h-[380px]">
          <AnimatePresence initial={false} custom={direction}>
            {step === 0 && (
              <motion.section
                key="step-theme"
                custom={direction}
                initial="enter"
                animate="center"
                exit="exit"
                variants={slideVariants}
                transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                className="flex flex-col gap-6"
              >
                <h2 className="text-xl font-medium">Theme</h2>
                <div className="grid px-1 sm:px-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {THEMES.map((t) => (
                    <ThemePreview
                      key={t.id}
                      theme={t}
                      isSelected={theme === t.id}
                      onClick={() => setTheme(t.id as ThemeKey)}
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
                className="flex flex-col gap-6"
              >
                <h2 className="text-xl font-medium">Layout</h2>
                <div className="grid px-1 sm:px-2 grid-cols-1 sm:grid-cols-2 gap-6">
                  <LayoutCard
                    label="Sidebar"
                    description="Traditional sidebar navigation with collapsible menu"
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
                    description="Modern floating dock with minimal interface"
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
          </AnimatePresence>
        </div>
      </div>

      <footer className="sticky bottom-0 w-full">
        <div className="mx-auto max-w-5xl border-t bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <StepDots current={step} total={stepsTotal} />
              <span className="text-sm text-muted-foreground">{stepsLeft} step{stepsLeft === 1 ? "" : "s"} left</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={skipAll}>Skip</Button>
              {step > 0 && (
                <Button variant="outline" onClick={handleBack}>Back</Button>
              )}
              {step < stepsTotal - 1 ? (
                <Button onClick={handleNext}>Next</Button>
              ) : (
                <Button onClick={finish}>Finish</Button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? "100%" : "-100%", opacity: 0, position: "absolute", width: "100%" }),
  center: { x: 0, opacity: 1, position: "relative" },
  exit: (direction: number) => ({ x: direction > 0 ? "-100%" : "100%", opacity: 0, position: "absolute", width: "100%" }),
};

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-6 rounded-full transition-colors",
            i === current ? "bg-primary" : "bg-muted"
          )}
        />
      ))}
    </div>
  );
}

function ThemePreview({ theme, isSelected, onClick }: {
  theme: typeof THEMES[number];
  isSelected: boolean;
  onClick: () => void;
}) {
  const preview = theme.preview as { bg: string; text: string; border?: string; accent?: string; secondary?: string };
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg",
        isSelected ? "ring-2 ring-primary ring-offset-2" : ""
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div
            className="h-20 rounded-md border-2 overflow-hidden relative"
            style={{ background: preview.bg, borderColor: preview.border ?? "#e5e5e5" }}
          >
            <div
              className="h-6 border-b flex items-center px-2 gap-1"
              style={{ backgroundColor: (preview.accent as string) || preview.text + "10", borderColor: preview.border ?? "#e5e5e5" }}
            >
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
            </div>
            <div className="p-2 space-y-1">
              <div className="h-2 rounded w-3/4" style={{ backgroundColor: preview.text + "80" }}></div>
              <div className="h-2 rounded w-1/2" style={{ backgroundColor: preview.text + "60" }}></div>
              <div className="flex gap-1 mt-2">
                <div
                  className="h-4 w-8 rounded text-xs flex items-center justify-center"
                  style={{ backgroundColor: (preview.accent as string) || preview.text, color: preview.bg as string }}
                ></div>
                {preview.secondary && (
                  <div className="h-4 w-8 rounded" style={{ backgroundColor: preview.secondary }}></div>
                )}
              </div>
            </div>
            {isSelected && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                <IconCheck className="h-3 w-3" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">{theme.name}</h3>
              {isSelected && <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">Active</span>}
            </div>
            <p className="text-xs text-muted-foreground">{theme.description}</p>
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
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="h-20 bg-muted rounded border overflow-hidden relative">
            {children}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm flex items-center gap-2">
                {label === "Sidebar" ? (
                  <IconLayoutSidebarLeftExpand className="h-4 w-4" />
                ) : (
                  <IconLayoutNavbar className="h-4 w-4" />
                )}
                {label}
              </h3>
              {isActive && <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">Active</span>}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
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