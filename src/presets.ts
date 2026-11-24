import type { Bi, Perspective, Rule, RuleCategory, Verdict, WorkSystem } from "./types";

export const perspectives: Perspective[] = ["customer", "finance", "competition", "build"];

export const baseChecks: Record<Perspective, Bi[]> = {
  customer: [
    {
      ko: "이 결과물이 해결하는 문제를 고객의 말로 한 문장에 쓸 수 있는가?",
      en: "Can the problem this solves be written in one sentence in the customer's words?",
    },
    {
      ko: "돈이나 시간을 지불할 이유가 결과물 안에 보이는가?",
      en: "Is the reason to pay money or time visible inside the result?",
    },
    {
      ko: "첫 화면이나 첫 문장에서 무엇을 얻는지 10초 안에 이해되는가?",
      en: "Does the first screen or sentence show the gain within ten seconds?",
    },
    {
      ko: "도입 전에 필요한 결심(결제, 승인, 정보 제공)이 몇 단계인가?",
      en: "How many commitments stand before adoption: payment, approval, information?",
    },
    {
      ko: "지금 쓰는 방식과 비교해 바꿀 만큼의 차이가 있는가?",
      en: "Is the difference from the current way enough to switch?",
    },
    {
      ko: "쓰고 난 뒤 남는 것(기록, 절감, 결과물)이 있는가?",
      en: "Does something remain afterwards: a record, time saved, an artifact?",
    },
  ],
  finance: [
    {
      ko: "매출과 비용을 같은 단위와 기간으로 계산했는가?",
      en: "Are revenue and cost calculated in the same unit and period?",
    },
    {
      ko: "매출이 0일 때 버틸 수 있는 기간은 얼마인가?",
      en: "How long can this run with zero revenue?",
    },
    {
      ko: "건당 마진이 규모가 커져도 유지되는가?",
      en: "Does unit margin hold as volume grows?",
    },
    {
      ko: "숨은 비용(운영, 응대, 수수료, 세금)을 넣었는가?",
      en: "Are the hidden costs included: operations, support, fees, tax?",
    },
    {
      ko: "여기 쓰는 시간의 기회비용을 계산했는가?",
      en: "Is the opportunity cost of the hours calculated?",
    },
    {
      ko: "그만둘 기준(얼마에서 중단할지)을 정했는가?",
      en: "Is there a stop line: the number at which this ends?",
    },
  ],
  competition: [
    {
      ko: "고객이 지금 쓰는 대안 세 가지를 이름으로 적었는가?",
      en: "Are the three alternatives the customer uses today named?",
    },
    {
      ko: "우리가 더 잘하는 한 가지를 한 문장으로 말할 수 있는가?",
      en: "Can the one thing done better be said in one sentence?",
    },
    {
      ko: "그 차이가 3개월 안에 복제될 수 있는가?",
      en: "Could that difference be copied within three months?",
    },
    {
      ko: "경쟁사가 가격을 절반으로 내리면 무엇이 남는가?",
      en: "If a competitor halved the price, what would remain?",
    },
    {
      ko: "유통이나 채널에서 우리가 불리한 지점은 무엇인가?",
      en: "Where are we weak in distribution or channel?",
    },
    {
      ko: "이 시장에서 이기지 못할 때 무엇을 배우고 나올지 정했는가?",
      en: "If this market cannot be won, what is learned on the way out?",
    },
  ],
  build: [
    {
      ko: "이번 범위에서 만들 수 없는 부분을 먼저 표시했는가?",
      en: "Are the parts that cannot be built in this scope marked first?",
    },
    {
      ko: "개인정보, 결제, 약관 중 확인이 필요한 항목은 무엇인가?",
      en: "Which privacy, payment or contract items need checking?",
    },
    {
      ko: "실패했을 때 사용자가 겪는 상태(오류, 환불, 중복)를 정의했는가?",
      en: "Are the failure states defined: error, refund, duplicate?",
    },
    {
      ko: "외부 API나 스토어 정책에 의존하는 부분과 대안은 무엇인가?",
      en: "Which parts depend on an external API or store policy, and what is the fallback?",
    },
    {
      ko: "운영 중 누가 무엇을 모니터링하는가?",
      en: "Who monitors what while this runs?",
    },
    {
      ko: "출시 후 되돌리는 방법(롤백, 공지)이 있는가?",
      en: "Is there a way back after launch: rollback, notice?",
    },
  ],
};

