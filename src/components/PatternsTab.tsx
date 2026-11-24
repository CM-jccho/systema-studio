import { useEffect, useMemo, useState } from "react";
import type { Bi, Locale, Rule, RuleCategory, WorkSystem } from "../types";
import { copy as copyTable, pick } from "../i18n";
import { buildPatternPrompt, guessCategory, parseRuleCandidates } from "../patterns";
import { copyText } from "../utils";
import { Field, Icon, TextArea } from "./ui";

interface Props {
  system: WorkSystem;
  locale: Locale;
  onChange: (patch: Partial<WorkSystem>) => void;
  onAddRules: (rules: Rule[]) => void;
  notify: (message: string) => void;
}

const categories: RuleCategory[] = ["structure", "tone", "trust", "verification", "revenue", "ops"];

const key = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();

const bi = (locale: Locale, text: string): Bi =>
  locale === "ko" ? { ko: text, en: "" } : { ko: "", en: text };

/** Level 2: compare the case that worked with the one that did not, then keep the rules. */
export function PatternsTab({ system, locale, onChange, onAddRules, notify }: Props) {
  const c = copyTable[locale];
  const patterns = system.patterns;
  const good = pick(patterns.good, locale);
  const bad = pick(patterns.bad, locale);
  const extracted = pick(patterns.extracted, locale);

  const prompt = useMemo(() => buildPatternPrompt(system, locale, patterns), [system, locale, patterns]);
  const ready = good.trim().length > 0 && bad.trim().length > 0;

  const candidates = useMemo(() => parseRuleCandidates(extracted), [extracted]);
  const existing = useMemo(
    () => new Set(system.rules.map((rule) => key(pick(rule.text, locale)))),
    [system.rules, locale],
  );

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [edits, setEdits] = useState<Record<number, { text: string; category: RuleCategory }>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    const fresh = new Set<number>();
    candidates.forEach((text, index) => {
      if (!existing.has(key(text))) fresh.add(index);
    });
    setSelected(fresh);
    setEdits({});
    setError("");
    // the AI answer is the source of the candidate list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extracted]);

  const setField = (field: "good" | "bad" | "focus" | "extracted", value: string) => {
    onChange({ patterns: { ...patterns, [field]: { ...patterns[field], [locale]: value } } });
  };

  const copyPrompt = async () => {
    const ok = await copyText(prompt);
    notify(ok ? c.patterns.copiedPrompt : c.app.cancel);
  };

  const textOf = (index: number, fallback: string) => edits[index]?.text ?? fallback;
  const categoryOf = (index: number, fallback: string) => edits[index]?.category ?? guessCategory(fallback);

  const addSelected = () => {
    const chosen = candidates
      .map((text, index) => ({ text, index }))
      .filter(({ text, index }) => selected.has(index) && !existing.has(key(text)))
      .map(({ text, index }) => ({
        text: textOf(index, text).trim(),
        category: categoryOf(index, text),
      }))
      .filter((item) => item.text.length > 0);

    if (!chosen.length) {
      setError(c.patterns.needSelect);
      return;
    }
    onAddRules(
      chosen.map((item) => ({
        id: `rule_${Math.random().toString(36).slice(2, 9)}`,
        text: bi(locale, item.text),
        category: item.category,
        active: true,
        version: 1,
        note: { ko: "", en: "" },
        verified: 0,
        createdAt: Date.now(),
        versions: [],
      })),
    );
    setSelected(new Set());
    setError("");
    notify(`${c.patterns.added} ${chosen.length}`);
  };

  const toggle = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
    setError("");
  };

  const freshCount = candidates.filter((text) => !existing.has(key(text))).length;

  return (
    <div className="stack stack-wide">
      <div className="section-intro">
        <h2>{c.patterns.title}</h2>
        <p>{c.patterns.intro}</p>
      </div>

      <div className="pattern-grid">
        <Field label={c.patterns.goodLabel} hint={c.patterns.goodHint} htmlFor="pattern-good">
          <TextArea
            id="pattern-good"
            value={good}
            onChange={(value) => setField("good", value)}
            placeholder={c.patterns.goodPlaceholder}
            rows={6}
          />
        </Field>
        <Field label={c.patterns.badLabel} hint={c.patterns.badHint} htmlFor="pattern-bad">
          <TextArea
            id="pattern-bad"
            value={bad}
            onChange={(value) => setField("bad", value)}
            placeholder={c.patterns.badPlaceholder}
            rows={6}
          />
        </Field>
      </div>

      <Field label={c.patterns.focusLabel} hint={c.patterns.focusHint} htmlFor="pattern-focus">
        <TextArea
          id="pattern-focus"
          value={pick(patterns.focus, locale)}
          onChange={(value) => setField("focus", value)}
          placeholder={c.patterns.focusPlaceholder}
          rows={2}
        />
      </Field>

      <section className="prompt-section" aria-labelledby="pattern-prompt-title">
        <div className="preview-head">
          <h3 id="pattern-prompt-title">{c.patterns.promptTitle}</h3>
          <span className="field-count">
            {prompt.split(/\s+/).filter(Boolean).length} {c.exportTab.words}
          </span>
        </div>
        <p className="section-note">{c.patterns.promptHint}</p>
        <pre className="prompt-box tall pattern-prompt" tabIndex={0}>
          {prompt}
        </pre>
        <div className="prompt-actions">
          <button type="button" className="btn" onClick={copyPrompt} disabled={!ready}>
            <Icon name="copy" />
            {c.patterns.copyPrompt}
          </button>
          {!ready ? <span className="muted-line">{c.patterns.needBoth}</span> : null}
        </div>
      </section>

      <Field label={c.patterns.answerLabel} hint={c.patterns.answerHint} htmlFor="pattern-answer">
        <TextArea
          id="pattern-answer"
          value={extracted}
          onChange={(value) => setField("extracted", value)}
          placeholder={c.patterns.answerPlaceholder}
          rows={5}
        />
      </Field>

      <section className="candidate-section" aria-labelledby="pattern-candidates-title">
        <div className="preview-head">
          <h3 id="pattern-candidates-title">{c.patterns.candidates}</h3>
          <span className="field-count">
            {freshCount}
            {locale === "ko" ? "개" : ""} {c.patterns.newRules}
          </span>
        </div>

        {!candidates.length ? (
          <p className="muted-line">{c.patterns.noCandidates}</p>
        ) : (
          <>
            <div className="candidate-toolbar">
              <button
                type="button"
                className="link-btn"
                onClick={() =>
                  setSelected(new Set(candidates.map((_text, index) => index).filter((index) => !existing.has(key(candidates[index])))))
                }
              >
                {c.patterns.selectAll}
              </button>
              <button type="button" className="link-btn" onClick={() => setSelected(new Set())}>
                {c.patterns.clearAll}
              </button>
            </div>
            <ol className="candidate-list">
              {candidates.map((text, index) => {
                const duplicate = existing.has(key(text));
                return (
                  <li key={`${index}-${text}`} className={`candidate${duplicate ? " is-duplicate" : ""}`}>
                    <label className="check candidate-check">
                      <input
                        type="checkbox"
                        checked={!duplicate && selected.has(index)}
                        disabled={duplicate}
                        onChange={() => toggle(index)}
                        aria-label={`${c.patterns.candidates} ${index + 1}`}
                      />
                    </label>
                    <div className="candidate-body">
                      <div className="candidate-line">
                        <input
                          className="input"
                          value={textOf(index, text)}
                          aria-label={`${c.patterns.candidates} ${index + 1}`}
                          onChange={(event) =>
                            setEdits({
                              ...edits,
                              [index]: { text: event.target.value, category: categoryOf(index, text) },
                            })
                          }
                        />
                        <select
                          className="select select-sm"
                          aria-label={c.patterns.category}
                          value={categoryOf(index, text)}
                          onChange={(event) =>
                            setEdits({
                              ...edits,
                              [index]: { text: textOf(index, text), category: event.target.value as RuleCategory },
                            })
                          }
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {c.categories[category]}
                            </option>
                          ))}
                        </select>
                      </div>
                      {duplicate ? <span className="candidate-flag">{c.patterns.duplicate}</span> : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        )}

        <div className="candidate-actions">
          <button type="button" className="btn btn-primary" onClick={addSelected} disabled={!candidates.length}>
            <Icon name="plus" />
            {c.patterns.addSelected}
          </button>
          {error ? (
            <span className="error-line" role="alert">
              {error}
            </span>
          ) : null}
        </div>
      </section>
    </div>
  );
}
