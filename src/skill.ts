import type { Bi, Locale, Perspective, WorkSystem } from "./types";
import { copy as copyTable, pick } from "./i18n";
import { checksFor } from "./presets";

const perspectives: Perspective[] = ["customer", "finance", "competition", "build"];

/**
 * Claude skill names use lowercase letters, digits and hyphens only.
 * The Korean name cannot be used, so the English name is the source.
 */
export function skillSlug(system: WorkSystem): string {
  const source = (system.name.en || system.name.ko || "").toLowerCase();
  const slug = source
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 64)
    .replace(/-+$/g, "");
  return slug || "work-system";
}

const lines = (value: Bi, locale: Locale): string[] =>
  pick(value, locale)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const cell = (text: string): string => text.replace(/\|/g, "\\|").replace(/\n+/g, " ");

const delegationLabel = (system: WorkSystem, locale: Locale): string => {
  const c = copyTable[locale];
  return system.delegation === "draft"
    ? c.context.delegationDraft
    : system.delegation === "auto"
      ? c.context.delegationAuto
      : c.context.delegationApprove;
};

const outcome = (locale: Locale): string =>
  locale === "ko"
    ? "산출물을 내기 전에 목표와 제약을 각각 한 줄로 다시 말하고, 규칙에 어긋날 수 있는 지점을 먼저 표시하세요. 초안이 끝나면 네 관점에서 스스로 반론을 만들고, 해결되지 않은 반론은 숨기지 말고 남기세요."
    : "Before producing anything, restate the goal and the constraints in one line each and flag where the rules could be broken. When the draft is done, raise objections from the four lenses yourself and leave unresolved ones visible.";

const languageLine = (locale: Locale): string =>
  locale === "ko" ? "답변 언어: 한국어." : "Reply in English.";

/** One-line description for the frontmatter; the skill router reads only this. */
export function skillDescription(system: WorkSystem, locale: Locale): string {
  const c = copyTable[locale];
  const name = pick(system.name, locale) || c.workspace.untitled;
  const purpose = pick(system.purpose, locale).trim();
  const goal = pick(system.goal, locale).trim();
  const body = [purpose, goal].filter(Boolean).join(". ") || name;
  const description = body.endsWith(".") ? body : `${body}.`;
  return description.length > 1000 ? `${description.slice(0, 999)}…` : description.replace(/\s+/g, " ");
}