/** Two preset-specific checks per perspective, appended after the base six. */
const extraChecks: Record<string, Record<Perspective, Bi[]>> = {
  b2b: {
    customer: [
      { ko: "상대사 담당자가 상사에게 그대로 보고할 수 있는 문장이 있는가?", en: "Is there a sentence the contact can forward to their boss unchanged?" },
      { ko: "우리가 얻는 것이 아니라 상대사가 얻는 것 중심으로 쓰였는가?", en: "Is it written around what they gain rather than what we gain?" },
    ],
    finance: [
      { ko: "이 제휴가 우리 매출로 이어지는 경로를 세 단계로 설명할 수 있는가?", en: "Can the path from this partnership to our revenue be told in three steps?" },
      { ko: "상대사 정산 주기와 우리 현금 흐름이 맞는가?", en: "Do their settlement cycle and our cash flow line up?" },
    ],
    competition: [
      { ko: "상대사가 지금 다른 곳과 하는 제휴를 끊을 이유가 있는가?", en: "Is there a reason to end the partnership they already have?" },
      { ko: "경쟁 제안이 더 싸다면 우리가 방어할 근거는 무엇인가?", en: "If a rival proposal is cheaper, what defends ours?" },
    ],
    build: [
      { ko: "상대사 시스템과 연동이 필요한가, 수동 운영으로 시작할 수 있는가?", en: "Does it need integration, or can it start with manual operations?" },
      { ko: "계약서의 정산, 해지, 데이터 조항을 확인했는가?", en: "Are the settlement, termination and data clauses checked?" },
    ],
  },
  prd: {
    customer: [
      { ko: "이 기능이 없을 때의 불편을 직접 재현해 보았는가?", en: "Has the inconvenience of not having this feature been reproduced?" },
      { ko: "빈 상태와 첫 사용에서 무엇을 해야 하는지 화면이 말해 주는가?", en: "Do the empty and first-use states say what to do?" },
    ],
    finance: [
      { ko: "이 기능이 매출과 유지율 중 무엇을 움직이는지 숫자로 말할 수 있는가?", en: "Can it be said in numbers which of revenue or retention this moves?" },
      { ko: "개발과 QA에 드는 시간이 기대 효과보다 크지 않은가?", en: "Is the build and QA time smaller than the expected effect?" },
    ],
    competition: [
      { ko: "경쟁 서비스가 이미 더 단순하게 해결한 문제인가?", en: "Has a competitor already solved this more simply?" },
      { ko: "이 기능이 없어서 이탈한 사용자가 실제로 있는가?", en: "Are there real users who left because this was missing?" },
    ],
    build: [
      { ko: "예외를 포함한 상태 전이도를 그렸는가?", en: "Is there a state diagram that includes the exceptions?" },
      { ko: "정책이 바뀔 때 기존 데이터를 옮기는 계획이 있는가?", en: "Is there a migration plan for existing data when the policy changes?" },
    ],
  },
  solo: {
    customer: [
      { ko: "첫 30초에 무엇을 하는 제품인지 보이는가?", en: "Do the first 30 seconds show what the product does?" },
      { ko: "무료로 써 본 뒤 결제할 이유가 명확한가?", en: "After a free try, is the reason to pay clear?" },
    ],
    finance: [
      { ko: "가격에 결제 수수료, 세금, 환불을 반영했는가?", en: "Does the price account for fees, tax and refunds?" },
      { ko: "서버와 도구 비용이 매출을 넘지 않는가?", en: "Do server and tool costs stay under revenue?" },
    ],
    competition: [
      { ko: "같은 문제를 해결하는 무료 도구가 있는가?", en: "Is there a free tool solving the same problem?" },
      { ko: "한 문장으로 설명했을 때 기억에 남는가?", en: "Does one sentence about it stay in memory?" },
    ],
    build: [
      { ko: "결제 후 파일과 접근 권한이 자동으로 전달되는가?", en: "After payment, are the file and access delivered automatically?" },
      { ko: "개인정보 처리방침과 환불 정책이 준비되었는가?", en: "Are the privacy and refund policies ready?" },
    ],
  },
};

