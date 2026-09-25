"use client";

import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPathname, usePathname } from "@/i18n/navigation";
import { localeLabels, locales, type Locale } from "@/i18n/locales";

const languageCode = (locale: string) => locale.split("-")[0];

export function LocaleOptions() {
  const locale = useLocale();
  const pathname = usePathname();

  const switchTo = (nextLocale: Locale) => {
    if (nextLocale === locale) return;
    // Full navigation avoids remounting the [locale] root layout; the forced prefix (also /en)
    // makes the proxy set the locale cookie before redirecting back to the prefix-free URL.
    const href = getPathname({ href: pathname, locale: nextLocale, forcePrefix: true });
    window.location.replace(href + window.location.search + window.location.hash);
  };

  return (
    <DropdownMenuRadioGroup value={locale}>
      {locales.map((code) => (
        <DropdownMenuRadioItem
          key={code}
          value={code}
          closeOnClick
          onClick={() => switchTo(code)}
          className="cursor-pointer gap-2 py-2 pl-4 pr-10 text-sm text-text-muted focus:bg-surface-raised focus:text-text-primary"
        >
          <span className="w-5 shrink-0 text-left text-xs font-semibold uppercase text-text-dim">
            {languageCode(code)}
          </span>
          <span lang={code}>{localeLabels[code]}</span>
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );
}

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("LanguageSwitcher");

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={<DropdownMenuTrigger render={<Button variant="ghost" aria-label={t("label")} />} />}
        >
          <Globe className="size-4" aria-hidden />
          {languageCode(locale).toUpperCase()}
          <ChevronDown className="size-3" aria-hidden />
        </TooltipTrigger>
        <TooltipContent side="bottom">{t("label")}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-auto border-border bg-surface"
      >
        <LocaleOptions />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
