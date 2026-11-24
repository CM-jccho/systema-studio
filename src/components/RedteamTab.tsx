import { useMemo, useRef, useState } from "react";
import type { Locale, Perspective, RedteamRun, Verdict, WorkSystem } from "../types";
import { copy as copyTable, pick } from "../i18n";
import { buildPerspectivePrompt, buildReviewPrompt } from "../export";
import { checkId, checksFor, perspectives } from "../presets";
import { runReview } from "../byok";
import { clearKeys, loadKeys, saveKeys } from "../storage";
import { copyText } from "../utils";
import { dateLabel, relativeDay } from "../mastery";
import { Icon, TextArea } from "./ui";

interface Props {
  system: WorkSystem;
  locale: Locale;
  onRun: (run: RedteamRun) => void;
  notify: (message: string) => void;
}

export function RedteamTab({ system, locale, onRun, notify }: Props) {
  const c = copyTable[locale];
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Perspective | null>(null);
  const [verdict, setVerdict] = useState<Verdict>("conditional");
  const [notes, setNotes] = useState("");
  const [recordError, setRecordError] = useState("");

  const stored = useRef(loadKeys());
  const [provider, setProvider] = useState(stored.current.provider);
  const [model, setModel] = useState(stored.current.model);
  const [key, setKey] = useState(stored.current[stored.current.provider]);
  const [remember, setRemember] = useState(false);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [runError, setRunError] = useState("");
  const [byokOpen, setByokOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const totalChecks = useMemo(
    () => perspectives.reduce((sum, p) => sum + checksFor(system.presetKey, p).length, 0),
    [system.presetKey],
  );

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setRecordError("");
  };

  const copyPrompt = async (perspective: Perspective) => {
    const ok = await copyText(buildPerspectivePrompt(system, locale, perspective));
    notify(ok ? c.redteam.copiedPrompt : c.app.cancel);
  };

  const record = () => {
    if (!checked.size) {
      setRecordError(c.redteam.needCheck);
      return;
    }
    onRun({
      id: `run_${Math.random().toString(36).slice(2, 9)}`,
      at: Date.now(),
      checked: [...checked],
      notes: { ko: "", en: "", [locale]: notes.trim() } as RedteamRun["notes"],
      verdict,
      source: "manual",
    });
    setChecked(new Set());
    setNotes("");
    setRecordError("");
    notify(c.redteam.recorded);
  };

  const switchProvider = (next: "openai" | "anthropic") => {
    setProvider(next);
    setKey(stored.current[next]);
    setModel(next === "openai" ? "gpt-4o-mini" : "claude-sonnet-4-5");
    setRunError("");
  };

  const execute = async () => {
    setRunError("");
    if (!key.trim()) {
      setRunError(c.redteam.missingKey);
      return;
    }
    setRunning(true);
    setOutput("");
    const controller = new AbortController();
    abortRef.current = controller;
    if (remember) {
      const next = { ...stored.current, provider, model, [provider]: key.trim() };
      stored.current = next;
      saveKeys(next);
    }
    try {
      const text = await runReview({
        provider,
        model: model.trim(),
        key: key.trim(),
        prompt: buildReviewPrompt(system, locale),
        signal: controller.signal,
      });
      setOutput(text);
      onRun({
        id: `run_${Math.random().toString(36).slice(2, 9)}`,
        at: Date.now(),
        checked: [...checked],
        notes: { ko: "", en: "", [locale]: "" } as RedteamRun["notes"],
        verdict: "conditional",
        source: "byok",
      });
    } catch (error) {
      if (controller.signal.aborted) {
        setRunError(locale === "ko" ? "실행을 중단했습니다." : "Run stopped.");
      } else {
        const raw = error instanceof Error ? error.message : String(error);
        const safe = raw.split(key.trim()).join("***");
        setRunError(`${c.redteam.errorPrefix}: ${safe}`);
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  const stop = () => {
    abortRef.current?.abort();
  };

  const removeKey = () => {
    clearKeys();
    stored.current = { openai: "", anthropic: "", provider, model };
    setKey("");
    setRemember(false);
    notify(c.redteam.keyCleared);
  };

  return (
    <div className="stack">
      <div className="section-intro">
        <h2>{c.redteam.title}</h2>
        <p>{c.redteam.intro}</p>
      </div>

      <div className="review-progress">
        <span>
          {checked.size} / {totalChecks} {c.redteam.checked}
        </span>
        <span className="review-progress-meter" aria-hidden="true">
          <span style={{ transform: `scaleX(${totalChecks ? checked.size / totalChecks : 0})` }} />
        </span>
      </div>

      <div className="lens-grid">
        {perspectives.map((perspective) => {
          const items = checksFor(system.presetKey, perspective);
          return (
            <section key={perspective} className="lens">
              <div className="lens-head">
                <h3>{c.redteam.perspectives[perspective]}</h3>
                <p>{c.redteam.perspectiveDesc[perspective]}</p>
              </div>
              <ul className="check-list">
                {items.map((item, index) => {
                  const id = checkId(system.presetKey, perspective, index);
                  return (
                    <li key={id}>
                      <label className="check">
                        <input type="checkbox" checked={checked.has(id)} onChange={() => toggle(id)} />
                        <span>{pick(item, locale)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <div className="lens-actions">
                <button type="button" className="meta-btn" onClick={() => setOpen(open === perspective ? null : perspective)}>
                  {open === perspective ? c.redteam.hidePrompt : c.redteam.prompt}
                </button>
                <button type="button" className="meta-btn" onClick={() => copyPrompt(perspective)}>
                  {c.redteam.copyPrompt}
                </button>
              </div>
              {open === perspective ? (
                <pre className="prompt-box">{buildPerspectivePrompt(system, locale, perspective)}</pre>
              ) : null}
            </section>
          );
        })}
      </div>

      <div className="record-box">
        <div className="record-head">
          <h3>{c.redteam.record}</h3>
          <p>{c.redteam.recordHint}</p>
        </div>
        <div className="record-fields">
          <label className="select-label">
            <span>{c.redteam.verdict}</span>
            <select className="select" value={verdict} onChange={(event) => setVerdict(event.target.value as Verdict)}>
              <option value="pass">{c.redteam.verdictPass}</option>
              <option value="conditional">{c.redteam.verdictConditional}</option>
              <option value="rework">{c.redteam.verdictRework}</option>
            </select>
          </label>
          <div className="record-note">
            <label className="field-label small" htmlFor="review-notes">
              {c.redteam.notes}
            </label>
            <TextArea id="review-notes" value={notes} onChange={setNotes} rows={2} placeholder={c.redteam.notesPlaceholder} />
          </div>
        </div>
        {recordError ? (
          <p className="error-line" role="alert">
            {recordError}
          </p>
        ) : null}
        <div className="row-end">
          <button type="button" className="btn btn-primary" onClick={record}>
            {c.redteam.record}
          </button>
        </div>
      </div>

      <section className="byok">
        <button
          type="button"
          className="byok-toggle"
          aria-expanded={byokOpen}
          onClick={() => setByokOpen(!byokOpen)}
        >
          <span>{c.redteam.byokTitle}</span>
          <Icon name="chevron" />
        </button>
        {byokOpen ? (
          <div className="byok-body">
            <p className="byok-intro">{c.redteam.byokIntro}</p>
            <div className="byok-row">
              <fieldset className="byok-group">
                <legend className="field-label small">{c.redteam.provider}</legend>
                <div className="seg">
                  <button
                    type="button"
                    className={`seg-btn${provider === "openai" ? " is-on" : ""}`}
                    aria-pressed={provider === "openai"}
                    onClick={() => switchProvider("openai")}
                  >
                    OpenAI
                  </button>
                  <button
                    type="button"
                    className={`seg-btn${provider === "anthropic" ? " is-on" : ""}`}
                    aria-pressed={provider === "anthropic"}
                    onClick={() => switchProvider("anthropic")}
                  >
                    Anthropic
                  </button>
                </div>
              </fieldset>
              <label className="byok-group">
                <span className="field-label small">{c.redteam.model}</span>
                <input
                  className="input"
                  value={model}
                  list="systema-models"
                  onChange={(event) => setModel(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
                <datalist id="systema-models">
                  <option value="gpt-4o-mini" />
                  <option value="gpt-4.1-mini" />
                  <option value="claude-sonnet-4-5" />
                  <option value="claude-haiku-4-5" />
                </datalist>
              </label>
            </div>
            <label className="byok-group">
              <span className="field-label small">{c.redteam.keyLabel}</span>
              <input
                className="input"
                type="password"
                value={key}
                onChange={(event) => setKey(event.target.value)}
                placeholder={c.redteam.keyPlaceholder}
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <div className="byok-options">
              <label className="check small">
                <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                <span>{c.redteam.rememberKey}</span>
              </label>
              <button type="button" className="meta-btn" onClick={removeKey}>
                {c.redteam.clearKey}
              </button>
            </div>
            <p className="byok-warning">{c.redteam.keyWarning}</p>
            <div className="byok-actions">
              {running ? (
                <button type="button" className="btn" onClick={stop}>
                  <Icon name="stop" size={12} />
                  {c.redteam.stop}
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={execute}>
                  <Icon name="play" size={12} />
                  {c.redteam.run}
                </button>
              )}
              <span className="byok-status" role="status">
                {running ? c.redteam.running : key ? c.redteam.keySaved : c.redteam.keyNotSaved}
              </span>
            </div>
            {runError ? (
              <p className="error-line" role="alert">
                {runError}
              </p>
            ) : null}
            <div className="byok-output">
              <h4>{c.redteam.result}</h4>
              {output ? <pre className="prompt-box tall">{output}</pre> : <p className="muted-line">{c.redteam.resultPlaceholder}</p>}
            </div>
          </div>
        ) : null}
      </section>

      <section className="history">
        <h3>{c.redteam.history}</h3>
        {system.runs.length ? (
          <ol className="history-list">
            {[...system.runs]
              .sort((a, b) => b.at - a.at)
              .slice(0, 5)
              .map((run) => (
                <li key={run.id}>
                  <div className="history-row">
                    <span className={`verdict verdict-${run.verdict}`}>{c.verdicts[run.verdict]}</span>
                    <span className="history-date">{dateLabel(run.at, locale)}</span>
                    <span className="history-meta">
                      {run.checked.length}
                      {locale === "ko" ? "개 확인" : " checked"}, {relativeDay(run.at, locale)}
                    </span>
                  </div>
                  {pick(run.notes, locale) ? <p className="history-note">{pick(run.notes, locale)}</p> : null}
                </li>
              ))}
          </ol>
        ) : (
          <p className="muted-line">{c.redteam.noHistory}</p>
        )}
      </section>
    </div>
  );
}