export function checksFor(presetKey: string | null, perspective: Perspective): Bi[] {
  const extra = presetKey && extraChecks[presetKey] ? extraChecks[presetKey][perspective] : [];
  return [...baseChecks[perspective], ...extra];
}

export function checkId(presetKey: string | null, perspective: Perspective, index: number): string {
  const base = baseChecks[perspective].length;
  return index < base ? `${perspective}-b${index}` : `${perspective}-x${presetKey || "custom"}-${index - base}`;
}

export function checkText(
  presetKey: string | null,
  perspective: Perspective,
  id: string,
): Bi | undefined {
  const list = checksFor(presetKey, perspective);
  for (let i = 0; i < list.length; i += 1) {
    if (checkId(presetKey, perspective, i) === id) return list[i];
  }
  return undefined;
}

type PresetRule = { ko: string; en: string; category: RuleCategory };

interface PresetDef {
  key: string;
  name: Bi;
  purpose: Bi;
  goal: Bi;
  background: Bi;
  constraints: Bi;
  success: Bi;
  rules: PresetRule[];
  sample: { checked: string[]; verdict: Verdict; notes: Bi };
}

const presets: PresetDef[] = [
  {
    key: "b2b",
    name: { ko: "B2B 제휴 사업개발", en: "B2B partnership development" },
    purpose: {
      ko: "제안서가 다음 미팅을 부르게 만드는 반복 절차",
      en: "A repeatable process that makes a proposal earn the next meeting",
    },
    goal: {
      ko: "상대사 구매 담당자가 1차 검토에서 다음 미팅을 요청하는 제휴 제안서를 만든다.",
      en: "Produce a partnership proposal that makes the buyer's review lead ask for a second meeting.",
    },
    background: {
      ko: "모바일 상품권을 기업 복지, 프로모션 채널에 공급한다. 제안 대상은 유통사 MD, 복지 플랫폼 기획자, 브랜드 마케터다. 기존 제안서는 기능 나열로 시작해 가격 협상 단계에서 막히는 경우가 많았다. 상대사는 대체로 우리보다 규모가 크고, 내부 승인선이 팀장과 본부장 두 단계다.",
      en: "We supply mobile gift cards into corporate benefit and promotion channels. The audience is retail MDs, benefit platform planners and brand marketers. Past proposals opened with a feature list and stalled at price. The counterpart is usually larger than us, with two approval layers: team lead and division head.",
    },
    constraints: {
      ko: "제안서는 A4 5장 이내. 1장 요약 필수. 가격은 범위 합의 전에 꺼내지 않는다. 확인되지 않은 수치를 쓰지 않는다. 상대사 내부 자료는 받은 범위 밖으로 쓰지 않는다.",
      en: "Five A4 pages maximum. One summary page required. No price before scope is agreed. No unverified numbers. Their internal material is used only within the agreed scope.",
    },
    success: {
      ko: "3일 이내 회신\n다음 미팅 또는 파일럿 제안 요청\n상대사가 자기 언어로 문제를 다시 말함\n가격 논의 전에 범위 합의",
      en: "Reply within three days\nA next meeting or a pilot request\nThey restate the problem in their own words\nScope agreed before price",
    },
    rules: [
      { ko: "첫 장은 상대사가 지금 잃고 있는 돈이나 시간을 한 줄로 쓴다.", en: "Page one states, in one line, the money or time they are losing now.", category: "structure" },
      { ko: "우리 제품 설명은 2페이지 이후에만 넣는다.", en: "Our product description appears only after page two.", category: "structure" },
      { ko: "경쟁사 이름은 비교표에만 쓰고 본문에서 평가하지 않는다.", en: "Competitor names appear only in the comparison table, never judged in prose.", category: "tone" },
      { ko: "모든 수치에는 출처와 기준 시점을 붙인다.", en: "Every number carries its source and reference date.", category: "trust" },
      { ko: "상대사 내부 승인자를 적고, 그 사람이 물을 질문 세 개를 미리 답한다.", en: "Name their internal approvers and answer the three questions they will ask.", category: "verification" },
      { ko: "가격은 범위 합의 뒤에, 최소 두 가지 옵션으로 제시한다.", en: "Present price after scope agreement, with at least two options.", category: "revenue" },
      { ko: "미팅 후 24시간 안에 합의, 미합의, 다음 단계를 한 장으로 보낸다.", en: "Within 24 hours of a meeting, send one page: agreed, not agreed, next step.", category: "ops" },
    ],
    sample: {
      checked: [
        "customer-b0", "customer-b1", "customer-b3", "customer-b5",
        "finance-b0", "finance-b1", "finance-b3",
        "competition-b0", "competition-b1",
        "build-b0", "build-b1", "build-b2",
        "customer-xb2b-0", "finance-xb2b-1",
      ],
      verdict: "conditional",
      notes: {
        ko: "상대사 정산 주기가 60일이라 파일럿 현금 흐름을 다시 계산해야 한다. 가격표는 범위 합의 뒤로 미룸. 다음 미팅에서 물류비 부담 주체를 확인.",
        en: "Their 60-day settlement means recalculating pilot cash flow. Price table moved after scope agreement. Confirm who carries logistics cost at the next meeting.",
      },
    },
  },
  {
    key: "prd",
    name: { ko: "신규 기능 PRD와 QA", en: "Feature PRD and QA" },
    purpose: {
      ko: "기획 의도가 구현과 QA에서 흐려지지 않게 하는 명세 절차",
      en: "A specification process that keeps intent intact through build and QA",
    },
    goal: {
      ko: "개발 착수 전에 예외 상태와 승인 기준이 합의된 PRD를 만들고, QA에서 같은 이슈가 두 번 나오지 않게 한다.",
      en: "Agree the edge states and acceptance criteria before build starts, so the same issue never appears twice in QA.",
    },
    background: {
      ko: "모바일 상품권의 교환, 환불처럼 상태가 많은 기능은 화면 정의만으로는 부족하다. 과거에는 부분 사용, 만료 임박, 중복 결제 같은 정책 예외가 QA 단계에서야 드러났고, 그때마다 일정이 밀렸다. 개발자와 QA가 서로 다른 문서를 보는 것도 반복되는 원인이었다.",
      en: "State-heavy features such as gift-card exchange and refund cannot be specified by screens alone. Policy edges like partial use, near expiry and duplicate payment surfaced only in QA, and each one moved the date. Different documents for developers and QA caused repeats as well.",
    },
    constraints: {
      ko: "Jira 티켓 하나는 검증 가능한 동작 하나만 담는다. 정책 변경은 PM 승인. QA 체크리스트는 개발자와 QA가 같은 문서를 본다. 출시일이 고정되면 범위를 줄이고 날짜를 옮기지 않는다.",
      en: "One Jira ticket carries one testable behaviour. Policy changes need PM approval. Developers and QA read the same checklist. If the date is fixed, cut scope; do not move the date.",
    },
    success: {
      ko: "개발 착수 후 요구사항 변경 2건 이하\n정책 오해로 인한 QA 재작업 0건\n배포 후 48시간 내 관련 문의 감소\n예외 상태가 모두 표에 있음",
      en: "Two or fewer requirement changes after build starts\nZero QA rework caused by policy misreading\nFewer related tickets within 48 hours of release\nEvery edge state present in the table",
    },
    rules: [
      { ko: "모든 요구사항에 완료 조건과 실패 시 동작을 함께 쓴다.", en: "Every requirement states its acceptance criteria and its behaviour on failure.", category: "structure" },
      { ko: "예외 상태(빈 값, 만료, 중복, 권한 없음)를 표로 먼저 채운다.", en: "Fill the edge-state table first: empty, expired, duplicate, unauthorized.", category: "structure" },
      { ko: "정책 결정이 필요한 항목은 미결로 표시하고 담당자를 적는다.", en: "Mark policy decisions as open with an owner.", category: "verification" },
      { ko: "QA 티켓은 재현 절차, 기대 결과, 실제 결과 세 칸을 비우지 않는다.", en: "A QA ticket never leaves blank: steps, expected, actual.", category: "ops" },
      { ko: "화면 문구는 확정 전 별도 표에 모아 한 번에 검수한다.", en: "Collect UI copy in one table and review it in a single pass.", category: "tone" },
      { ko: "회귀 테스트 범위는 기능 목록이 아니라 상태 전이로 정한다.", en: "Scope regression tests by state transitions, not by feature list.", category: "verification" },
      { ko: "배포 후 48시간 안에 로그와 문의를 보고 규칙을 갱신한다.", en: "Within 48 hours of release, read logs and tickets and update the rules.", category: "ops" },
    ],
    sample: {
      checked: [
        "customer-b0", "customer-b1", "customer-b2", "customer-b4",
        "finance-b0", "finance-b3", "finance-b4",
        "competition-b0", "competition-b2",
        "build-b0", "build-b1", "build-b2", "build-b3",
        "build-xprd-0", "build-xprd-1",
      ],
      verdict: "pass",
      notes: {
        ko: "만료 임박 상품의 부분 사용 정책은 미결. 담당자는 정책팀 김OO. 상태 전이도는 다음 회의 전까지 첨부하기로 함.",
        en: "Partial use of near-expiry cards is still open; owner is the policy team. The state diagram will be attached before the next meeting.",
      },
    },
  },
  {
    key: "solo",
    name: { ko: "1인 프로덕트 런칭", en: "Solo product launch" },
    purpose: {
      ko: "혼자 만들어도 출시, 판매, 개선이 끊기지 않게 하는 절차",
      en: "A process that keeps launch, sale and improvement moving when one person does it all",
    },
    goal: {
      ko: "2주 안에 판매 가능한 최소 버전을 공개하고, 첫 10명의 반응으로 다음 버전을 정한다.",
      en: "Publish a sellable minimum within two weeks and let the first ten responses decide the next version.",
    },
    background: {
      ko: "1인 개발자는 제작 시간이 길어지고 홍보는 마지막에 몰아서 한다. 그래서 출시해도 아무도 보지 못한 채 다음 프로젝트로 넘어가기 쉽다. 결제와 배포는 외부 스토어를 쓰고 서버 비용은 0원으로 유지한다.",
      en: "Solo builders spend long on the build and save promotion for the end, so a launch passes unseen and the next project begins. Payment and hosting stay on external stores, with zero server cost.",
    },
    constraints: {
      ko: "서버비 0원. 결제는 외부 스토어만 사용. 하루 제작 시간 2시간. 기능은 3개를 넘기지 않는다. 법적 문제가 없는지 확인한 뒤 공개한다.",
      en: "Zero server cost. External stores only. Two hours of build time per day. No more than three features. Check for legal issues before publishing.",
    },
    success: {
      ko: "공개 후 7일 내 방문 300, 구매 3\n첫 구매자 피드백 3건\n다음 버전 항목이 사용자 요청에서 나옴",
      en: "300 visits and 3 purchases within seven days\nFeedback from the first three buyers\nNext-version items drawn from user requests",
    },
    rules: [
      { ko: "만들기 전에 판매 페이지 문구를 먼저 쓴다.", en: "Write the sales page copy before building.", category: "structure" },
      { ko: "데모는 3단계 안에 가치가 보이게 만든다.", en: "The demo shows value within three steps.", category: "structure" },
      { ko: "결제, 다운로드, 사용까지 한 번에 이어지는지 직접 시험한다.", en: "Test payment, download and use end to end yourself.", category: "verification" },
      { ko: "출시일을 먼저 정하고 기능은 그 날짜에 맞춰 자른다.", en: "Set the date first and cut features to fit it.", category: "ops" },
      { ko: "홍보 문구는 기능이 아니라 사용자가 얻는 결과로 쓴다.", en: "Promotion copy sells the outcome, not the feature list.", category: "tone" },
      { ko: "구매자에게는 첫 24시간 안에 개인 회신을 보낸다.", en: "Reply personally to each buyer within 24 hours.", category: "ops" },
      { ko: "매주 가격, 문구, 전환을 한 줄씩 기록한다.", en: "Record price, copy and conversion in one line each week.", category: "revenue" },
    ],
    sample: {
      checked: [
        "customer-b0", "customer-b1", "customer-b2", "customer-b3", "customer-b5",
        "finance-b0", "finance-b2", "finance-b3",
        "competition-b0", "competition-b1",
        "build-b0", "build-b1", "build-b2", "build-b5",
        "build-xsolo-1",
      ],
      verdict: "conditional",
      notes: {
        ko: "환불 정책 문구가 아직 없다. 결제 후 자동 전달은 스토어 기본 기능으로 확인. 출시일은 금요일로 고정하고 부가 기능은 다음 버전으로 넘김.",
        en: "Refund policy copy is missing. Automatic delivery after payment is handled by the store default. Launch date fixed to Friday; extras move to the next version.",
      },
    },
  },
];

