"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Home, ChevronRight, Monitor, User, Bell, Shield, HelpCircle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Settings categories with navigation
const SETTINGS_CATEGORIES = [
  {
    id: "ui",
    title: "User Interface",
    description: "Customize themes, layout, and visual preferences",
    icon: Monitor,
    href: "/shared/settings/ui",
    badge: null,
  },
  {
    id: "account", 
    title: "Account",
    description: "Manage your profile, password, and account settings",
    icon: User,
    href: "/shared/settings/account",
    badge: null,
  },
  {
    id: "notifications",
    title: "Notifications", 
    description: "Control how and when you receive notifications",
    icon: Bell,
    href: "/shared/settings/notifications",
    badge: null,
  },
  {
    id: "privacy",
    title: "Privacy & Security",
    description: "Manage your privacy settings and security preferences", 
    icon: Shield,
    href: "/shared/settings/privacy",
    badge: null,
  },
  {
    id: "nlp",
    title: "Natural Language Processing",
    description: "Test and configure intelligent date parsing features",
    icon: Calendar,
    href: "/shared/settings/nlp",
    badge: "Preview",
  },
  {
    id: "help",
    title: "Help & Support",
    description: "Get help, view documentation, and contact support",
    icon: HelpCircle,
    href: "/shared/settings/help",
    badge: null,
  },
];

export default function SettingsPage() {
  return (
    <div className="p-6">
      {/* Breadcrumbs */}
      <div className="mb-4">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/shared" className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Settings</span>
        </nav>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your preferences and account settings
        </p>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Settings Categories List */}
        <div className="rounded-2xl bg-muted/30 shadow-sm">
          <div className="divide-y divide-border/60">
            {SETTINGS_CATEGORIES.map((category) => {
                const IconComponent = category.icon;
                
                return (
                <Link key={category.id} href={category.href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-2xl">
                  <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/60 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-2.5 bg-primary/10 rounded-lg">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {category.title}
                            </h3>
                            {category.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {category.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        </div>
                      </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                );
              })}
            </div>
        </div>

      </div>
    </div>
  );
} 