import { Label } from "@/components/ui/label";
import { cn } from "cn";

/**
 * Groups related inputs under a visible heading, as a real `<fieldset>` +
 * `<legend>` so screen readers announce the group name when focus enters it.
 *
 * Long forms (a member's details, a trainer's profile, a payment) read as a
 * few short, named chunks instead of one undifferentiated wall of fields —
 * which matters most on a phone, where the whole form is never on screen at
 * once and the heading is what tells you where you are in it.
 */
export function FormSection({
  title,
  description,
  children,
  columns = 2,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Two columns from `sm` up; `1` for sections whose fields are all wide. */
  columns?: 1 | 2;
  className?: string;
}) {
  return (
    <fieldset
      className={cn(
        "flex min-w-0 flex-col gap-4 border-t border-border pt-5 first-of-type:border-t-0 first-of-type:pt-0",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <legend className="text-sm font-semibold tracking-[-0.005em] text-foreground">
          {title}
        </legend>
        {description ? (
          <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className={cn("grid gap-4", columns === 2 && "sm:grid-cols-2")}>{children}</div>
    </fieldset>
  );
}

/**
 * One labelled input. Every field in the app goes through this so the
 * conventions are identical everywhere: optional fields say "Optional"
 * (required ones don't need a marker — they're the default), and a hint
 * renders with a predictable id, `${htmlFor}-hint`, for the input's
 * `aria-describedby` to point at.
 */
export function Field({
  label,
  htmlFor,
  optional = false,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <Label htmlFor={htmlFor} className="justify-between gap-2">
        <span>{label}</span>
        {optional ? (
          <span className="text-xs font-normal text-muted-foreground">Optional</span>
        ) : null}
      </Label>
      {children}
      {hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The submit row. Separated from the fields by a rule so the primary action
 * is visually distinct from the last input, full-width on phones and
 * right-sized from `sm` up.
 */
export function FormActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:items-center">
      {children}
    </div>
  );
}
