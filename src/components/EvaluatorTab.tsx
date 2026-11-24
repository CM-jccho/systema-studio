import { useMemo, useState } from "react";
import type { Evaluation, Locale, Perspective, Verdict, WorkSystem } from "../types";
import { copy as copyTable, pick } from "../i18n";
import { checksFor, perspectives } from "../presets";
import { dateLabel } from "../mastery";
import { formatNumber } from "../utils";
import { TextArea } from "./ui";

interface Props {
  system: WorkSystem;
  locale: Locale;
  notify: (message: string) => void;
  onRecord: (evaluation: Evaluation) => void;
  onDelete: (id: string) => void;
}

type Group = "rule" | Perspective;
type Mark = "pass" | "fail";

interface RubricItem {
  id: string;
  group: Group;
  text: string;
}

const verdictOf = (score: number): Verdict => (score >= 90 ? "pass" : score >= 70 ? "conditional" : "rework");

const stamp = (at: number, locale: Locale): string => {
  const d = new Date(at);
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${dateLabel(at, locale)} ${time}`;
};

/** Level 3: score a real artifact item by item, then keep the trial history. */
export function EvaluatorTab({ system, locale, notify, onRecord, onDelete }: Props) {
  const c = copyTable[locale];

  const items = useMemo<RubricItem[]>(() => {
    const list: RubricItem[] = [];
    system.rules
      .filter((rule) => rule.active)
      .forEach((rule) => {
        list.push({ id: `rule:${rule.id}`, group: "rule", text: pick(rule.text, locale) });
      });
    perspectives.forEach((perspective) => {
      checksFor(system.presetKey, perspective).forEach((check, index) => {
        list.push({ id: `check:${perspective}:${index}`, group: perspective, text: pick(check, locale) });
      });
    });
    return list;
  }, [system.rules, system.presetKey, locale]);

  const rulesCount = items.filter((item) => item.group === "rule").length;

  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [filter, setFilter] = useState<"all" | Group>("all");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const visible = filter === "all" ? items : items.filter((item) => item.group === filter);

  const judged = items.filter((item) => Boolean(marks[item.id])).length;
  const passed = items.filter((item) => marks[item.id] === "pass").length;
  const failed = items.filter((item) => marks[item.id] === "fail").length;
  const score = items.length ? Math.round((passed / items.length) * 100) : 0;
  const verdict = verdictOf(score);

  const mark = (id: string, next: Mark) => {
    setMarks((prev) => {
      const copy = { ...prev };
      if (copy[id] === next) delete copy[id];
      else copy[id] = next;
      return copy;
    });
    setError("");
  };

  const markAll = () => {
    const next: Record<string, Mark> = {};
    items.forEach((item) => {
      next[item.id] = "pass";
    });
    setMarks(next);
    setError("");
  };

  const record = () => {
    if (!judged) {
      setError(c.evaluator.needJudge);
      return;
    }
    const note = { ko: "", en: "", [locale]: memo.trim() } as Evaluation["note"];
    onRecord({
      id: `eval_${Math.random().toString(36).slice(2, 9)}`,
      at: Date.now(),
      score,
      passed,
      failed,
      judged,
      total: items.length,
      verdict,
      note,
    });
    setError("");
    notify(c.evaluator.recorded);
  };

  const chronological = [...system.evaluations].sort((a, b) => a.at - b.at);
  const previousScore = new Map<string, number | null>();
  chronological.forEach((trial, index) => {
    previousScore.set(trial.id, index > 0 ? chronological[index - 1].score : null);
  });

  const chart = chronological.slice(-8);
  const history = [...system.evaluations].sort((a, b) => b.at - a.at);
  const latest = history[0] ?? null;

  const groupLabel = (group: Group): string =>
    group === "rule" ? c.evaluator.groupRules : c.redteam.perspectives[group];

  const filters: { key: "all" | Group; label: string; count: number }[] = [
    { key: "all", label: c.evaluator.filterAll, count: items.length },
    ...(rulesCount ? [{ key: "rule" as Group, label: c.evaluator.groupRules, count: rulesCount }] : []),
    ...perspectives.map((perspective) => ({
      key: perspective as Group,
      label: c.redteam.perspectives[perspective],
      count: items.filter((item) => item.group === perspective).length,
    })),
  ];

  return (
    <div className="stack stack-wide">
      <div className="section-intro">
        <h2>{c.evaluator.title}</h2>
        <p>{c.evaluator.intro}</p>
      </div>

      <div className="figures eval-figures">
        <div className="figure">
          <span className="figure-value eval-score">{score}%</span>
          <span className="figure-label">
            {judged ? `${c.evaluator.score}, ${c.verdicts[verdict]}` : c.evaluator.score}
          </span>
        </div>
        <div className="figure">
          <span className="figure-value">
            {passed}
            <span className="figure-of">/{formatNumber(items.length, locale)}</span>
          </span>
          <span className="figure-label">
            {c.evaluator.passed} {passed}, {c.evaluator.failed} {failed}
          </span>
        </div>
        <div className="figure">
          <span className="figure-value">
            {judged}
            <span className="figure-of">/{formatNumber(items.length, locale)}</span>
          </span>
          <span className="figure-label">{c.evaluator.judged}</span>
        </div>
      </div>

      {!judged && latest ? (
        <p className="muted-line eval-last">
          {c.evaluator.lastTrial} {latest.score}%, {stamp(latest.at, locale)}
        </p>
      ) : null}

      <p className="section-note">{c.evaluator.scoreRule}</p>

      <section className="eval-section" aria-labelledby="rubric-title">
        <div className="preview-head">
          <h3 id="rubric-title">{c.evaluator.rubricTitle}</h3>
          <span className="field-count">
            {judged} / {items.length}
          </span>
        </div>
        <p className="section-note">{c.evaluator.rubricHint}</p>

        <div className="filter-row" role="group" aria-label={c.evaluator.rubricTitle}>
          {filters.map((row) => (
            <button
              key={row.key}
              type="button"
              className={`filter${filter === row.key ? " is-on" : ""}`}
              aria-pressed={filter === row.key}
              onClick={() => setFilter(row.key)}
            >
              {row.label} <span className="filter-count">{row.count}</span>
            </button>
          ))}
        </div>

        {!rulesCount ? <p className="muted-line">{c.evaluator.noRules}</p> : null}

        <ol className="rubric-list">
          {visible.map((item) => {
            const value = marks[item.id];
            return (
              <li key={item.id} className={`rubric-row${value === "fail" ? " is-fail" : ""}`}>
                <p className="rubric-text">{item.text}</p>
                <div className="rubric-marks" role="group" aria-label={item.text}>
                  <button
                    type="button"
                    className={`mark mark-pass${value === "pass" ? " is-on" : ""}`}
                    aria-pressed={value === "pass"}
                    onClick={() => mark(item.id, "pass")}
                  >
                    {c.evaluator.pass}
                  </button>
                  <button
                    type="button"
                    className={`mark mark-fail${value === "fail" ? " is-on" : ""}`}
                    aria-pressed={value === "fail"}
                    onClick={() => mark(item.id, "fail")}
                  >
                    {c.evaluator.fail}
                  </button>
                </div>
                <span className="rubric-group">{groupLabel(item.group)}</span>
              </li>
            );
          })}
        </ol>

        <div className="candidate-actions">
          <button type="button" className="link-btn" onClick={markAll}>
            {c.evaluator.markAll}
          </button>
          <button type="button" className="link-btn" onClick={() => setMarks({})}>
            {c.evaluator.reset}
          </button>
        </div>
      </section>

      <section className="record-box eval-record" aria-labelledby="eval-memo-title">
        <div className="record-head">
          <h3 id="eval-memo-title">{c.evaluator.memoTitle}</h3>
          <p>{c.evaluator.memoHint}</p>
        </div>
        <TextArea value={memo} onChange={setMemo} rows={3} ariaLabel={c.evaluator.memoTitle} placeholder={c.evaluator.memoPlaceholder} />
        <div className="candidate-actions">
          <button type="button" className="btn btn-primary" onClick={record} disabled={!judged}>
            {c.evaluator.record}
          </button>
          <span className="muted-line">
            {c.evaluator.score} {score}%, {c.verdicts[verdict]}
          </span>
          {error ? (
            <span className="error-line" role="alert">
              {error}
            </span>
          ) : null}
        </div>
      </section>

      <section className="eval-section" aria-labelledby="trial-history-title">
        <div className="preview-head">
          <h3 id="trial-history-title">{c.evaluator.history}</h3>
          <span className="field-count">
            {history.length} {locale === "ko" ? "회" : "trials"}
          </span>
        </div>
        <p className="section-note">{c.evaluator.historyHint}</p>

        {!history.length ? (
          <p className="muted-line">{c.evaluator.noHistory}</p>
        ) : (
          <>
            <div className="trial-chart" role="img" aria-label={chart.map((trial) => `${dateLabel(trial.at, locale)} ${trial.score}%`).join(", ")}>
              {chart.map((trial) => (
                <div key={trial.id} className="trial-column">
                  <span className="trial-value">{trial.score}%</span>
                  <span className="trial-bar-track">
                    <span className="trial-bar" style={{ height: `${Math.max(trial.score, 2)}%` }} />
                  </span>
                  <span className="trial-date">{dateLabel(trial.at, locale)}</span>
                </div>
              ))}
            </div>

            <ol className="trial-list">
              {history.map((trial) => {
                const before = previousScore.get(trial.id) ?? null;
                const delta = before === null ? null : trial.score - before;
                return (
                  <li key={trial.id} className="trial-row">
                    <span className="trial-when">{stamp(trial.at, locale)}</span>
                    <span className="trial-score-cell">{trial.score}%</span>
                    <span className="trial-counts">
                      {c.evaluator.passed} {trial.passed} / {c.evaluator.failed} {trial.failed}
                    </span>
                    <span className={`trial-delta${delta === null ? " is-none" : delta > 0 ? " is-up" : delta < 0 ? " is-down" : ""}`}>
                      {delta === null ? c.evaluator.first : `${delta > 0 ? "+" : ""}${delta}%p`}
                    </span>
                    <span className="trial-note">{pick(trial.note, locale)}</span>
                    {confirmId === trial.id ? (
                      <span className="trial-actions">
                        <button type="button" className="meta-btn danger" onClick={() => { onDelete(trial.id); setConfirmId(null); }}>
                          {c.evaluator.confirm}
                        </button>
                        <button type="button" className="meta-btn" onClick={() => setConfirmId(null)}>
                          {c.app.cancel}
                        </button>
                      </span>
                    ) : (
                      <span className="trial-actions">
                        <button type="button" className="meta-btn" onClick={() => setConfirmId(trial.id)}>
                          {c.evaluator.delete}
                        </button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </section>
    </div>
  );
}
