import { useMemo, useState } from "react";
import type { Locale, Rule, RuleCategory, WorkSystem } from "../types";
import { copy as copyTable, pick } from "../i18n";
import { Empty, Icon, TextArea, Toggle } from "./ui";

interface Props {
  system: WorkSystem;
  locale: Locale;
  onAdd: (rule: Rule) => void;
  onChange: (ruleId: string, patch: Partial<Rule>) => void;
  onDelete: (ruleId: string) => void;
}

const categories: RuleCategory[] = ["structure", "tone", "trust", "verification", "revenue", "ops"];

const newId = () => `rule_${Math.random().toString(36).slice(2, 9)}`;

export function RulebookTab({ system, locale, onAdd, onChange, onDelete }: Props) {
  const c = copyTable[locale];
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftCategory, setDraftCategory] = useState<RuleCategory>("structure");
  const [filter, setFilter] = useState<RuleCategory | "all">("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editNote, setEditNote] = useState("");
  const [historyOpen, setHistoryOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? system.rules : system.rules.filter((rule) => rule.category === filter)),
    [system.rules, filter],
  );
  const activeCount = system.rules.filter((rule) => rule.active).length;

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onAdd({
      id: newId(),
      text: { ...emptyBi(), [locale]: text },
      category: draftCategory,
      active: true,
      version: 1,
      note: { ko: "", en: "" },
      verified: 0,
      createdAt: Date.now(),
      versions: [],
    });
    setDraft("");
    setAdding(false);
    setFilter("all");
  };

  const startEdit = (rule: Rule) => {
    setEditing(rule.id);
    setEditText(pick(rule.text, locale));
    setEditNote("");
    setHistoryOpen(null);
  };

  const saveEdit = (rule: Rule) => {
    const text = editText.trim();
    if (!text) return;
    const nextVersion = rule.version + 1;
    const note = { ...rule.note, [locale]: editNote.trim() };
    onChange(rule.id, {
      text: { ...rule.text, [locale]: text },
      version: nextVersion,
      note,
      versions: [...rule.versions, { version: nextVersion, note: { ...emptyBi(), [locale]: editNote.trim() }, at: Date.now() }],
    });
    setEditing(null);
    setEditNote("");
  };

  return (
    <div className="stack">
      <div className="section-intro">
        <h2>{c.rulebook.title}</h2>
        <p>{c.rulebook.intro}</p>
      </div>

      <div className="list-toolbar">
        <p className="toolbar-count">
          {c.rulebook.count} {system.rules.length}
          <span className="sep">/</span>
          {c.rulebook.activeCount} {activeCount}
        </p>
        {!adding ? (
          <button type="button" className="btn" onClick={() => setAdding(true)}>
            <Icon name="plus" />
            {c.rulebook.addRule}
          </button>
        ) : null}
      </div>

      {adding ? (
        <div className="inline-form">
          <label className="field-label" htmlFor="new-rule">
            {c.rulebook.newRule}
          </label>
          <TextArea id="new-rule" value={draft} onChange={setDraft} rows={3} placeholder={c.rulebook.rulePlaceholder} />
          <div className="inline-form-row">
            <label className="select-label">
              <span>{c.rulebook.category}</span>
              <select
                className="select"
                value={draftCategory}
                onChange={(event) => setDraftCategory(event.target.value as RuleCategory)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {c.categories[category]}
                  </option>
                ))}
              </select>
            </label>
            <div className="inline-form-actions">
              <button type="button" className="btn btn-quiet" onClick={() => setAdding(false)}>
                {c.app.cancel}
              </button>
              <button type="button" className="btn btn-primary" onClick={submit} disabled={!draft.trim()}>
                {c.rulebook.saveRule}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {system.rules.length ? (
        <div className="filter-row" role="group" aria-label={c.rulebook.category}>
          <button type="button" className={`filter${filter === "all" ? " is-on" : ""}`} onClick={() => setFilter("all")}>
            {c.rulebook.filterAll} {system.rules.length}
          </button>
          {categories
            .filter((category) => system.rules.some((rule) => rule.category === category))
            .map((category) => (
              <button
                key={category}
                type="button"
                className={`filter${filter === category ? " is-on" : ""}`}
                onClick={() => setFilter(category)}
              >
                {c.categories[category]} <span className="filter-count">{system.rules.filter((rule) => rule.category === category).length}</span>
              </button>
            ))}
        </div>
      ) : null}

      {!system.rules.length ? (
        <Empty
          title={c.rulebook.emptyTitle}
          body={c.rulebook.emptyBody}
          action={
            <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
              {c.rulebook.emptyAction}
            </button>
          }
        />
      ) : visible.length === 0 ? (
        <p className="muted-line">{c.rulebook.noRulesInFilter}</p>
      ) : (
        <ol className="rule-list">
          {visible.map((rule, index) => (
            <li key={rule.id} className={`rule${rule.active ? "" : " is-off"}`}>
              <div className="rule-main">
                <span className="rule-index">{String(index + 1).padStart(2, "0")}</span>
                <div className="rule-body">
                  {editing === rule.id ? (
                    <div className="rule-edit">
                      <TextArea value={editText} onChange={setEditText} rows={3} ariaLabel={c.rulebook.editRule} />
                      <label className="field-label small" htmlFor={`note-${rule.id}`}>
                        {c.rulebook.versionNote}
                      </label>
                      <input
                        id={`note-${rule.id}`}
                        className="input"
                        value={editNote}
                        placeholder={c.rulebook.versionNotePlaceholder}
                        onChange={(event) => setEditNote(event.target.value)}
                      />
                      <div className="inline-form-actions">
                        <button type="button" className="btn btn-quiet" onClick={() => setEditing(null)}>
                          {c.rulebook.cancelEdit}
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => saveEdit(rule)}
                          disabled={!editText.trim()}
                        >
                          {c.rulebook.applyEdit}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="rule-text">{pick(rule.text, locale)}</p>
                  )}
                  <div className="rule-meta">
                    <span>
                      {[
                        c.categories[rule.category],
                        `${c.rulebook.version} ${rule.version}`,
                        `${c.rulebook.verified} ${rule.verified}${c.rulebook.times}`,
                      ].join(", ")}
                    </span>
                    {rule.versions.length ? (
                      <button
                        type="button"
                        className="meta-btn"
                        aria-expanded={historyOpen === rule.id}
                        onClick={() => setHistoryOpen(historyOpen === rule.id ? null : rule.id)}
                      >
                        {c.rulebook.history}
                      </button>
                    ) : null}
                  </div>
                  {historyOpen === rule.id ? (
                    <ol className="version-list">
                      {[...rule.versions]
                        .sort((a, b) => b.version - a.version)
                        .map((entry) => (
                          <li key={`${rule.id}-${entry.version}`}>
                            <span className="version-no">v{entry.version}</span>
                            <span>{pick(entry.note, locale) || (locale === "ko" ? "본문 수정" : "Text revised")}</span>
                          </li>
                        ))}
                    </ol>
                  ) : null}
                </div>
                <div className="rule-side">
                  <span className="rule-switch">
                    <Toggle
                      checked={rule.active}
                      onChange={(next) => onChange(rule.id, { active: next })}
                      label={`${rule.active ? c.rulebook.active : c.rulebook.inactive}`}
                    />
                    <span className="rule-state">{rule.active ? c.rulebook.active : c.rulebook.inactive}</span>
                  </span>
                  {editing !== rule.id ? (
                    <div className="rule-actions">
                      <button type="button" className="meta-btn" onClick={() => startEdit(rule)}>
                        {c.app.edit}
                      </button>
                      <button
                        type="button"
                        className="meta-btn danger"
                        onClick={() => setConfirmDelete(confirmDelete === rule.id ? null : rule.id)}
                      >
                        {c.app.delete}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
              {confirmDelete === rule.id ? (
                <div className="rule-confirm">
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      onDelete(rule.id);
                      setConfirmDelete(null);
                    }}
                  >
                    {c.rulebook.deleteRule}
                  </button>
                  <button type="button" className="btn btn-quiet btn-sm" onClick={() => setConfirmDelete(null)}>
                    {c.app.cancel}
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function emptyBi() {
  return { ko: "", en: "" };
}
