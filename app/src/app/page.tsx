import { InfoToast } from "@/components/ui/info-toast";
import { Link } from "@/components/ui/link";
import { DataSubmission } from "@/components/submission/data-submission";
import { CenteredShell } from "@/components/layout/page-section";

export default function Home() {
  return (
    <CenteredShell>
      <div className="w-full max-w-[680px] flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            What is in that plot?
          </h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">
            Upload plot boundaries and get an evidence-based forest risk assessment
            across multiple public datasets — powered by Google Earth Engine.
          </p>
        </div>
        <DataSubmission />
      </div>

      <InfoToast storageKey="whisp-intro-dismissed" title="New here?">
        WHISP ("What is in that plot?") helps you verify supply chain commodities come
        from land free of recent deforestation — a core EUDR requirement. Upload plot
        boundaries and get a risk assessment across{" "}
        <Link href="/docs/reference/result-fields">
          result fields &amp; indicators
        </Link>
        , powered by our{" "}
        <Link
          href="https://github.com/openforis/whisp"
          target="_blank"
          rel="noopener noreferrer"
        >
          open-source library
        </Link>{" "}
        via Google Earth Engine.
      </InfoToast>
    </CenteredShell>
  );
}
