import { forwardRef } from "react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";

function cx(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const sizes = {
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };
    const variants = {
      primary: "bg-accent-600 text-white hover:bg-accent-700 shadow-sm",
      secondary:
        "bg-white text-ink border border-slate-200 hover:bg-slate-50 shadow-sm",
      ghost: "text-ink-soft hover:bg-slate-100",
    };
    return (
      <button
        ref={ref}
        className={cx(base, sizes[size], variants[variant], className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl bg-white p-6 shadow-card border border-slate-100",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field wrapper
// ---------------------------------------------------------------------------
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {hint && <span className="mb-1.5 block text-xs text-ink-muted">{hint}</span>}
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cx(
      "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

// ---------------------------------------------------------------------------
// Textarea
// ---------------------------------------------------------------------------
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cx(
      "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-xs leading-relaxed text-ink focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------
export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cx(
      "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

// ---------------------------------------------------------------------------
// OptionCards — big tappable choices (mobile-first radio group)
// ---------------------------------------------------------------------------
export function OptionCards<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: { value: T; label: string; description?: string }[];
  value: T | null;
  onChange: (value: T) => void;
  columns?: 1 | 2;
}) {
  return (
    <div
      className={cx(
        "grid gap-3",
        columns === 2 ? "sm:grid-cols-2" : "grid-cols-1",
      )}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cx(
              "rounded-xl border p-4 text-left transition-all",
              selected
                ? "border-accent-500 bg-accent-50 ring-2 ring-accent-100"
                : "border-slate-200 bg-white hover:border-slate-300",
            )}
          >
            <span className="block font-medium text-ink">{opt.label}</span>
            {opt.description && (
              <span className="mt-0.5 block text-xs text-ink-muted">
                {opt.description}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
