import type { Locale, PatternNotes, WorkSystem } from "./types";
import { copy as copyTable, pick } from "./i18n";

const successLines = (system: WorkSystem, locale: Locale): string[] =>
  pick(system.success, locale)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

/** The prompt a user pastes into any AI chat to compare two real cases and extract rules. */
export function buildPatternPrompt(system: WorkSystem, locale: Locale, patterns: PatternNotes): string {
  const c = copyTable[locale];
  const name = pick(system.name, locale) || c.workspace.untitled;
  const activeRules = system.rules.filter((rule) => rule.active);
  const good = pick(patterns.good, locale).trim();
  const bad = pick(patterns.bad, locale).trim();
  const focus = pick(patterns.focus, locale).trim();

  const existing = activeRules.length
    ? activeRules.map((rule, index) => `${index + 1}. ${pick(rule.text, locale)}`).join("\n")
    : locale === "ko"
      ? "(아직 없음)"
      : "(none yet)";

  if (locale === "ko") {
    return `당신은 경험에서 규칙을 뽑는 분석가입니다. 아래 잘된 예와 안 된 예를 비교해, 결과를 갈라놓은 결정만 다음에 다시 쓸 수 있는 규칙으로 남깁니다. 일반론이나 교과서 문장은 쓰지 않습니다.

[업무 시스템]
이름: ${name}
목적: ${pick(system.purpose, "ko")}
목표: ${pick(system.goal, "ko")}
제약: ${pick(system.constraints, "ko")}
성공 기준:
${successLines(system, "ko").map((line) => `- ${line}`).join("\n") || "-"}

[이미 있는 규칙]
${existing}

[잘된 예]
${good || "(여기에 실제로 잘된 사례를 붙여 넣습니다)"}

[안 된 예]
${bad || "(여기에 실제로 안 된 사례를 붙여 넣습니다)"}

[내가 이미 아는 차이]
${focus || "(비어 있음. 비어 있으면 두 사례에서 직접 찾으세요.)"}

분석 순서:
1. 두 사례에서 결과를 갈라놓은 결정을 3~5개 찾습니다. 각각 "잘된 예에서는 …, 안 된 예에서는 …" 형태로 씁니다.
2. 각 결정을 다음에 그대로 따를 수 있는 한 문장 규칙으로 바꿉니다. 관찰 가능한 행동으로 쓰고, "더 신경 쓴다", "잘 만든다" 같은 추상 표현은 쓰지 않습니다.
3. 이미 있는 규칙과 겹치거나 같은 말이면 버리고, 새 규칙만 남깁니다.
4. 각 규칙 뒤에 그것이 지켜졌는지 확인할 수 있는 검증 문장을 괄호로 붙입니다.

출력 형식 (아래 두 제목과 형식을 그대로 지키고, 다른 설명은 쓰지 마세요):
DIFFERENCES
- 잘된 예에서는 … / 안 된 예에서는 …

RULES
- 규칙 문장 (검증: 확인 문장)
- 규칙 문장 (검증: 확인 문장)

규칙은 최대 5개, 한 줄에 하나씩 씁니다. 답변 언어: 한국어.`;
  }

  return `You are an analyst who extracts rules from experience. Compare the case that went well with the case that did not, and keep only the decisions that split the two outcomes, written so they can be reused next time. No generic advice, no textbook sentences.

[WORK SYSTEM]
Name: ${name}
Purpose: ${pick(system.purpose, "en")}
Goal: ${pick(system.goal, "en")}
Constraints: ${pick(system.constraints, "en")}
Success criteria:
${successLines(system, "en").map((line) => `- ${line}`).join("\n") || "-"}

[EXISTING RULES]
${existing}

[CASE THAT WENT WELL]
${good || "(paste the real case that went well here)"}

[CASE THAT DID NOT]
${bad || "(paste the real case that did not here)"}

[WHAT I ALREADY KNOW DIFFERED]
${focus || "(empty. If empty, find the difference from the two cases yourself.)"}

Steps:
1. Find the three to five decisions that split the two outcomes. Write each as "in the good case …, in the bad case …".
2. Turn each decision into one sentence that can be followed next time. Use an observable action; never "paid more attention" or "did it better".
3. Drop anything that repeats an existing rule. Keep only new rules.
4. After each rule, add a parenthesised check that shows whether it was followed.

Output format (keep these two headings and nothing else):
DIFFERENCES
- In the good case … / in the bad case …

RULES
- Rule sentence (Check: how to verify)
- Rule sentence (Check: how to verify)

At most five rules, one per line. Reply in English.`;
}

const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+/;
const HEADER = /^\s*(?:#{1,6}\s*)?(?:DIFFERENCES|RULES|VERDICT|NOTES|검증|판정|차이|규칙)\s*:?\s*$/i;

const cleanRule = (raw: string): string => {
  let text = raw.replace(BULLET, "").trim();
  text = text.replace(/\*\*/g, "").replace(/^["'“”‘’]|["'“”‘’]$/g, "").trim();
  text = text.replace(/\s*[（(]\s*(?:검증|확인|check)[^)）]*[)）]\s*$/i, "").trim();
  text = text.replace(/\s*[—–-]\s*(?:검증|확인|check)\s*:.*$/i, "").trim();
  return text;
};

/**
 * Reads the AI answer and returns one rule per line.
 * With a RULES heading it takes that section; without one it takes every bullet line.
 */
export function parseRuleCandidates(answer: string): string[] {
  const rows = answer.replace(/\r\n/g, "\n").split("\n");
  const markerIndex = rows.findIndex((line) => /^\s*(?:#{1,6}\s*)?(?:RULES|규칙)\s*:?\s*$/i.test(line));
  let scope = rows;
  if (markerIndex >= 0) {
    scope = [];
    for (let i = markerIndex + 1; i < rows.length; i += 1) {
      const line = rows[i];
      if (HEADER.test(line) && !/^\s*(?:#{1,6}\s*)?(?:RULES|규칙)\s*:?\s*$/i.test(line)) break;
      scope.push(line);
    }
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of scope) {
    if (!BULLET.test(line)) continue;
    const text = cleanRule(line);
    if (text.length < 4) continue;
    const key = text.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= 12) break;
  }
  return out;
}

/** A rough category guess so the user does not start from "structure" every time. */
export function guessCategory(text: string): "structure" | "tone" | "trust" | "verification" | "revenue" | "ops" {
  const value = text.toLowerCase();
  if (/(가격|견적|매출|마진|할인|price|quote|revenue|margin|discount|refund|환불)/.test(value)) return "revenue";
  if (/(확인|검증|체크|테스트|근거|출처|verify|check|test|source|evidence)/.test(value)) return "verification";
  if (/(문장|톤|말투|표현|문구|단어|tone|wording|sentence|voice)/.test(value)) return "tone";
  if (/(먼저|순서|구조|첫|마지막|섹션|목차|order|structure|first|last|section)/.test(value)) return "structure";
  if (/(기록|일정|보고|회의|발송|배포|log|schedule|report|meeting|send|release)/.test(value)) return "ops";
  return "structure";
}
