import { cn } from "@/lib/utils/cn";

interface StepProgressProps {
  current: number; // 0-indexed
  total: number;
  className?: string;
}

export function StepProgress({ current, total, className }: StepProgressProps) {
  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      aria-label={`Step ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-all duration-300",
            i < current
              ? "bg-primary/40"
              : i === current
                ? "bg-primary"
                : "bg-muted"
          )}
        />
      ))}
    </div>
  );
}
