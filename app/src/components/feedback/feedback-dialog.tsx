"use client";

import { useTranslations } from "next-intl";
import { Dialog } from "@base-ui/react/dialog";
import { CloseButton } from "@/components/ui/button";
import { cardBase, cardLayout, controlSize } from "@/components/ui/styles";
import { FeedbackForm } from "./feedback-form";

export function FeedbackDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("Feedback");

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[300] bg-bg/70" />
        <Dialog.Viewport className="fixed inset-0 z-[301] flex items-center justify-center p-2 sm:p-4">
          <Dialog.Popup
            className={`${cardBase} ${cardLayout.lg} grid max-h-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden shadow-xl`}
          >
            <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
              <Dialog.Title className="text-sm font-semibold text-text-primary">{t("title")}</Dialog.Title>
              <CloseButton type="button" className={controlSize.md} onClick={onClose} />
            </header>
            <FeedbackForm onClose={onClose} />
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
