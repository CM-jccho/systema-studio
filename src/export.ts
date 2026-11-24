import type { Bi, ExportFormat, ExportOptions, Locale, Perspective, WorkSystem } from "./types";
import { copy as copyTable, pick } from "./i18n";
import { checksFor } from "./presets";

const delegationLabel = (system: WorkSystem, locale: Locale): string => {
  const c = copyTable[locale];
  return system.delegation === "draft"
    ? c.context.delegationDraft
    : system.delegation === "auto"
      ? c.context.delegationAuto
      : c.context.delegationApprove;
};

const pad = (n: number) => String(n).padStart(2, "0");

export const dateStamp = (at: number): string => {
  const d = new Date(at);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const dateTime = (at: number): string => {
  const d = new Date(at);
  return `${dateStamp(at)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const successLines = (value: Bi, locale: Locale): string[] =>
  pick(value, locale)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const activeRules = (system: WorkSystem, options: ExportOptions) =>
  system.rules.filter((rule) => (options.activeRulesOnly ? rule.active : true));

const rulesBlock = (system: WorkSystem, locale: Locale, options: ExportOptions, style: "md" | "numbered"): string => {
  const rules = activeRules(system, options);
  if (!rules.length) return locale === "ko" ? "(규칙 없음)" : "(no rules)";
  return rules
    .map((rule, index) => {
      const text = pick(rule.text, locale);
      return style === "md" ? `- ${text}` : `${index + 1}. ${text}`;
    })
    .join("\n");
};

const reviewLensBlock = (system: WorkSystem, locale: Locale, style: "md" | "numbered"): string => {
  const perspectives: Perspective[] = ["customer", "finance", "competition", "build"];
  const c = copyTable[locale];
  return perspectives
    .map((p) => {
      const title = c.redteam.perspectives[p];
      const checks = checksFor(system.presetKey, p)
        .map((item) => `  - ${pick(item, locale)}`)
        .join("\n");
      return style === "md" ? `**${title}**\n${checks}` : `${title}\n${checks}`;
    })
    .join("\n\n");
};

const historyBlock = (system: WorkSystem, locale: Locale): string => {
  const c = copyTable[locale];
  if (!system.runs.length) return locale === "ko" ? "(검증 기록 없음)" : "(no reviews)";
  return [...system.runs]
    .sort((a, b) => b.at - a.at)
    .slice(0, 8)
    .map((run) => {
      const note = pick(run.notes, locale).trim();
      const line = `${dateStamp(run.at)}, ${c.verdicts[run.verdict]}, ${run.checked.length}${locale === "ko" ? "개 확인" : " checked"}`;
      return note ? `${line}\n  ${note}` : line;
    })
    .join("\n");
};

const taskLine = (locale: Locale): string =>
  locale === "ko"
    ? "위 목표를 수행하세요. 결과물을 만들기 전에 목표와 제약을 각각 한 줄로 다시 말하고, 규칙에 어긋날 수 있는 지점을 먼저 표시하세요. 초안이 끝나면 네 관점에서 스스로 반론을 만들고, 반론이 해결되지 않은 부분은 숨기지 말고 남기세요."
    : "Do the work described by the goal. Before producing anything, restate the goal and the constraints in one line each and flag where the rules could be broken. When the draft is done, raise objections from the four lenses yourself and leave unresolved ones visible rather than hiding them.";

const languageLine = (locale: Locale): string =>
  locale === "ko" ? "답변 언어: 한국어." : "Reply in English.";

export function buildPackage(
  system: WorkSystem,
  locale: Locale,
  format: ExportFormat,
  options: ExportOptions,
): string {
  const name = pick(system.name, locale) || copyTable[locale].workspace.untitled;
  const goal = pick(system.goal, locale);
  const background = pick(system.background, locale);
  const constraints = pick(system.constraints, locale);
  const success = successLines(system.success, locale);
  const c = copyTable[locale];

  if (format === "claude") {
    const parts = [
      `<role>
${locale === "ko" ? "당신은 아래 업무 시스템을 함께 운영하는 시니어 파트너입니다. 결과물의 양보다 판단의 근거를 먼저 봅니다." : "You are the senior partner who runs the work system below. You look at the reasoning before the volume."}
</role>`,
      `<work_system name="${name}">
  <goal>${goal}</goal>
  <background>${background}</background>
  <constraints>${constraints}</constraints>
  <success_criteria>
${success.map((line) => `    - ${line}`).join("\n") || "    -"}
  </success_criteria>
  <delegation>${delegationLabel(system, locale)}</delegation>
</work_system>`,
      `<rules>
${rulesBlock(system, locale, options, "numbered")}
</rules>`,
    ];
    if (options.includeRedteam) {
      parts.push(`<review_lenses>\n${reviewLensBlock(system, locale, "numbered")}\n</review_lenses>`);
    }
    if (options.includeHistory) {
      parts.push(`<review_record>\n${historyBlock(system, locale)}\n</review_record>`);
    }
    parts.push(`<task>\n${taskLine(locale)}\n${languageLine(locale)}\n</task>`);
    return parts.join("\n\n");
  }

  if (format === "chatgpt") {
    const parts = [
      `# ${name}`,
      `## Instructions\n${locale === "ko" ? "아래 업무 컨텍스트와 규칙을 기준으로 작업합니다. 규칙과 충돌하는 요청은 먼저 충돌을 말하고 대안을 제시하세요." : "Work from the context and rules below. When a request conflicts with a rule, name the conflict first and offer an alternative."}`,
      `## Context\n**${c.context.goal}**\n${goal}\n\n**${c.context.background}**\n${background}\n\n**${c.context.constraints}**\n${constraints}\n\n**${c.context.success}**\n${success.map((line) => `- ${line}`).join("\n") || "-"}\n\n**${c.context.delegation}**\n${delegationLabel(system, locale)}`,
      `## Rules\n${rulesBlock(system, locale, options, "md")}`,
    ];
    if (options.includeRedteam) {
      parts.push(`## Review lenses\n${reviewLensBlock(system, locale, "md")}`);
    }
    if (options.includeHistory) {
      parts.push(`## Review record\n${historyBlock(system, locale)}`);
    }
    parts.push(`## Task\n${taskLine(locale)}\n${languageLine(locale)}`);
    return parts.join("\n\n");
  }

  const parts = [
    `${name.toUpperCase()}`,
    `1. Role\n${locale === "ko" ? "시니어 파트너. 판단의 근거를 먼저 봅니다." : "Senior partner. Reasoning before volume."}`,
    `2. Objective\n${goal}`,
    `3. Background\n${background}`,
    `4. Constraints\n${constraints}`,
    `5. Success criteria\n${success.map((line) => `- ${line}`).join("\n") || "-"}`,
    `6. Rules\n${rulesBlock(system, locale, options, "numbered")}`,
  ];
  if (options.includeRedteam) parts.push(`7. Review lenses\n${reviewLensBlock(system, locale, "numbered")}`);
  if (options.includeHistory) parts.push(`8. Review record\n${historyBlock(system, locale)}`);
  parts.push(`${options.includeHistory ? "9" : options.includeRedteam ? "8" : "7"}. Task\n${taskLine(locale)}\n${languageLine(locale)}`);
  return parts.join("\n\n");
}

