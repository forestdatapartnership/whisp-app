import shell from "./report-assets/shell.json";
import policy from "./report-assets/policy.json";
import { locales, type Locale } from "@/i18n/locales";

export function renderOfflineReportHtml(
  reportJson: string,
  theme: "light" | "dark",
  language: string = "en"
): string {
  return shell.join("\n").split("__WHISP_THEME__")
    .join(theme)
    .split("__WHISP_LANG__")
    .join(locales.includes(language as Locale) ? language : "en")
    .split("__WHISP_CSP__")
    .join(policy)
    .split("__WHISP_DATA__")
    .join(reportJson.replace(/</g, "\\u003c"));
}
