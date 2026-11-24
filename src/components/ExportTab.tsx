import { useMemo, useRef, useState } from "react";
import type { ExportFormat, ExportOptions, Locale, WorkSystem } from "../types";
import { copy as copyTable, pick } from "../i18n";
import { buildPackage, buildSystemJson } from "../export";
import { copyText, downloadFile, slugify } from "../utils";
import { Icon } from "./ui";
import { SkillSection } from "./SkillSection";

interface Props {
  system: WorkSystem;
  locale: Locale;
  notify: (message: string) => void;
  onImport: (system: WorkSystem) => void;
}

export function ExportTab({ system, locale, notify, onImport }: Props) {
  const c = copyTable[locale];
  const [format, setFormat] = useState<ExportFormat>("claude");
  const [options, setOptions] = useState<ExportOptions>({
    activeRulesOnly: true,
    includeRedteam: true,
    includeHistory: false,
  });
  const fileRef = useRef<HTMLInputElement | null>(null);

  const text = useMemo(() => buildPackage(system, locale, format, options), [system, locale, format, options]);
  const words = useMemo(() => text.split(/\s+/).filter(Boolean).length, [text]);
  const name = pick(system.name, locale) || c.workspace.untitled;

  const copy = async () => {
    const ok = await copyText(text);
    notify(ok ? c.exportTab.copied : c.app.cancel);
  };

  const downloadMd = () => {
    downloadFile(`${slugify(name)}-${format}.md`, text, "text/markdown;charset=utf-8");
    notify(c.exportTab.downloadStarted);
  };

  const downloadJson = () => {
    downloadFile(`${slugify(name)}.json`, buildSystemJson(system), "application/json;charset=utf-8");
    notify(c.exportTab.downloadStarted);
  };

  const readFile = async (file: File) => {
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as { system?: WorkSystem } | WorkSystem;
      const candidate = "system" in parsed && parsed.system ? parsed.system : (parsed as WorkSystem);
      if (!candidate || typeof candidate !== "object" || !candidate.name || !Array.isArray(candidate.rules)) {
        throw new Error("shape");
      }
      onImport(candidate);
      notify(c.exportTab.importDone);
    } catch {
      notify(c.exportTab.importError);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const formats: { key: ExportFormat; label: string; note: string }[] = [
    { key: "claude", label: c.exportTab.claude, note: c.exportTab.claudeNote },
    { key: "chatgpt", label: c.exportTab.chatgpt, note: c.exportTab.chatgptNote },
    { key: "gemini", label: c.exportTab.gemini, note: c.exportTab.geminiNote },
  ];

  const optionRows: { key: keyof ExportOptions; label: string }[] = [
    { key: "activeRulesOnly", label: c.exportTab.activeOnly },
    { key: "includeRedteam", label: c.exportTab.includeRedteam },
    { key: "includeHistory", label: c.exportTab.includeHistory },
  ];

  return (
    <div className="stack">
      <div className="section-intro">
        <h2>{c.exportTab.title}</h2>
        <p>{c.exportTab.intro}</p>
      </div>

      {!pick(system.goal, locale).trim() ? (
        <p className="warn-line">{c.exportTab.emptyWarning}</p>
      ) : null}

      <div className="format-cards" role="radiogroup" aria-label={c.exportTab.format}>
        {formats.map((item) => (
          <label key={item.key} className={`format-card${format === item.key ? " is-on" : ""}`}>
            <input
              type="radio"
              name="format"
              value={item.key}
              checked={format === item.key}
              onChange={() => setFormat(item.key)}
            />
            <span className="format-name">{item.label}</span>
            <span className="format-note">{item.note}</span>
          </label>
        ))}
      </div>

      <fieldset className="field">
        <legend className="field-label">{c.exportTab.options}</legend>
        <div className="option-list">
          {optionRows.map((row) => (
            <label key={row.key} className="check">
              <input
                type="checkbox"
                checked={options[row.key]}
                onChange={(event) => setOptions({ ...options, [row.key]: event.target.checked })}
              />
              <span>{row.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="export-actions">
        <button type="button" className="btn btn-primary" onClick={copy}>
          <Icon name="copy" />
          {c.exportTab.copy}
        </button>
        <button type="button" className="btn" onClick={downloadMd}>
          <Icon name="download" />
          {c.exportTab.downloadMd}
        </button>
        <button type="button" className="btn" onClick={downloadJson}>
          <Icon name="download" />
          {c.exportTab.downloadJson}
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => fileRef.current?.click()}>
          {c.exportTab.importJson}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="file-input"
          aria-label={c.exportTab.importJson}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void readFile(file);
          }}
        />
      </div>

      <div className="preview-block">
        <div className="preview-head">
          <h3>{c.exportTab.preview}</h3>
          <span className="field-count">
            {words} {c.exportTab.words}
          </span>
        </div>
        <pre className="preview tall" tabIndex={0}>
          {text}
        </pre>
      </div>

      <SkillSection system={system} locale={locale} notify={notify} />
    </div>
  );
}
