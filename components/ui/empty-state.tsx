// github.com/dnlortega
// linkedin.com/in/daniel-op
import * as React from "react";
import { cn } from "../../lib/utils";

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 border border-dashed border-border/60">
        <Icon className="w-6 h-6 text-muted-foreground/40" />
      </div>
      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">{title}</p>
      {description && (
        <p className="text-[11px] text-muted-foreground/40 mt-1 max-w-[240px]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
