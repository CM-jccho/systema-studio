import type { Keys, Locale, Store, WorkSystem } from "./types";
import { systemFromPreset } from "./presets";

export const STORE_KEY = "systema.studio.v1";
const KEYS_KEY = "systema.studio.keys.v1";

/** Korean-first launch: the first visit opens in Korean, and the toggle is remembered. */
export function detectLocale(): Locale {
  return "ko";
}

function isSystem(value: unknown): value is WorkSystem {
  if (!value || typeof value !== "object") return false;
  const s = value as Partial<WorkSystem>;
  return (
    typeof s.id === "string" &&
    typeof s.name === "object" &&
    typeof s.goal === "object" &&
    Array.isArray(s.rules) &&
    Array.isArray(s.runs)
  );
}

const emptyBi = () => ({ ko: "", en: "" });

function normalize(system: WorkSystem): WorkSystem {
  const patternSource = (system.patterns ?? {}) as Partial<WorkSystem["patterns"]>;
  return {
    ...system,
    delegation: system.delegation ?? "approve",
    sim: system.sim ?? { minutesPerTask: 60, repeatsPerMonth: 1, savingsRate: 30 },
    presetKey: system.presetKey ?? null,
    patterns: {
      good: patternSource.good ?? emptyBi(),
      bad: patternSource.bad ?? emptyBi(),
      focus: patternSource.focus ?? emptyBi(),
      extracted: patternSource.extracted ?? emptyBi(),
    },
    evaluations: Array.isArray(system.evaluations) ? system.evaluations : [],
    rules: system.rules.map((rule) => ({
      ...rule,
      versions: Array.isArray(rule.versions) ? rule.versions : [],
      verified: typeof rule.verified === "number" ? rule.verified : 0,
      note: rule.note ?? { ko: "", en: "" },
    })),
  };
}

export function initialStore(locale: Locale): Store {
  const systems = [systemFromPreset("b2b"), systemFromPreset("prd"), systemFromPreset("solo")];
  return {
    version: 1,
    locale,
    systems,
    activeId: systems[0].id,
    onboarded: false,
  };
}

export function loadStore(): Store | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Store>;
    if (!parsed || !Array.isArray(parsed.systems)) return null;
    const systems = parsed.systems.filter(isSystem).map(normalize);
    if (!systems.length) return null;
    const locale: Locale = parsed.locale === "en" ? "en" : "ko";
    const activeId = systems.some((s) => s.id === parsed.activeId) ? (parsed.activeId as string) : systems[0].id;
    return {
      version: 1,
      locale,
      systems,
      activeId,
      onboarded: Boolean(parsed.onboarded),
    };
  } catch {
    return null;
  }
}

export function saveStore(store: Store): boolean {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

export function loadKeys(): Keys {
  const fallback: Keys = { openai: "", anthropic: "", provider: "openai", model: "gpt-4o-mini" };
  try {
    const raw = localStorage.getItem(KEYS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Keys>;
    return {
      openai: typeof parsed.openai === "string" ? parsed.openai : "",
      anthropic: typeof parsed.anthropic === "string" ? parsed.anthropic : "",
      provider: parsed.provider === "anthropic" ? "anthropic" : "openai",
      model: typeof parsed.model === "string" && parsed.model ? parsed.model : fallback.model,
    };
  } catch {
    return fallback;
  }
}

export function saveKeys(keys: Keys): boolean {
  try {
    localStorage.setItem(KEYS_KEY, JSON.stringify(keys));
    return true;
  } catch {
    return false;
  }
}

export function clearKeys(): void {
  try {
    localStorage.removeItem(KEYS_KEY);
  } catch {
    /* storage unavailable */
  }
}
