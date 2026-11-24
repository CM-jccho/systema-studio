export type Locale = "ko" | "en";

/** A field that may exist in either language. User edits only the active side. */
export type Bi = { ko: string; en: string };

export type RuleCategory =
  | "structure"
  | "tone"
  | "trust"
  | "verification"
  | "revenue"
  | "ops";

export type Perspective = "customer" | "finance" | "competition" | "build";

export type Verdict = "pass" | "conditional" | "rework";

export type Delegation = "draft" | "approve" | "auto";

export interface RuleVersion {
  version: number;
  note: Bi;
  at: number;
}

export interface Rule {
  id: string;
  text: Bi;
  category: RuleCategory;
  active: boolean;
  version: number;
  note: Bi;
  verified: number;
  createdAt: number;
  versions: RuleVersion[];
}

export interface RedteamRun {
  id: string;
  at: number;
  checked: string[];
  notes: Bi;
  verdict: Verdict;
  source: "manual" | "byok";
}

export interface Simulator {
  minutesPerTask: number;
  repeatsPerMonth: number;
  savingsRate: number;
}

export interface WorkSystem {
  id: string;
  name: Bi;
  purpose: Bi;
  goal: Bi;
  background: Bi;
  constraints: Bi;
  success: Bi;
  delegation: Delegation;
  rules: Rule[];
  runs: RedteamRun[];
  sim: Simulator;
  presetKey: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Store {
  version: 1;
  locale: Locale;
  systems: WorkSystem[];
  activeId: string;
  onboarded: boolean;
}

export type Keys = {
  openai: string;
  anthropic: string;
  provider: "openai" | "anthropic";
  model: string;
};

export type ExportFormat = "claude" | "chatgpt" | "gemini";

export interface ExportOptions {
  activeRulesOnly: boolean;
  includeRedteam: boolean;
  includeHistory: boolean;
}
