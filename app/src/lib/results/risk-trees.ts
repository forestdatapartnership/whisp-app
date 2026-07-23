import {
  isTruthyCell,
  riskValueLabel,
  type RiskFilter,
  type RiskTone,
  type RiskValue,
} from "./catalog-fields";

export type CommodityKey = "pcrop" | "acrop" | "timber";
export type TreeOutcome = RiskValue | "continue";

export const WATERBODY_FIELD = "In_waterbody";
export const WATERBODY_LABEL = "In waterbody";

export type IndicatorDef = {
  key: string;
  label: string;
  yesTone: RiskTone | null;
};

export const COMMODITY_OPTIONS: Array<{
  key: CommodityKey;
  riskField: string;
  label: string;
  shortLabel: string;
  indicators: IndicatorDef[];
}> = [
  {
    key: "pcrop",
    riskField: "risk_pcrop",
    label: "Perennial crop",
    shortLabel: "Perennial",
    indicators: [
      { key: "Ind_01_treecover", label: "Tree cover in 2020", yesTone: null },
      { key: "Ind_02_commodities", label: "Commodity present pre-2020", yesTone: "low" },
      { key: "Ind_03_disturbance_before_2020", label: "Disturbance before 2020", yesTone: "low" },
      { key: "Ind_04_disturbance_after_2020", label: "Disturbance after 2020", yesTone: "high" },
    ],
  },
  {
    key: "acrop",
    riskField: "risk_acrop",
    label: "Annual crop",
    shortLabel: "Annual",
    indicators: [
      { key: "Ind_01_treecover", label: "Tree cover in 2020", yesTone: null },
      { key: "Ind_02_commodities", label: "Commodity present pre-2020", yesTone: "low" },
      { key: "Ind_04_disturbance_after_2020", label: "Disturbance after 2020", yesTone: "high" },
    ],
  },
  {
    key: "timber",
    riskField: "risk_timber",
    label: "Timber",
    shortLabel: "Timber",
    indicators: [
      { key: "Ind_02_commodities", label: "Commodity present pre-2020", yesTone: "low" },
      { key: "Ind_05_primary_2020", label: "Primary forest in 2020", yesTone: null },
      { key: "Ind_06_nat_reg_forest_2020", label: "Naturally regenerating forest in 2020", yesTone: null },
      { key: "Ind_07_planted_plantations_2020", label: "Plantation in 2020", yesTone: null },
      { key: "Ind_08_planted_plantations_after_2020", label: "Plantation after 2020", yesTone: "high" },
      { key: "Ind_09_treecover_after_2020", label: "Tree cover after 2020", yesTone: "low" },
      { key: "Ind_10_agri_after_2020", label: "Agriculture after 2020", yesTone: "high" },
      { key: "Ind_11_logging_concession_before_2020", label: "Logging concession before 2020", yesTone: "low" },
    ],
  },
];

type TreePred =
  | { op: "yn"; field: string }
  | { op: "not"; field: string }
  | { op: "and"; of: TreePred[] }
  | { op: "or"; of: TreePred[] };

type TreeNodeDef = {
  question: string;
  test: TreePred;
  yes: TreeOutcome;
  no: TreeOutcome;
};

