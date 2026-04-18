import { Loader2 } from "lucide-react";
import { cn } from "@renderer/lib/cn";

export function Spinner({
  className,
  size = 20,
}: {
  className?: string;
  size?: number;
}) {
  return <Loader2 className={cn("animate-spin", className)} size={size} />;
}
