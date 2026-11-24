import { useState } from "react";
import type { Locale } from "../types";
import { copy as copyTable } from "../i18n";
import { presetList } from "../presets";

interface Props {
  locale: Locale;
  onCreateBlank: (name: string) => void;
  onCreatePreset: (key: string) => void;
}

export function NewSystemView({ locale, onCreateBlank, onCreatePreset }: Props) {
  const c = copyTable[locale];
  const [name, setName] = useState("");

  return (
    <div className="new-view stack">
      <div className="section-intro">
        <h1>{c.newSystem.title}</h1>
        <p>{c.newSystem.intro}</p>
      </div>

      <div className="blank-box">
        <div>
          <h2>{c.newSystem.blank}</h2>
          <p>{c.newSystem.blankDesc}</p>
        </div>
        <div className="blank-form">
          <label className="field-label small" htmlFor="new-name">
            {c.newSystem.nameLabel}
          </label>
          <input
            id="new-name"
            className="input"
            value={name}
            placeholder={c.newSystem.namePlaceholder}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onCreateBlank(name);
            }}
          />
          <button type="button" className="btn btn-primary" onClick={() => onCreateBlank(name)}>
            {c.newSystem.create}
          </button>
        </div>
      </div>

      <div className="preset-section">
        <h2>{c.rail.presets}</h2>
        <p className="section-note">{c.newSystem.presetNote}</p>
        <ul className="preset-list">
          {presetList().map((preset, index) => (
            <li key={preset.key} className="preset">
              <span className="preset-no">{String(index + 1).padStart(2, "0")}</span>
              <div className="preset-body">
                <h3>{preset.name[locale] || preset.name.ko}</h3>
                <p>{preset.purpose[locale] || preset.purpose.ko}</p>
                <p className="preset-meta">
                  {c.rail.rules} {preset.rules.length}
                </p>
              </div>
              <button type="button" className="btn" onClick={() => onCreatePreset(preset.key)}>
                {c.newSystem.choose}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
