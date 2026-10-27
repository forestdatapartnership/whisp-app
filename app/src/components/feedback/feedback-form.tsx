"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { submitFeedback } from "@/lib/feedback/actions";
import { FEEDBACK_QUESTIONS, FEEDBACK_TEXT_MAX_LENGTH } from "@/lib/feedback/questions";
import { useSystemMessage } from "@/lib/shared/use-system-message";

const questionClass = "block text-sm font-medium text-text-primary";

export function FeedbackForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Feedback");
  const systemMessage = useSystemMessage();
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
      toast.success(t("thanks"));
      onClose();
      return;
    }
    setError(systemMessage(result.code, result.args));
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-text-muted">{t("description", { count: FEEDBACK_QUESTIONS.length })}</p>
      <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
        {error && <Alert type="error" message={error} onClose={() => setError("")} />}
        {FEEDBACK_QUESTIONS.map(({ name, options }, index) => {
          const question = `${index + 1}. ${t(`questions.${name}.label`)}`;
          return options ? (
            <fieldset key={name}>
              <legend className={questionClass}>{question}</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {options.map((option) => {
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
            </fieldset>
          ) : (
            <div key={name}>
              <label htmlFor={name} className={questionClass}>
                {question}
              </label>
              <p id={`${name}-hint`} className="mt-1 text-xs text-text-muted">
                {t("textHint", { max: FEEDBACK_TEXT_MAX_LENGTH })}
              </p>
              <Textarea
                id={name}
                aria-describedby={`${name}-hint`}
                rows={4}
                maxLength={FEEDBACK_TEXT_MAX_LENGTH}
                value={answers[name] ?? ""}
                onChange={(e) => setAnswer(name, e.target.value)}
                className="mt-3"
              />
            </div>
          );
        })}
        <Button type="submit" className="w-full" disabled={!hasAnswer || isLoading}>
          {isLoading ? t("sending") : t("send")}
        </Button>
      </form>
    </div>
  );
}
