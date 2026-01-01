"use client";

import { ChevronRight, Home, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NLPDatePicker } from "@/components/nlp-date-picker";
import { UnifiedDatePicker, type UnifiedDateTimeValue } from "@/components/unified-date-picker";
import { getDateInputMode, setDateInputMode, type DateInputMode } from "@/lib/preferences";
import React from "react";

export default function NLPSettingsPage() {
  const [currentMode, setCurrentMode] = React.useState<DateInputMode>("default");
  const [classicDemo, setClassicDemo] = React.useState<UnifiedDateTimeValue>({});

  React.useEffect(() => {
    setCurrentMode(getDateInputMode());
  }, []);

  const handleSetMode = (mode: DateInputMode) => {
    setDateInputMode(mode);
    setCurrentMode(mode);
  };

  return (
    <div className="p-6">
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
          <span className="text-foreground font-medium">Natural Language Processing</span>
        </nav>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Natural Language Processing
              <Badge variant="secondary" className="ml-2">Preview</Badge>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Test and configure intelligent date parsing capabilities
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/shared/settings">
              Back to Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Onboarding: Choose default & try it out */}
        <Card>
          <CardHeader>
            <CardTitle>Choose your default date input</CardTitle>
            <CardDescription>Try both options below, then set your default. You can change this anytime.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Classic picker</h3>
                  {currentMode === "default" && <Badge variant="secondary">Current</Badge>}
                </div>
                <div className="space-y-2">
                  <UnifiedDatePicker
                    mode="default"
                    label="Try the classic picker"
                    value={classicDemo}
                    onChange={setClassicDemo}
                    description={classicDemo.date ? `Selected: ${classicDemo.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}${classicDemo.time ? ` ${classicDemo.time}` : ''}` : "Pick a date (and optional time)"}
                  />
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant={currentMode === "default" ? "default" : "outline"} onClick={() => handleSetMode("default")}>Use Classic as default</Button>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Natural Language (NLP)</h3>
                  {currentMode === "nlp" && <Badge variant="secondary">Current</Badge>}
                </div>
                <div className="space-y-2">
                  <NLPDatePicker
                    placeholder="Try: tomorrow, next Friday, in 3 days..."
                    label="Try NLP date input"
                    description="Parsed date: {date}"
                  />
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant={currentMode === "nlp" ? "default" : "outline"} onClick={() => handleSetMode("nlp")}>Use NLP as default</Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>
              Configure advanced natural language processing options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Time Zone Detection</label>
                  <p className="text-xs text-muted-foreground">Automatically detect your timezone for date parsing</p>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Language Preference</label>
                  <p className="text-xs text-muted-foreground">Choose your preferred language for date parsing</p>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Smart Suggestions</label>
                  <p className="text-xs text-muted-foreground">Get intelligent date suggestions as you type</p>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 