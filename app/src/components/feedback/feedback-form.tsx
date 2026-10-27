"use client";

import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StarRating } from "@/components/ui/star-rating";
import { submitFeedback } from "@/lib/feedback/actions";
import { FEEDBACK_QUESTIONS, FEEDBACK_TEXT_MAX_LENGTH, sortOptions } from "@/lib/feedback/questions";
import { useSystemMessage } from "@/lib/shared/use-system-message";

export const FEEDBACK_PROMPT_KEY = "whisp-feedback-prompt-dismissed";

const questionClass = "block text-sm font-medium text-text-primary";

export function FeedbackForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Feedback");
  const locale = useLocale();
  const systemMessage = useSystemMessage();
  const formId = useId();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const setAnswer = (name: string, value: string) => setAnswers((prev) => ({ ...prev, [name]: value }));
  const hasAnswer = Object.values(answers).some((value) => value.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const result = await submitFeedback(answers);
    if (result.ok) {
      localStorage.setItem(FEEDBACK_PROMPT_KEY, "1");
      toast.success(t("thanks"));
      onClose();
      return;
    }
    setError(systemMessage(result.code, result.args));
    setIsLoading(false);
  };

  return (
    <>
      <ScrollArea className="min-h-0">
        <form id={formId} className="flex flex-col gap-5 p-5" onSubmit={handleSubmit}>
          {error && <Alert type="error" message={error} onClose={() => setError("")} />}
          {FEEDBACK_QUESTIONS.map(({ name, options, stars }, index) => {
            const question = `${index + 1}. ${t(`questions.${name}.label`)}`;
            const hint = t.has(`questions.${name}.hint`) ? t(`questions.${name}.hint`) : null;
            return options ? (
              <fieldset key={name}>
                <legend className={questionClass}>{question}</legend>
                {stars ? (
                  <StarRating
                    className="mt-2"
                    max={options.length}
                    value={Number(answers[name] ?? 0)}
                    onChange={(value) => setAnswer(name, value ? String(value) : "")}
                  />
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {sortOptions(options, (option) => t(`questions.${name}.options.${option}`), locale).map((option) => {
                      const selected = answers[name] === option;
                      return (
                        <Button
                          key={option}
                          type="button"
                          size="sm"
                          variant="outline"
                          aria-pressed={selected}
                          onClick={() => setAnswer(name, selected ? "" : option)}
                        >
                          {t(`questions.${name}.options.${option}`)}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </fieldset>
            ) : (
              <div key={name}>
                <label htmlFor={name} className={questionClass}>
                  {question}
                </label>
                {hint && (
                  <p id={`${name}-hint`} className="mt-1 text-xs text-text-muted">
                    {hint}
                  </p>
                )}
                <Textarea
                  id={name}
                  aria-describedby={hint ? `${name}-hint` : undefined}
                  rows={1}
                  maxLength={FEEDBACK_TEXT_MAX_LENGTH}
                  value={answers[name] ?? ""}
                  onChange={(e) => setAnswer(name, e.target.value)}
                  className="mt-2 min-h-9.5 resize-y scrollbar-thin"
                />
              </div>
            );
          })}
        </form>
      </ScrollArea>
      <footer className="flex items-center justify-between gap-4 border-t border-border px-5 py-3">
        <p className="text-xs text-text-muted">{t("textHint")}</p>
        <Button type="submit" form={formId} className="shrink-0" disabled={!hasAnswer || isLoading}>
          {isLoading ? t("sending") : t("send")}
        </Button>
      </footer>
    </>
  );
}