const TREE_DEFS: Record<CommodityKey, TreeNodeDef[]> = {
  pcrop: [
    { question: "Tree cover in 2020?", test: { op: "yn", field: "Ind_01_treecover" }, yes: "continue", no: "low" },
    { question: "Commodity present pre-2020?", test: { op: "yn", field: "Ind_02_commodities" }, yes: "low", no: "continue" },
    { question: "Disturbance before 2020?", test: { op: "yn", field: "Ind_03_disturbance_before_2020" }, yes: "low", no: "continue" },
    { question: "Disturbance after 2020?", test: { op: "yn", field: "Ind_04_disturbance_after_2020" }, yes: "high", no: "more_info_needed" },
  ],
  acrop: [
    { question: "Tree cover in 2020?", test: { op: "yn", field: "Ind_01_treecover" }, yes: "continue", no: "low" },
    { question: "Commodity present pre-2020?", test: { op: "yn", field: "Ind_02_commodities" }, yes: "low", no: "continue" },
    { question: "Disturbance after 2020?", test: { op: "yn", field: "Ind_04_disturbance_after_2020" }, yes: "high", no: "more_info_needed" },
  ],
  timber: [
    { question: "Commodity present pre-2020?", test: { op: "yn", field: "Ind_02_commodities" }, yes: "low", no: "continue" },
    {
      question: "Plantation in 2020 and no agriculture after 2020?",
      test: {
        op: "and",
        of: [
          { op: "yn", field: "Ind_07_planted_plantations_2020" },
          { op: "not", field: "Ind_10_agri_after_2020" },
        ],
      },
      yes: "low",
      no: "continue",
    },
    {
      question: "Forest in 2020 and agriculture after 2020?",
      test: {
        op: "and",
        of: [
          {
            op: "or",
            of: [
              { op: "yn", field: "Ind_05_primary_2020" },
              { op: "yn", field: "Ind_06_nat_reg_forest_2020" },
              { op: "yn", field: "Ind_07_planted_plantations_2020" },
            ],
          },
          { op: "yn", field: "Ind_10_agri_after_2020" },
        ],
      },
      yes: "high",
      no: "continue",
    },
    {
      question: "Natural forest in 2020 and plantation after 2020?",
      test: {
        op: "and",
        of: [
          {
            op: "or",
            of: [
              { op: "yn", field: "Ind_05_primary_2020" },
              { op: "yn", field: "Ind_06_nat_reg_forest_2020" },
            ],
          },
          { op: "yn", field: "Ind_08_planted_plantations_after_2020" },
        ],
      },
      yes: "high",
      no: "continue",
    },
    {
      question: "Natural forest with post-2020 tree cover or logging concession?",
      test: {
        op: "and",
        of: [
          {
            op: "or",
            of: [
              { op: "yn", field: "Ind_05_primary_2020" },
              { op: "yn", field: "Ind_06_nat_reg_forest_2020" },
            ],
          },
          {
            op: "or",
            of: [
              { op: "yn", field: "Ind_09_treecover_after_2020" },
              { op: "yn", field: "Ind_11_logging_concession_before_2020" },
            ],
          },
        ],
      },
      yes: "low",
      no: "continue",
    },
    {
      question: "Primary or naturally regenerating forest in 2020?",
      test: {
        op: "or",
        of: [
          { op: "yn", field: "Ind_05_primary_2020" },
          { op: "yn", field: "Ind_06_nat_reg_forest_2020" },
        ],
      },
      yes: "more_info_needed",
      no: "low",
    },
  ],
};

function compilePred(pred: TreePred): (row: Record<string, unknown>) => boolean {
  switch (pred.op) {
    case "yn":
      return (row) => isTruthyCell(row[pred.field]);
    case "not":
      return (row) => !isTruthyCell(row[pred.field]);
    case "and":
      return (row) => pred.of.every((p) => compilePred(p)(row));
    case "or":
      return (row) => pred.of.some((p) => compilePred(p)(row));
  }
}

type Node = {
  question: string;
  test: (row: Record<string, unknown>) => boolean;
  yes: TreeOutcome;
  no: TreeOutcome;
};

const TREES: Record<CommodityKey, Node[]> = {
  pcrop: TREE_DEFS.pcrop.map((n) => ({ ...n, test: compilePred(n.test) })),
  acrop: TREE_DEFS.acrop.map((n) => ({ ...n, test: compilePred(n.test) })),
  timber: TREE_DEFS.timber.map((n) => ({ ...n, test: compilePred(n.test) })),
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

export function getCommodity(key: CommodityKey) {
  return COMMODITY_OPTIONS.find((o) => o.key === key)!;
}

export function getCommodityByRiskField(field: string) {
  return COMMODITY_OPTIONS.find((o) => o.riskField === field);
}

export function findIndicator(key: string) {
  if (key === WATERBODY_FIELD) {
    return { key: WATERBODY_FIELD, label: WATERBODY_LABEL, yesTone: null };
  }
  for (const o of COMMODITY_OPTIONS) {
    const ind = o.indicators.find((i) => i.key === key);
    if (ind) return ind;
  }
  return undefined;
}

export function formatResultsFilterLabel(
  riskFilter?: RiskFilter | null,
  indicatorFilter?: string | null
): string | null {
  if (riskFilter) {
    const name =
      getCommodityByRiskField(riskFilter.field)?.shortLabel ??
      riskFilter.field.replace(/^risk_/, "");
    return `${name} · ${riskValueLabel(riskFilter.value)}`;
  }
  if (indicatorFilter) {
    return `${findIndicator(indicatorFilter)?.label ?? indicatorFilter} · yes`;
  }
  return null;
}
