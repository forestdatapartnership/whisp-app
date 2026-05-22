import * as React from "react"

import { cn } from "@/lib/utils"
import { controlBase } from "@/components/ui/styles"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        controlBase,
        "flex h-auto min-h-16 w-full border border-border bg-bg px-3 py-2 text-sm placeholder:text-muted-foreground/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
