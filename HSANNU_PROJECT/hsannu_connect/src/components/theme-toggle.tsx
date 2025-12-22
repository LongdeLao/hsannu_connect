"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { IconMoon, IconSun } from "@tabler/icons-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const THEMES = ["system", "light", "dark", "deep-sea", "warm-tomes"] as const;

type ThemeOption = (typeof THEMES)[number];

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const effectiveTheme = theme === "system" ? (systemTheme ?? "light") : (theme ?? "light");
  const isDark = effectiveTheme === "dark" || effectiveTheme === "deep-sea";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton tooltip="Theme">
              {isDark ? <IconSun /> : <IconMoon />}
              <span>Theme</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" sideOffset={4} className="min-w-48">
            <DropdownMenuRadioGroup
              value={(theme as ThemeOption) ?? "system"}
              onValueChange={(val) => setTheme(val as ThemeOption)}
            >
              {THEMES.map((t) => (
                <DropdownMenuRadioItem key={t} value={t} className="capitalize">
                  {t}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
} 