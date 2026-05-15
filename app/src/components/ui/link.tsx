import NextLink from "next/link";
import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "accent" | "muted" | "subtle";

const variants: Record<Variant, string> = {
  accent: "text-accent-green underline-offset-2 hover:underline",
  muted:  "text-text-dim no-underline hover:text-text-muted",
  subtle: "text-muted-foreground no-underline hover:text-accent-green",
};

type LinkProps = ComponentProps<typeof NextLink> & {
  variant?: Variant;
};

export function Link({ variant = "accent", className, ...props }: LinkProps) {
  return (
    <NextLink
      className={cn("transition-colors", variants[variant], className)}
      {...props}
    />
  );
}
