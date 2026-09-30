import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Shimmer({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("chusky-shimmer-text", className)} {...props} />;
}
