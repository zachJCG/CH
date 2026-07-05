import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskSource } from "@/lib/demo/types";

const SOURCE_STYLES: Record<TaskSource, { label: string; className: string }> = {
  manual: { label: "Manual", className: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300" },
  hostaway: { label: "Hostaway", className: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
  breezeway: { label: "Breezeway", className: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
  gmail: { label: "Gmail", className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
  maintenance: { label: "Maintenance", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  inspection: { label: "Inspection", className: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
};

export function SourceBadge({
  source,
  className,
}: {
  source: TaskSource;
  className?: string;
}) {
  const style = SOURCE_STYLES[source];
  return (
    <Badge
      variant="secondary"
      className={cn("border-transparent", style.className, className)}
    >
      {style.label}
    </Badge>
  );
}
