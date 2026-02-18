"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

type CheckboxComponentProps = Omit<
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
  "checked"
> & {
  checked?: boolean | "indeterminate";
  triState?: boolean;
};

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxComponentProps
>(({ className, checked, triState = false, ...props }, ref) => {
  const resolvedChecked = triState
    ? checked
    : checked === true
      ? true
      : false;

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={resolvedChecked}
      className={cn(
        "grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-gray-600 shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 data-[state=checked]:text-white data-[state=indeterminate]:bg-gray-600 data-[state=indeterminate]:border-gray-500 data-[state=indeterminate]:text-gray-300",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="grid place-content-center text-current">
        {resolvedChecked === "indeterminate" ? (
          <Minus className="h-3 w-3" />
        ) : (
          <Check className="h-3 w-3" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };
