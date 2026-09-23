import {
  CircleAlert,
  CircleCheck,
  CircleMinus,
  CircleX,
  Clock,
  LogIn,
  RotateCcw,
} from "lucide-react";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;
type Icon = typeof CircleCheck;

type StatusDefinition = { label: string; variant: BadgeVariant; icon: Icon };

/**
 * The single place domain statuses are turned into a visual treatment.
 *
 * Before this existed, every page re-declared its own STATUS_VARIANT map, so
 * "ACTIVE" could be a filled badge on one screen and an outline on the next,
 * and nothing distinguished "expired" (a problem) from "cancelled" (a
 * decision). Statuses are grouped by `kind` because the same word means
 * different things per domain — an ACTIVE *account* is not an ACTIVE
 * *membership* — and each entry pairs a colour with an icon and a text
 * label so status is never carried by colour alone.
 */
const STATUS: {
  account: Record<"ACTIVE" | "SUSPENDED", StatusDefinition>;
  membership: Record<"ACTIVE" | "PENDING" | "EXPIRED" | "CANCELLED", StatusDefinition>;
  payment: Record<"SUCCEEDED" | "PENDING" | "FAILED" | "REFUNDED", StatusDefinition>;
  plan: Record<"ACTIVE" | "COMPLETED" | "CANCELLED", StatusDefinition>;
  attendance: Record<"CHECKED_IN" | "CHECKED_OUT", StatusDefinition>;
  exercise: Record<"ACTIVE" | "INACTIVE", StatusDefinition>;
} = {
  account: {
    ACTIVE: { label: "Active", variant: "success", icon: CircleCheck },
    SUSPENDED: { label: "Suspended", variant: "destructive", icon: CircleX },
  },
  membership: {
    ACTIVE: { label: "Active", variant: "success", icon: CircleCheck },
    PENDING: { label: "Pending", variant: "warning", icon: Clock },
    EXPIRED: { label: "Expired", variant: "destructive", icon: CircleAlert },
    CANCELLED: { label: "Cancelled", variant: "muted", icon: CircleMinus },
  },
  payment: {
    SUCCEEDED: { label: "Succeeded", variant: "success", icon: CircleCheck },
    PENDING: { label: "Pending", variant: "warning", icon: Clock },
    FAILED: { label: "Failed", variant: "destructive", icon: CircleX },
    REFUNDED: { label: "Refunded", variant: "muted", icon: RotateCcw },
  },
  plan: {
    ACTIVE: { label: "Active", variant: "success", icon: CircleCheck },
    COMPLETED: { label: "Completed", variant: "info", icon: CircleCheck },
    CANCELLED: { label: "Cancelled", variant: "muted", icon: CircleMinus },
  },
  attendance: {
    CHECKED_IN: { label: "Checked in", variant: "success", icon: LogIn },
    CHECKED_OUT: { label: "Checked out", variant: "muted", icon: CircleCheck },
  },
  exercise: {
    ACTIVE: { label: "Active", variant: "success", icon: CircleCheck },
    INACTIVE: { label: "Inactive", variant: "muted", icon: CircleMinus },
  },
};

type StatusProps = {
  [K in keyof typeof STATUS]: {
    kind: K;
    status: keyof (typeof STATUS)[K];
  };
}[keyof typeof STATUS];

export function StatusBadge({
  kind,
  status,
  size = "default",
  className,
}: StatusProps & {
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const group = STATUS[kind] as Record<string, StatusDefinition>;
  const definition = group[status as string];

  if (!definition) {
    return (
      <Badge variant="muted" size={size} className={className}>
        {String(status)}
      </Badge>
    );
  }

  const Icon = definition.icon;

  return (
    <Badge variant={definition.variant} size={size} className={className}>
      <Icon aria-hidden="true" />
      {definition.label}
    </Badge>
  );
}
