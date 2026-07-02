"use client"

import * as React from "react"
import { Triangle } from "lucide-react"
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"

import { cn } from "@/lib/utils"
import { Button } from "./button"

type ScrollAreaProps = ScrollAreaPrimitive.Root.Props & {
  horizontal?: boolean
}

const H_TRACK = "h-[14px]"
const H_BUTTON = "h-[14px] w-[14px] min-w-[14px]"
const H_INSET = "px-[14px]"
const H_THUMB = "h-3 min-w-[16px]"

const trackClass = "bg-border/40 transition-colors"
const thumbClass =
  "rounded-full bg-text-muted/60 transition-colors hover:bg-text-muted/80"

const arrowButtonClass = cn(
  "absolute bottom-0 z-20 rounded-none p-0 text-muted-foreground",
  H_BUTTON,
  trackClass,
  "hover:bg-border/60"
)

function ScrollArea({
  className,
  children,
  horizontal,
  ...props
}: ScrollAreaProps) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null)

  const scrollByAmount = React.useCallback((direction: "left" | "right") => {
    const el = viewportRef.current
    if (!el) return

    el.scrollBy({
      left: direction === "left" ? -160 : 160,
      behavior: "smooth",
    })
  }, [])

  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", horizontal && "pb-[14px]", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit] outline-none transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ScrollAreaPrimitive.Content>{children}</ScrollAreaPrimitive.Content>
      </ScrollAreaPrimitive.Viewport>

      <ScrollBar />

      {horizontal && (
        <>
          <ScrollBar
            orientation="horizontal"
            className={cn(H_TRACK, H_INSET, "z-20")}
          />

          <ScrollArrow
            direction="left"
            className="left-0 border-r border-border/40"
            onClick={() => scrollByAmount("left")}
          />

          <ScrollArrow
            direction="right"
            className="right-0 border-l border-border/40"
            onClick={() => scrollByAmount("right")}
          />
        </>
      )}

      <ScrollAreaPrimitive.Corner className={cn(trackClass, "z-20")} />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  const isHorizontal = orientation === "horizontal"

  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "flex touch-none select-none p-px transition-colors",
        "data-vertical:h-full data-vertical:w-2.5",
        "data-vertical:border-l data-vertical:border-l-transparent",
        "data-vertical:bg-border/40",
        isHorizontal && [
          "flex-col border-t border-t-transparent",
          H_TRACK,
          trackClass,
        ],
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className={cn(
          "relative",
          thumbClass,
          isHorizontal ? H_THUMB : "flex-1"
        )}
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

type ScrollArrowProps = {
  direction: "left" | "right"
  className?: string
  onClick: () => void
}

function ScrollArrow({
  direction,
  className,
  onClick,
}: ScrollArrowProps) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-label={direction === "left" ? "Scroll left" : "Scroll right"}
      className={cn(arrowButtonClass, className)}
      onClick={onClick}
    >
      <Triangle
        fill="currentColor"
        strokeWidth={0}
        className={cn(
          "size-2",
          direction === "left" ? "-rotate-90" : "rotate-90"
        )}
      />
    </Button>
  )
}

export { ScrollArea, ScrollBar }