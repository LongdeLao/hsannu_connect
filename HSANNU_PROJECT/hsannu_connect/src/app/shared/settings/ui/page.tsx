"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { IconLayoutSidebarLeftExpand, IconLayoutNavbar, IconCheck } from "@tabler/icons-react";
import { ChevronRight, Home, Palette, Monitor } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const THEMES = [
  {
    id: "system", 
    name: "System", 
    description: "Follows your system preference",
    preview: { bg: "linear-gradient(135deg, #ffffff 50%, #0a0a0a 50%)", text: "#666" }
  },
  { 
    id: "light", 
    name: "Light", 
    description: "Clean and bright interface",
    preview: { bg: "#ffffff", text: "#0a0a0a", border: "#e5e5e5" }
  },
  {
    id: "dark", 
    name: "Dark", 
    description: "Easy on the eyes in low light",
    preview: { bg: "#0a0a0a", text: "#ffffff", border: "#262626" }
  },
  { 
    id: "deep-sea", 
    name: "Deep Sea", 
    description: "Rich blues and calming depths",
    preview: { bg: "#0d1b2a", text: "#f9f9f8", accent: "#778da9", border: "#1b263b" }
  },
  {
    id: "warm-tomes", 
    name: "Warm Tomes", 
    description: "Cozy earth tones and vintage feel",
    preview: { bg: "#f0efe9", text: "#333d29", accent: "#ba854f", border: "#d3cebc" }
  }
] as const;

const FONTS = [
  { id: "sfpro", name: "SF Pro (Default)", description: "System SF stack" },
  { id: "typewriter", name: "Typewriter", description: "Courier Prime" },
] as const;

type LayoutOption = "sidebar" | "dock";

type ThemeOption = (typeof THEMES)[number]["id"];

type FontOption = (typeof FONTS)[number]["id"];