export function presetList(): PresetDef[] {
  return presets;
}

export function presetMeta(key: string): { name: Bi; purpose: Bi } | undefined {
  const preset = presets.find((p) => p.key === key);
  return preset ? { name: preset.name, purpose: preset.purpose } : undefined;
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
}

function ruleFrom(presetKey: string, rule: PresetRule, index: number, now: number): Rule {
  return {
    id: uid("rule"),
    text: { ko: rule.ko, en: rule.en },
    category: rule.category,
    active: true,
    version: 1,
    note: { ko: "", en: "" },
    verified: index % 3 === 0 ? 2 : index % 2 === 0 ? 1 : 0,
    createdAt: now - (presets.findIndex((p) => p.key === presetKey) + 1) * 86400000,
    versions: [],
  };
}

export function systemFromPreset(key: string, now = Date.now()): WorkSystem {
  const preset = presets.find((p) => p.key === key) ?? presets[0];
  const created = now - 3 * 86400000;
  return {
    id: uid("sys"),
    name: { ...preset.name },
    purpose: { ...preset.purpose },
    goal: { ...preset.goal },
    background: { ...preset.background },
    constraints: { ...preset.constraints },
    success: { ...preset.success },
    delegation: "approve",
    rules: preset.rules.map((rule, index) => ruleFrom(preset.key, rule, index, now)),
    runs: [
      {
        id: uid("run"),
        at: now - 86400000,
        checked: [...preset.sample.checked],
        notes: { ...preset.sample.notes },
        verdict: preset.sample.verdict,
        source: "manual",
      },
    ],
    patterns: { good: { ko: "", en: "" }, bad: { ko: "", en: "" }, focus: { ko: "", en: "" }, extracted: { ko: "", en: "" } },
    evaluations: [],
    sim: { minutesPerTask: preset.key === "prd" ? 90 : preset.key === "b2b" ? 120 : 60, repeatsPerMonth: 2, savingsRate: 35 },
    presetKey: preset.key,
    createdAt: created,
    updatedAt: now - 3600000,
  };
}