export function buildSkillMd(system: WorkSystem, locale: Locale): string {
  const c = copyTable[locale];
  const name = pick(system.name, locale) || c.workspace.untitled;
  const activeRules = system.rules.filter((rule) => rule.active);
  const t = {
    when: locale === "ko" ? "이 스킬을 쓰는 때" : "When this skill applies",
    context: locale === "ko" ? "컨텍스트" : "Context",
    goal: c.context.goal,
    background: c.context.background,
    constraints: c.context.constraints,
    success: c.context.success,
    delegation: c.context.delegation,
    rules: locale === "ko" ? "규칙" : "Rules",
    rulesIntro:
      locale === "ko"
        ? "아래 규칙을 기준으로 작업합니다. 요청이 규칙과 충돌하면 먼저 충돌을 말하고 대안을 제시하세요."
        : "Work from these rules. When a request conflicts with one, name the conflict first and offer an alternative.",
    noRules: locale === "ko" ? "(아직 규칙이 없습니다)" : "(no rules yet)",
    redteam: locale === "ko" ? "적대적 검증" : "Red-team verification",
    redteamIntro:
      locale === "ko"
        ? "산출물을 넘기기 전에 네 관점에서 먼저 공격합니다. 칭찬하지 말고, 확인되지 않은 것은 확인되지 않았다고 쓰세요."
        : "Attack the artifact from four lenses before handing it over. Do not praise; state plainly when something is unverified.",
    redteamOut:
      locale === "ko"
        ? "출력: 관점마다 가장 치명적인 반론 1개, 근거가 붙은 반론 3개, 통과 조건 2개. 마지막에 전체 판정(통과/조건부/재작업)과 이유 한 문단. 확인되지 않은 수치나 사례를 만들지 마세요."
        : "Output: for each lens one most damaging objection, three objections with grounds, two conditions to pass. Close with an overall verdict (pass, conditional, rework) and one paragraph of reasoning. Do not invent numbers or cases.",
    rubric: locale === "ko" ? "평가 루브릭" : "Evaluator rubric",
    rubricIntro:
      locale === "ko"
        ? "산출물을 항목별로 채점합니다. 각 항목은 통과 또는 미달이며 부분 점수는 없습니다."
        : "Score the artifact item by item. Each item is pass or fail; there is no partial credit.",
    criterion: locale === "ko" ? "기준" : "Criterion",
    passWhen: locale === "ko" ? "통과 조건" : "Pass when",
    passRule: locale === "ko" ? "산출물 전체에서 이 규칙을 지켰다." : "The rule was followed throughout the artifact.",
    emptyRule: locale === "ko" ? "(규칙을 먼저 추가하세요)" : "(add a rule first)",
    scoring:
      locale === "ko"
        ? "점수 = 통과 항목 ÷ 전체 항목 × 100. 90 이상 통과, 70~89 조건부 통과, 70 미만 재작업. 실패한 항목마다 무엇을 어떻게 고칠지 수정 메모에 한 줄씩 남기세요."
        : "Score = passed items ÷ total items × 100. 90 and above: pass. 70 to 89: conditional. Below 70: rework. For each failed item, write one line in the revision memo saying what changes.",
    task: locale === "ko" ? "작업" : "Task",
  };

  const purpose = pick(system.purpose, locale).trim();
  const goal = pick(system.goal, locale).trim();
  const background = pick(system.background, locale).trim();
  const constraints = pick(system.constraints, locale).trim();
  const success = lines(system.success, locale);

  const front = [
    "---",
    `name: ${skillSlug(system)}`,
    `description: "${skillDescription(system, locale).replace(/"/g, "'")}"`,
    "---",
    "",
    `# ${name}`,
  ].join("\n");

  const whenBlock = [
    `## ${t.when}`,
    purpose || (locale === "ko" ? "(목적을 한 문장으로 적어 두면 스킬 선택 정확도가 올라갑니다)" : "(one sentence of purpose improves skill selection)"),
    goal ? `\n**${t.goal}** ${goal}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const contextParts = [`## ${t.context}`];
  contextParts.push(`**${t.goal}**\n${goal || "-"}`);
  contextParts.push(`**${t.background}**\n${background || "-"}`);
  contextParts.push(`**${t.constraints}**\n${constraints || "-"}`);
  contextParts.push(`**${t.success}**\n${success.map((line) => `- ${line}`).join("\n") || "-"}`);
  contextParts.push(`**${t.delegation}**\n${delegationLabel(system, locale)}`);

  const rulesBlock = [
    `## ${t.rules}`,
    t.rulesIntro,
    "",
    activeRules.length
      ? activeRules.map((rule, index) => `${index + 1}. ${pick(rule.text, locale)}`).join("\n")
      : t.noRules,
  ].join("\n");

  const lensBlocks = perspectives
    .map((p) => {
      const checks = checksFor(system.presetKey, p);
      const body = checks.length
        ? checks.map((item) => `- ${pick(item, locale)}`).join("\n")
        : "-";
      return `### ${c.redteam.perspectives[p]}\n${body}`;
    })
    .join("\n\n");

  const redteamBlock = [`## ${t.redteam}`, t.redteamIntro, "", lensBlocks, "", t.redteamOut].join("\n");

  const rubricRows = activeRules.length
    ? activeRules
        .map((rule, index) => `| ${index + 1} | ${cell(pick(rule.text, locale))} | ${t.passRule} |`)
        .join("\n")
    : `| 1 | ${t.emptyRule} | - |`;
  const rubricBlock = [
    `## ${t.rubric}`,
    t.rubricIntro,
    "",
    `| # | ${t.criterion} | ${t.passWhen} |`,
    "|---|---|---|",
    rubricRows,
    "",
    t.scoring,
  ].join("\n");

  const taskBlock = [`## ${t.task}`, outcome(locale), languageLine(locale)].join("\n");

  return [front, whenBlock, contextParts.join("\n\n"), rulesBlock, redteamBlock, rubricBlock, taskBlock].join("\n\n") + "\n";
}
