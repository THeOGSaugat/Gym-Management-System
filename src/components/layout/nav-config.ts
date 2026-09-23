import {
  Bell,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  Dumbbell,
  House,
  LayoutDashboard,
  ScrollText,
  Tags,
  TrendingUp,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/generated/prisma/client";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Short label for the mobile tab bar, where horizontal space is tight. */
  shortLabel?: string;
};

export type NavGroup = {
  /** Omitted for the first group, which needs no heading. */
  label?: string;
  items: NavItem[];
};

export type RoleNav = {
  /** Where the logo and "go home" affordances point. */
  home: string;
  notificationsHref: string;
  /** The full navigation, grouped — used by the desktop sidebar and the mobile drawer. */
  groups: NavGroup[];
  /**
   * The mobile bottom tab bar. Empty for ADMIN, who has too many sections to
   * flatten into five tabs and gets a drawer instead.
   */
  tabs: NavItem[];
};

/**
 * Navigation is defined per role rather than shared, because each role has a
 * genuinely different mental model:
 *
 * - ADMIN runs departments (people / finance / operations), so the grouping
 *   carries meaning and there are more destinations than a tab bar can hold.
 * - TRAINER thinks in "my members and my programmes", a small, flat set.
 * - MEMBER thinks in daily tasks ("am I checked in, what am I lifting
 *   today"), which is exactly what a bottom tab bar is for.
 *
 * Every href here already exists as a route; this file only decides how they
 * are grouped and labelled.
 */
export const NAV_BY_ROLE: Record<Role, RoleNav> = {
  ADMIN: {
    home: "/admin/dashboard",
    notificationsHref: "/admin/notifications",
    tabs: [],
    groups: [
      {
        items: [
          { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
          { label: "Notifications", href: "/admin/notifications", icon: Bell },
        ],
      },
      {
        label: "People",
        items: [
          { label: "Members", href: "/admin/members", icon: Users },
          { label: "Trainers", href: "/admin/trainers", icon: UserRound },
        ],
      },
      {
        label: "Finance",
        items: [
          { label: "Membership plans", href: "/admin/plans", icon: Tags },
          { label: "Payments", href: "/admin/payments", icon: CreditCard },
        ],
      },
      {
        label: "Operations",
        items: [
          { label: "Attendance", href: "/admin/attendance", icon: CalendarCheck },
          { label: "Exercise library", href: "/admin/exercises", icon: Dumbbell },
        ],
      },
    ],
  },

  TRAINER: {
    home: "/trainer/dashboard",
    notificationsHref: "/trainer/notifications",
    tabs: [
      { label: "Dashboard", href: "/trainer/dashboard", icon: LayoutDashboard, shortLabel: "Home" },
      { label: "My members", href: "/trainer/members", icon: Users, shortLabel: "Members" },
      { label: "Workout plans", href: "/trainer/workout-plans", icon: ClipboardList, shortLabel: "Workouts" },
      { label: "Exercises", href: "/trainer/exercises", icon: Dumbbell, shortLabel: "Exercises" },
    ],
    groups: [
      {
        items: [
          { label: "Dashboard", href: "/trainer/dashboard", icon: LayoutDashboard },
          { label: "Notifications", href: "/trainer/notifications", icon: Bell },
        ],
      },
      {
        label: "Coaching",
        items: [
          { label: "My members", href: "/trainer/members", icon: Users },
          { label: "Workout plans", href: "/trainer/workout-plans", icon: ClipboardList },
          { label: "Exercise library", href: "/trainer/exercises", icon: Dumbbell },
        ],
      },
    ],
  },

  MEMBER: {
    home: "/member/dashboard",
    notificationsHref: "/member/notifications",
    tabs: [
      { label: "Home", href: "/member/dashboard", icon: House },
      { label: "Workout", href: "/member/workout-plans", icon: Dumbbell },
      { label: "Progress", href: "/member/progress", icon: TrendingUp },
      { label: "Attendance", href: "/member/attendance", icon: CalendarCheck, shortLabel: "Check in" },
      { label: "Profile", href: "/member/profile", icon: UserRound },
    ],
    groups: [
      {
        items: [
          { label: "Home", href: "/member/dashboard", icon: House },
          { label: "Notifications", href: "/member/notifications", icon: Bell },
        ],
      },
      {
        label: "Training",
        items: [
          { label: "Workout plans", href: "/member/workout-plans", icon: Dumbbell },
          { label: "Progress", href: "/member/progress", icon: TrendingUp },
          { label: "Attendance", href: "/member/attendance", icon: CalendarCheck },
        ],
      },
      {
        label: "Account",
        items: [
          { label: "My membership", href: "/member/membership", icon: ScrollText },
          { label: "Payments", href: "/member/payments", icon: CreditCard },
          { label: "Profile", href: "/member/profile", icon: UserRound },
        ],
      },
    ],
  },
};

/**
 * Whether a nav item should render as the current page. A section's landing
 * page also owns its detail pages (`/admin/members` stays highlighted on
 * `/admin/members/abc`), which is what keeps "where am I" answerable from
 * anywhere in the app — but only the exact dashboard route highlights
 * "Dashboard", so it doesn't claim every page under the role prefix.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  TRAINER: "Trainer",
  MEMBER: "Member",
};
