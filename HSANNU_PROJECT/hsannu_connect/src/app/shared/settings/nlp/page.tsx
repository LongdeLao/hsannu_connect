"use client";

import { ChevronRight, Home, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NLPDatePicker } from "@/components/nlp-date-picker";

export default function NLPSettingsPage() {
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
        {/* Date Processing Section */}
        <Card>
          <CardHeader>
            <CardTitle>Date Processing</CardTitle>
            <CardDescription>
              Parse natural language into structured dates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Try typing natural language dates like &quot;tomorrow&quot;, &quot;next Friday&quot;, &quot;in 2 weeks&quot;, or &quot;December 25th&quot;
              </p>
              
              <div className="max-w-md">
                <NLPDatePicker
                  placeholder="Try: tomorrow, next week, in 3 days..."
                  label="Natural Language Date Input"
                  description="Parsed date: {date}"
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium">Examples you can try:</h4>
                <div className="grid gap-2 text-xs text-muted-foreground">
                  <div className="flex gap-4">
                    <span className="font-mono bg-background px-2 py-1 rounded">tomorrow</span>
                    <span className="font-mono bg-background px-2 py-1 rounded">next Friday</span>
                    <span className="font-mono bg-background px-2 py-1 rounded">in 2 weeks</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="font-mono bg-background px-2 py-1 rounded">December 25th</span>
                    <span className="font-mono bg-background px-2 py-1 rounded">end of month</span>
                    <span className="font-mono bg-background px-2 py-1 rounded">3 days ago</span>
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