import decisionTrees from "./report-assets/risk-trees.json";
import { isTruthyCell, riskValueToTone, type RiskTone, type RiskValue } from "./catalog-fields";

export type CommodityKey = "pcrop" | "acrop" | "timber";
export type TreeOutcome = RiskValue | "continue";

export const WATERBODY_FIELD = "In_waterbody";

// A rule matches a plot when its columns answer `is` (yes when any of them is yes). A matching plot gets
// the `then` risk or goes through the `then` rules; the others fall to the next rule, and past the last
// one get `otherwise`.
type Rules = { rules: Rule[]; otherwise: RiskValue };
type Rule = { columns: string[]; is: "yes" | "no"; then: RiskValue | Rules };

// Display snapshot checked against openforis-whisp 3.0.0a25; see report-assets/README.md.
const DECISION_TREES = decisionTrees as Array<{ key: CommodityKey; riskField: string; tree: Rules }>;

// The columns the rules read, in order, each with the risk a yes on it gives straight away.
function indicatorsOf(tree: Rules, seen = new Map<string, RiskTone | null>()) {
  for (const rule of tree.rules) {
    const yesTone = rule.is === "yes" && typeof rule.then === "string" ? riskValueToTone(rule.then) : null;
    for (const key of rule.columns) if (!seen.has(key)) seen.set(key, yesTone);
    if (typeof rule.then !== "string") indicatorsOf(rule.then, seen);
  }
  return [...seen].map(([key, yesTone]) => ({ key, yesTone }));
}

export const COMMODITY_OPTIONS = DECISION_TREES.map((option) => ({
  ...option,
  indicators: indicatorsOf(option.tree),
}));

export interface TreeStepView {
  columns: string[];
  is: "yes" | "no";
  matchCount: number;
  restCount: number;
  then: RiskValue | TreeStepView[];
  otherwise: TreeOutcome;
  selected: "match" | "rest" | null;
  disabled: boolean;
}

type Row = Record<string, unknown>;

const matches = (rule: Rule, row: Row) =>
  rule.columns.some((c) => isTruthyCell(row[c])) === (rule.is === "yes");

// selected is the selected plot while it reaches these rules; plotMode dims the steps it does not reach.
function walk(tree: Rules, rows: Row[], selected: Row | null, plotMode: boolean): TreeStepView[] {
  const steps: TreeStepView[] = [];
  let rest = rows;
  for (const [i, rule] of tree.rules.entries()) {
    const match = rest.filter((r) => matches(rule, r));
    rest = rest.filter((r) => !matches(rule, r));
    const side = selected ? (matches(rule, selected) ? "match" : "rest") : null;
    steps.push({
      columns: rule.columns,
      is: rule.is,
      matchCount: match.length,
      restCount: rest.length,
      then:
        typeof rule.then === "string"
          ? rule.then
          : walk(rule.then, match, side === "match" ? selected : null, plotMode),
      otherwise: i === tree.rules.length - 1 ? tree.otherwise : "continue",
      selected: side,
      disabled: plotMode && !side,
    });
    if (side === "match") selected = null;
  }
  return steps;
}

export function buildTreeSteps(
  commodity: CommodityKey,
  rows: Row[],
  selectedRow?: Row | null
): TreeStepView[] {
  return walk(getCommodity(commodity).tree, rows, selectedRow ?? null, Boolean(selectedRow));
}

export type Translate = (key: string, values?: Record<string, string>) => string;

export const questionLabel = (columns: string[], t: Translate) =>
  t("question", { indicators: columns.map((c) => t(`indicator.${c}`)).join(t("predicateOr")) });

export function getCommodity(key: CommodityKey) {
  return COMMODITY_OPTIONS.find((o) => o.key === key)!;
}

export function getCommodityByRiskField(field: string) {
  return COMMODITY_OPTIONS.find((o) => o.riskField === field);
}
