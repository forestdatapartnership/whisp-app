import { computeRiskMix, isTruthyCell, type RiskValue } from "./catalog-fields";

export type CommodityKey = "pcrop" | "acrop" | "timber";
export type TreeOutcome = RiskValue | "continue";

export const COMMODITY_OPTIONS: Array<{
  key: CommodityKey;
  riskField: string;
  label: string;
  shortLabel: string;
  indicators: string[];
}> = [
  {
    key: "pcrop",
    riskField: "risk_pcrop",
    label: "Perennial crop",
    shortLabel: "Perennial",
    indicators: [
      "Ind_01_treecover",
      "Ind_02_commodities",
      "Ind_03_disturbance_before_2020",
      "Ind_04_disturbance_after_2020",
    ],
  },
  {
    key: "acrop",
    riskField: "risk_acrop",
    label: "Annual crop",
    shortLabel: "Annual",
    indicators: ["Ind_01_treecover", "Ind_02_commodities", "Ind_04_disturbance_after_2020"],
  },
  {
    key: "timber",
    riskField: "risk_timber",
    label: "Timber",
    shortLabel: "Timber",
    indicators: [
      "Ind_02_commodities",
      "Ind_05_primary_2020",
      "Ind_06_nat_reg_forest_2020",
      "Ind_07_planted_plantations_2020",
      "Ind_08_planted_plantations_after_2020",
      "Ind_09_treecover_after_2020",
      "Ind_10_agri_after_2020",
      "Ind_11_logging_concession_before_2020",
    ],
  },
];

type Node = {
  question: string;
  test: (row: Record<string, unknown>) => boolean;
  yes: TreeOutcome;
  no: TreeOutcome;
};

const yn = (field: string) => (row: Record<string, unknown>) => isTruthyCell(row[field]);
const and =
  (...ts: Array<(r: Record<string, unknown>) => boolean>) =>
  (r: Record<string, unknown>) =>
    ts.every((t) => t(r));
const or =
  (...ts: Array<(r: Record<string, unknown>) => boolean>) =>
  (r: Record<string, unknown>) =>
    ts.some((t) => t(r));

const TREES: Record<CommodityKey, Node[]> = {
  pcrop: [
    { question: "Tree cover in 2020?", test: yn("Ind_01_treecover"), yes: "continue", no: "low" },
    { question: "Commodity present pre-2020?", test: yn("Ind_02_commodities"), yes: "low", no: "continue" },
    { question: "Disturbance before 2020?", test: yn("Ind_03_disturbance_before_2020"), yes: "low", no: "continue" },
    { question: "Disturbance after 2020?", test: yn("Ind_04_disturbance_after_2020"), yes: "high", no: "more_info_needed" },
  ],
  acrop: [
    { question: "Tree cover in 2020?", test: yn("Ind_01_treecover"), yes: "continue", no: "low" },
    { question: "Commodity present pre-2020?", test: yn("Ind_02_commodities"), yes: "low", no: "continue" },
    { question: "Disturbance after 2020?", test: yn("Ind_04_disturbance_after_2020"), yes: "high", no: "more_info_needed" },
  ],
  timber: [
    { question: "Commodity present pre-2020?", test: yn("Ind_02_commodities"), yes: "low", no: "continue" },
    {
      question: "Plantation in 2020 and no agriculture after 2020?",
      test: and(yn("Ind_07_planted_plantations_2020"), (r) => !isTruthyCell(r.Ind_10_agri_after_2020)),
      yes: "low",
      no: "continue",
    },
    {
      question: "Forest in 2020 and agriculture after 2020?",
      test: and(
        or(yn("Ind_05_primary_2020"), yn("Ind_06_nat_reg_forest_2020"), yn("Ind_07_planted_plantations_2020")),
        yn("Ind_10_agri_after_2020")
      ),
      yes: "high",
      no: "continue",
    },
    {
      question: "Natural forest in 2020 and plantation after 2020?",
      test: and(
        or(yn("Ind_05_primary_2020"), yn("Ind_06_nat_reg_forest_2020")),
        yn("Ind_08_planted_plantations_after_2020")
      ),
      yes: "high",
      no: "continue",
    },
    {
      question: "Natural forest with post-2020 tree cover or logging concession?",
      test: and(
        or(yn("Ind_05_primary_2020"), yn("Ind_06_nat_reg_forest_2020")),
        or(yn("Ind_09_treecover_after_2020"), yn("Ind_11_logging_concession_before_2020"))
      ),
      yes: "low",
      no: "continue",
    },
    {
      question: "Primary or naturally regenerating forest in 2020?",
      test: or(yn("Ind_05_primary_2020"), yn("Ind_06_nat_reg_forest_2020")),
      yes: "more_info_needed",
      no: "low",
    },
  ],
};

export interface TreeStepView {
  question: string;
  yesCount: number;
  noCount: number;
  yesOutcome: TreeOutcome;
  noOutcome: TreeOutcome;
  selectedSide: "yes" | "no" | null;
  disabled: boolean;
}

export function stepBranches(step: TreeStepView) {
  const yes = {
    side: "yes" as const,
    outcome: step.yesOutcome,
    count: step.yesCount,
    selected: step.selectedSide === "yes",
  };
  const no = {
    side: "no" as const,
    outcome: step.noOutcome,
    count: step.noCount,
    selected: step.selectedSide === "no",
  };
  if (step.yesOutcome === "continue") return { down: yes, right: no };
  if (step.noOutcome === "continue") return { down: no, right: yes };
  return { down: yes, right: no };
}

export function buildTreeSteps(
  commodity: CommodityKey,
  rows: Array<Record<string, unknown>>,
  selectedRow?: Record<string, unknown> | null
): TreeStepView[] {
  let remaining = rows;
  let selectedActive = Boolean(selectedRow);
  const selectedId = String(selectedRow?.plotId ?? "");
  const steps: TreeStepView[] = [];

  for (const node of TREES[commodity]) {
    const yesRows = remaining.filter((r) => node.test(r));
    const noRows = remaining.filter((r) => !node.test(r));
    let selectedSide: "yes" | "no" | null = null;

    if (selectedActive && selectedRow) {
      if (remaining.some((r) => String(r.plotId ?? "") === selectedId)) {
        selectedSide = node.test(selectedRow) ? "yes" : "no";
        if ((selectedSide === "yes" ? node.yes : node.no) !== "continue") selectedActive = false;
      } else {
        selectedActive = false;
      }
    }

    steps.push({
      question: node.question,
      yesCount: yesRows.length,
      noCount: noRows.length,
      yesOutcome: node.yes,
      noOutcome: node.no,
      selectedSide,
      disabled: Boolean(selectedRow) && selectedSide === null,
    });

    if (node.yes === "continue") remaining = yesRows;
    else if (node.no === "continue") remaining = noRows;
    else remaining = [];
  }

  return steps;
}

export function countryRiskBreakdown(
  rows: Array<Record<string, unknown>>,
  riskField: string
) {
  const map = new Map<string, Array<Record<string, unknown>>>();
  for (const row of rows) {
    const country = String(row.Country ?? "").trim() || "Unknown";
    const list = map.get(country);
    if (list) list.push(row);
    else map.set(country, [row]);
  }
  return [...map.entries()]
    .map(([country, rs]) => {
      const mix = computeRiskMix(rs, riskField);
      return { country, count: mix.total, low: mix.low, medium: mix.medium, high: mix.high };
    })
    .sort((a, b) => b.count - a.count);
}