export function buildSystemJson(system: WorkSystem): string {
  return JSON.stringify(
    {
      app: "SYSTEMA Studio",
      schema: 1,
      exportedAt: new Date().toISOString(),
      system,
    },
    null,
    2,
  );
}

const perspectiveBrief: Record<Perspective, { ko: string; en: string }> = {
  customer: {
    ko: "당신은 이 제안을 검토하는 구매 담당자입니다. 예산을 쓰는 사람의 입장에서, 설득되지 않는 지점을 찾습니다.",
    en: "You are the buyer reviewing this proposal. From the side that spends the budget, find where it fails to persuade.",
  },
  finance: {
    ko: "당신은 재무 담당자입니다. 이 일이 남기는 마진과 감당할 수 없는 비용, 중단 기준을 봅니다.",
    en: "You are the finance reviewer. You look at the margin this leaves, the cost it cannot carry, and the stop line.",
  },
  competition: {
    ko: "당신은 경쟁사의 기획자입니다. 같은 문제를 더 싸고 단순하게 푸는 방법을 찾고, 이 제안의 차별점이 복제될 수 있는지 봅니다.",
    en: "You are a planner at a competitor. Find a cheaper, simpler way to solve the same problem and test whether the difference can be copied.",
  },
  build: {
    ko: "당신은 개발 책임자이자 법무 검토자입니다. 만들 수 있는 범위, 실패 상태, 정책과 계약의 위험을 봅니다.",
    en: "You are the engineering lead and the legal reviewer. You look at what can be built, the failure states, and policy or contract risk.",
  },
};

