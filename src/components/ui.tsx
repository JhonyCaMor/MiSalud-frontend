import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TableHTMLAttributes,
} from "react";

type ClassValue = string | false | null | undefined;
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}

const btnVariants: Record<string, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300",
  success: "bg-pharma-600 text-white hover:bg-pharma-700 active:bg-pharma-800 disabled:bg-pharma-300",
  secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 active:bg-slate-100",
  danger: "bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700",
  ghost: "text-slate-600 hover:bg-slate-100 active:bg-slate-200",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof btnVariants;
  size?: "sm" | "md";
  loading?: boolean;
}) {
  const sizes = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-3.5 py-2 text-sm",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60",
        btnVariants[variant],
        sizes[size],
        className,
      )}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200",
        className,
      )}
      {...props}
    />
  );
});

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200",
        className,
      )}
      {...props}
    />
  );
}

export function Card({
  title,
  action,
  children,
  className,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {action}
        </header>
      )}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

const badgeTones: Record<string, string> = {
  slate: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  green: "bg-pharma-100 text-pharma-800 ring-1 ring-inset ring-pharma-200",
  red: "bg-danger-100 text-danger-700 ring-1 ring-inset ring-danger-200",
  amber: "bg-alert-100 text-alert-800 ring-1 ring-inset ring-alert-200",
  blue: "bg-brand-100 text-brand-800 ring-1 ring-inset ring-brand-200",
  violet: "bg-violet-100 text-violet-800 ring-1 ring-inset ring-violet-200",
};

export function Badge({
  tone = "slate",
  children,
  className,
}: {
  tone?: keyof typeof badgeTones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Table({
  head,
  children,
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement> & {
  head: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("min-w-full divide-y divide-slate-200 text-sm", className)} {...props}>
        <thead className="bg-slate-50">
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            {head}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 text-slate-700", className)}>{children}</td>;
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm text-slate-500">
      <svg className="h-5 w-5 animate-spin text-brand-600" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
      </svg>
      {label && <span>{label}</span>}
    </div>
  );
}

export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "danger" | "success" | "warning";
  children: ReactNode;
}) {
  const tones = {
    info: "border-brand-200 bg-brand-50 text-brand-800",
    danger: "border-danger-200 bg-danger-50 text-danger-800",
    success: "border-pharma-200 bg-pharma-50 text-pharma-800",
    warning: "border-alert-200 bg-alert-50 text-alert-800",
  };
  return (
    <div role="alert" className={cn("rounded-lg border px-4 py-3 text-sm", tones[tone])}>{children}</div>
  );
}

export function EmptyState({ children }: { children?: ReactNode }) {
  return (
    <div className="py-10 text-center text-sm text-slate-400">
      {children ?? "No hay datos para mostrar"}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: "brand" | "green" | "red" | "amber";
}) {
  const tones = {
    brand: "text-brand-600",
    green: "text-pharma-600",
    red: "text-danger-500",
    amber: "text-alert-600",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && <span className={cn("text-xl", tones[tone])}>{icon}</span>}
      </div>
      <p className={cn("mt-2 text-2xl font-bold", tones[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function Grid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {children}
    </div>
  );
}

/**
 * Rejilla de 12 columnas para jerarquía de dashboards (KPI ancho + widgets).
 * Uso: <Grid12><div className="col-span-12 lg:col-span-8">…</div></div>
 */
export function Grid12({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 gap-5 lg:grid-cols-12", className)}>{children}</div>;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}