function ThemePreview({ theme, isSelected, onClick }: { 
  theme: typeof THEMES[number], 
  isSelected: boolean, 
  onClick: () => void 
}) {
  const preview = theme.preview as { bg: string; text: string; border?: string; accent?: string; secondary?: string }
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-0 shadow-none bg-transparent ${
        isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Theme Preview */}
          <div 
            className="h-20 rounded-md overflow-hidden relative bg-muted/30"
            style={{ 
              background: preview.bg
            }}
          >
            {/* Header bar */}
            <div 
              className="h-6 flex items-center px-2 gap-1"
              style={{ 
                backgroundColor: preview.accent || preview.text + '10'
              }}
            >
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
            </div>
            
            {/* Content area */}
            <div className="p-2 space-y-1">
              <div 
                className="h-2 rounded w-3/4"
                style={{ backgroundColor: preview.text + '80' }}
              ></div>
              <div 
                className="h-2 rounded w-1/2"
                style={{ backgroundColor: preview.text + '60' }}
              ></div>
              <div className="flex gap-1 mt-2">
                <div 
                  className="h-4 w-8 rounded text-xs flex items-center justify-center"
                  style={{ 
                    backgroundColor: preview.accent || preview.text,
                    color: '#fff'
                  }}
                ></div>
                {preview.secondary && (
                  <div 
                    className="h-4 w-8 rounded"
                    style={{ backgroundColor: preview.secondary }}
                  ></div>
                )}
              </div>
            </div>

            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                <IconCheck className="h-3 w-3" />
              </div>
            )}
          </div>

          {/* Theme info */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">{theme.name}</h3>
              {isSelected && <Badge variant="default" className="text-xs">Active</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">{theme.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FontPreview({ font, isSelected, onClick }: { 
  font: typeof FONTS[number], 
  isSelected: boolean, 
  onClick: () => void 
}) {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-0 shadow-none bg-transparent ${
        isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="h-16 rounded-md bg-muted/30 grid place-items-center">
            <span className={`${font.id === 'typewriter' ? 'font-mono px-3 py-1' : ''} text-sm`}>Aa Bb Cc</span>
          </div>
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">{font.name}</h3>
            {isSelected && <Badge variant="default" className="text-xs">Active</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">{font.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UISettingsPage() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [layout, setLayout] = React.useState<LayoutOption>(() => (typeof window !== 'undefined' ? ((localStorage.getItem('ui-layout') as LayoutOption) || 'sidebar') : 'sidebar'));
  const [font, setFont] = React.useState<FontOption>(() => (typeof window !== 'undefined' ? ((localStorage.getItem('ui-font') as FontOption) || 'sfpro') : 'sfpro'));
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    localStorage.setItem('ui-layout', layout);
  }, [layout]);

  React.useEffect(() => {
    localStorage.setItem('ui-font', font);
    const classList = document.documentElement.classList;
    classList.remove('font-sans-sfpro', 'font-sans-rounded', 'font-sans-typewriter');
    classList.add(font === 'typewriter' ? 'font-sans-typewriter' : 'font-sans-sfpro');
  }, [font]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveTheme = theme === "system" ? (systemTheme ?? "light") : (theme ?? "light");

  return (
    <div className={`p-6 transition-all duration-300 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      {/* Breadcrumbs */}
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
          <span className="text-foreground font-medium">User Interface</span>
        </nav>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Monitor className="h-6 w-6" />
              User Interface
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Customize your visual experience and interface preferences
            </p>
          </div>
          <Button variant="secondary" asChild>
            <Link href="/shared/settings">
              Back to Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Theme Section */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Theme
            </CardTitle>
            <CardDescription>
              Choose a theme that suits your style and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {THEMES.map((themeOption) => (
                <ThemePreview
                  key={themeOption.id}
                  theme={themeOption}
                  isSelected={theme === themeOption.id}
                  onClick={() => setTheme(themeOption.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Font Section */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Fonts
            </CardTitle>
            <CardDescription>
              Switch the app typography.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FONTS.map((fontOption) => (
                <FontPreview
                  key={fontOption.id}
                  font={fontOption}
                  isSelected={font === fontOption.id}
                  onClick={() => setFont(fontOption.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Layout Section */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconLayoutSidebarLeftExpand className="h-5 w-5" />
              Layout
            </CardTitle>
            <CardDescription>
              Choose your preferred navigation layout
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Sidebar Layout */}
              <Card 
                className={`cursor-pointer transition-all duration-200 hover:shadow-md border-0 shadow-none bg-transparent ${
                  layout === 'sidebar' ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
                onClick={() => setLayout('sidebar')}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Layout Preview */}
                    <div className="h-20 bg-muted rounded overflow-hidden relative">
                      {/* Sidebar */}
                      <div className="absolute left-0 top-0 w-6 h-full bg-primary/20">
                        {/* Sidebar menu items */}
                        <div className="p-1 space-y-1 mt-1">
                          <div className="h-1 bg-primary/40 rounded w-4 mx-auto"></div>
                          <div className="h-1 bg-primary/30 rounded w-3 mx-auto"></div>
                          <div className="h-1 bg-primary/30 rounded w-3 mx-auto"></div>
                          <div className="h-1 bg-primary/30 rounded w-3 mx-auto"></div>
                        </div>
                      </div>
                      {/* Header */}
                      <div className="ml-6 px-2 py-1">
                        <div className="h-1.5 bg-foreground/25 rounded w-1/3"></div>
                      </div>
                      {/* Content */}
                      <div className="ml-6 p-2 space-y-1">
                        <div className="h-2 bg-foreground/20 rounded w-3/4"></div>
                        <div className="h-1.5 bg-foreground/15 rounded w-1/2"></div>
                        <div className="h-1.5 bg-foreground/10 rounded w-2/3"></div>
                        <div className="flex gap-1 mt-2">
                          <div className="h-1 bg-primary/30 rounded w-6"></div>
                          <div className="h-1 bg-secondary/50 rounded w-4"></div>
                        </div>
                      </div>
                      {/* Selection indicator */}
                      {layout === 'sidebar' && (
                        <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
                          <IconCheck className="h-2 w-2" />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm flex items-center gap-2">
                          <IconLayoutSidebarLeftExpand className="h-4 w-4" />
                          Sidebar
                        </h3>
                        {layout === 'sidebar' && <Badge variant="default" className="text-xs">Active</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Traditional sidebar navigation with collapsible menu
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dock Layout */}
              <Card 
                className={`cursor-pointer transition-all duration-200 hover:shadow-md border-0 shadow-none bg-transparent ${
                  layout === 'dock' ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
                onClick={() => setLayout('dock')}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Layout Preview */}
                    <div className="h-20 bg-muted rounded overflow-hidden relative">
                      {/* Header */}
                      <div className="px-2 py-1">
                        <div className="h-1.5 bg-foreground/25 rounded w-1/3"></div>
                      </div>
                      {/* Content */}
                      <div className="p-2 space-y-1">
                        <div className="h-2 bg-foreground/20 rounded w-3/4"></div>
                        <div className="h-1.5 bg-foreground/15 rounded w-1/2"></div>
                        <div className="h-1.5 bg-foreground/10 rounded w-2/3"></div>
                        <div className="flex gap-1 mt-2">
                          <div className="h-1 bg-primary/30 rounded w-6"></div>
                          <div className="h-1 bg-secondary/50 rounded w-4"></div>
                        </div>
                      </div>
                      {/* Dock */}
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-primary/20 rounded-full px-2 py-1 flex gap-0.5">
                        <div className="w-1.5 h-1.5 bg-primary/50 rounded-full"></div>
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full"></div>
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full"></div>
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full"></div>
                      </div>
                      {/* Selection indicator */}
                      {layout === 'dock' && (
                        <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
                          <IconCheck className="h-2 w-2" />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm flex items-center gap-2">
                          <IconLayoutNavbar className="h-4 w-4" />
                          Floating Dock
                        </h3>
                        {layout === 'dock' && <Badge variant="default" className="text-xs">Active</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Modern floating dock with minimal interface
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Your layout preference applies to student pages and is saved in this browser.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 