export function buildPerspectivePrompt(
  system: WorkSystem,
  locale: Locale,
  perspective: Perspective,
  base?: string,
): string {
  const c = copyTable[locale];
  const name = pick(system.name, locale) || c.workspace.untitled;
  const checks = checksFor(system.presetKey, perspective)
    .map((item) => `- ${pick(item, locale)}`)
    .join("\n");
  const context = [
    `${locale === "ko" ? "업무 시스템" : "Work system"}: ${name}`,
    `${c.context.goal}: ${pick(system.goal, locale)}`,
    `${c.context.background}: ${pick(system.background, locale)}`,
    `${c.context.constraints}: ${pick(system.constraints, locale)}`,
    `${c.context.success}:\n${successLines(system.success, locale).map((line) => `- ${line}`).join("\n") || "-"}`,
    `${c.rulebook.title}:\n${rulesBlock(system, locale, { activeRulesOnly: true, includeRedteam: false, includeHistory: false }, "numbered")}`,
  ].join("\n");

  const output =
    locale === "ko"
      ? "출력 형식: ① 가장 치명적인 반론 1개(한 문단) ② 근거가 붙은 반론 4개(번호 목록) ③ 이 관점에서 통과하려면 확인해야 할 조건 3개 ④ 그대로 던질 질문 3개. 확인되지 않은 수치나 사례를 만들지 마세요."
      : "Output: (1) the single most damaging objection in one paragraph, (2) four numbered objections with grounds, (3) three conditions this must meet to pass this lens, (4) three questions to put back to the author. Do not invent numbers or cases.";

  const header = base ? `${base}\n\n${perspectiveBrief[perspective][locale]}` : perspectiveBrief[perspective][locale];

  return `${header}\n\n${context}\n\n${c.redteam.checklist}\n${checks}\n\n${output}\n\n${languageLine(locale)}`;
}

export function buildReviewPrompt(system: WorkSystem, locale: Locale): string {
  const c = copyTable[locale];
  const name = pick(system.name, locale) || c.workspace.untitled;
  const context = [
    `${locale === "ko" ? "업무 시스템" : "Work system"}: ${name}`,
    `${c.context.goal}: ${pick(system.goal, locale)}`,
    `${c.context.background}: ${pick(system.background, locale)}`,
    `${c.context.constraints}: ${pick(system.constraints, locale)}`,
    `${c.context.success}:\n${successLines(system.success, locale).map((line) => `- ${line}`).join("\n") || "-"}`,
    `${c.rulebook.title}:\n${rulesBlock(system, locale, { activeRulesOnly: true, includeRedteam: false, includeHistory: false }, "numbered")}`,
  ].join("\n");

  const intro =
    locale === "ko"
      ? "당신은 적대적 검증자입니다. 아래 업무 시스템으로 만든 결과물을 네 관점에서 공격합니다. 칭찬하지 말고, 확인되지 않은 것은 확인되지 않았다고 말하세요."
      : "You are an adversarial reviewer. Attack the work produced by this system from four lenses. Do not praise; say plainly when something is unverified.";

  const body: Record<Perspective, { ko: string; en: string }> = {
    customer: { ko: "고객과 구매자", en: "Customer" },
    finance: { ko: "재무와 수익성", en: "Finance" },
    competition: { ko: "경쟁사와 차별화", en: "Competition" },
    build: { ko: "개발과 법무", en: "Build and legal" },
  };

  const sections = (Object.keys(body) as Perspective[])
    .map((p) => {
      const checks = checksFor(system.presetKey, p)
        .map((item) => `- ${pick(item, locale)}`)
        .join("\n");
      return `## ${body[p][locale]}\n${checks}`;
    })
    .join("\n\n");

  const output =
    locale === "ko"
      ? "각 관점마다: 가장 치명적인 반론 1개, 근거가 붙은 반론 3개, 통과 조건 2개. 마지막에 전체 판정(통과/조건부/재작업)과 그 이유를 한 문단으로 쓰세요. 확인되지 않은 수치나 사례를 만들지 마세요."
      : "For each lens: one most damaging objection, three objections with grounds, two conditions to pass. Close with an overall verdict (pass, conditional, rework) and a paragraph of reasoning. Do not invent numbers or cases.";

  return `${intro}\n\n${context}\n\n${sections}\n\n${output}\n\n${languageLine(locale)}`;
}

export const exportedJsonDate = dateTime;
