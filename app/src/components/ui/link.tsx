import { Link as IntlLink } from "@/i18n/navigation";
import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "accent" | "muted" | "subtle";

export const linkVariants: Record<Variant, string> = {
  accent: "text-accent-green underline-offset-2 hover:underline",
  muted:  "text-text-dim no-underline hover:text-text-muted",
  subtle: "text-muted-foreground no-underline hover:text-accent-green",
};

type LinkProps = Omit<ComponentProps<typeof IntlLink>, "href"> & {
  href: string;
  variant?: Variant;
  unlocalized?: boolean;
};

export function Link({ variant = "accent", unlocalized = false, className, ...props }: LinkProps) {
  const Component = unlocalized ? "a" : IntlLink;
  return (
    <Component
      className={cn("transition-colors", linkVariants[variant], className)}
      {...props}
    />
  );
}