export function blankSystem(locale: "ko" | "en", now = Date.now()): WorkSystem {
  const name = locale === "ko" ? "이름 없는 시스템" : "Untitled system";
  return {
    id: uid("sys"),
    name: { ko: locale === "ko" ? name : "", en: locale === "en" ? name : "" },
    purpose: { ko: "", en: "" },
    goal: { ko: "", en: "" },
    background: { ko: "", en: "" },
    constraints: { ko: "", en: "" },
    success: { ko: "", en: "" },
    delegation: "approve",
    rules: [],
    runs: [],
    patterns: { good: { ko: "", en: "" }, bad: { ko: "", en: "" }, focus: { ko: "", en: "" }, extracted: { ko: "", en: "" } },
    evaluations: [],
    sim: { minutesPerTask: 60, repeatsPerMonth: 1, savingsRate: 30 },
    presetKey: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function duplicateSystem(source: WorkSystem, locale: "ko" | "en", now = Date.now()): WorkSystem {
  const suffix = locale === "ko" ? " 복제" : " copy";
  const copyName: Bi = {
    ko: `${source.name.ko || source.name.en}${locale === "ko" ? suffix : ""}`,
    en: `${source.name.en || source.name.ko}${locale === "en" ? suffix : ""}`,
  };
  return {
    ...structuredClone(source),
    id: uid("sys"),
    name: copyName,
    runs: [],
    evaluations: [],
    presetKey: source.presetKey,
    createdAt: now,
    updatedAt: now,
  };
}
