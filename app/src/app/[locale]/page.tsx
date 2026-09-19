import { useTranslations } from "next-intl";
import { InfoToast } from "@/components/ui/info-toast";
import { Link } from "@/components/ui/link";
import { DataSubmission } from "@/components/submission/data-submission";
import { PublicStats } from "@/components/landing/public-stats";
import { CenteredShell } from "@/components/layout/page-section";
import { cardLayout } from "@/components/ui/styles";

export default function Home() {
  const t = useTranslations("Home");
  return (
    <CenteredShell>
      <div className={`${cardLayout.lg} flex flex-col gap-6`}>
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{t("title")}</h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">{t("subtitle")}</p>
        </div>
        <DataSubmission />
        <PublicStats />
      </div>

      <InfoToast storageKey="whisp-intro-dismissed" title={t("introTitle")}>
        {t.rich("intro", {
          layers: (chunks) => (
            <Link href="https://github.com/forestdatapartnership/whisp/blob/main/layers_description.md" target="_blank" rel="noopener noreferrer">
              {chunks}
            </Link>
          ),
          library: (chunks) => (
            <Link href="https://github.com/forestdatapartnership/whisp" target="_blank" rel="noopener noreferrer">
              {chunks}
            </Link>
          ),
        })}
      </InfoToast>
    </CenteredShell>
  );
}
