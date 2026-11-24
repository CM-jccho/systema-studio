import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ExportFormat, Locale, Rule, Store, WorkSystem } from "./types";
import { copy as copyTable, pick } from "./i18n";
import {
  blankSystem,
  duplicateSystem,
  systemFromPreset,
} from "./presets";
import { initialStore, loadStore, saveStore, detectLocale } from "./storage";
import { buildPackage } from "./export";
import { copyText } from "./utils";
import { relativeDay } from "./mastery";
import { ContextTab } from "./components/ContextTab";
import { RulebookTab } from "./components/RulebookTab";
import { RedteamTab } from "./components/RedteamTab";
import { ExportTab } from "./components/ExportTab";
import { GrowthTab } from "./components/GrowthTab";
import { ProModal } from "./components/ProModal";
import { NewSystemView } from "./components/NewSystemView";
import { Icon } from "./components/ui";

type Tab = "context" | "rulebook" | "redteam" | "export" | "growth";
const tabs: Tab[] = ["context", "rulebook", "redteam", "export", "growth"];

function parseHash(): { id: string | null; tab: Tab } {
  const match = window.location.hash.match(/^#\/s\/([^/]+)(?:\/(\w+))?/);
  const rawTab = (match?.[2] ?? "") as Tab;
  return { id: match?.[1] ?? null, tab: tabs.includes(rawTab) ? rawTab : "context" };
}

function writeHash(id: string | null, tab: Tab) {
  const next = id ? `#/s/${id}/${tab}` : `#/new`;
  if (window.location.hash !== next) {
    window.history.replaceState(null, "", next);
  }
}

export default function App() {
  const [store, setStore] = useState<Store>(() => {
    const loaded = loadStore();
    return loaded ?? initialStore(detectLocale());
  });
  const initialHash = useMemo(parseHash, []);
  const [tab, setTab] = useState<Tab>(initialHash.tab);
  const [view, setView] = useState<"workspace" | "new">(
    initialHash.id || store.systems.length ? "workspace" : "new",
  );
  const [storageOk, setStorageOk] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [proOpen, setProOpen] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<ExportFormat>("claude");
  const toastTimer = useRef<number | null>(null);

  const locale = store.locale;
  const c = copyTable[locale];
  const active = store.systems.find((system) => system.id === store.activeId) ?? store.systems[0];

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    const ok = saveStore(store);
    setStorageOk(ok);
  }, [store]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = active ? `${pick(active.name, locale) || c.workspace.untitled} — SYSTEMA` : "SYSTEMA Studio";
  }, [locale, active, c.workspace.untitled]);

  useEffect(() => {
    writeHash(view === "new" ? null : store.activeId, tab);
  }, [store.activeId, tab, view]);

  useEffect(() => {
    if (initialHash.id && store.systems.some((system) => system.id === initialHash.id) && store.activeId !== initialHash.id) {
      setStore((prev) => ({ ...prev, activeId: initialHash.id as string }));
    }
    // run once for the initial deep link
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onHash = () => {
      const parsed = parseHash();
      if (parsed.id && store.systems.some((system) => system.id === parsed.id)) {
        setStore((prev) => ({ ...prev, activeId: parsed.id as string }));
        setView("workspace");
      }
      if (parsed.tab) setTab(parsed.tab);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [store.systems]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const updateActive = useCallback(
    (patch: Partial<WorkSystem>) => {
      setStore((prev) => ({
        ...prev,
        systems: prev.systems.map((system) =>
          system.id === prev.activeId ? { ...system, ...patch, updatedAt: Date.now() } : system,
        ),
      }));
    },
    [],
  );

  const updateRule = useCallback((ruleId: string, patch: Partial<Rule>) => {
    setStore((prev) => ({
      ...prev,
      systems: prev.systems.map((system) =>
        system.id === prev.activeId
          ? {
              ...system,
              updatedAt: Date.now(),
              rules: system.rules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)),
            }
          : system,
      ),
    }));
  }, []);

  const addRule = useCallback((rule: Rule) => {
    setStore((prev) => ({
      ...prev,
      systems: prev.systems.map((system) =>
        system.id === prev.activeId
          ? { ...system, updatedAt: Date.now(), rules: [rule, ...system.rules] }
          : system,
      ),
    }));
  }, []);

  const deleteRule = useCallback((ruleId: string) => {
    setStore((prev) => ({
      ...prev,
      systems: prev.systems.map((system) =>
        system.id === prev.activeId
          ? { ...system, updatedAt: Date.now(), rules: system.rules.filter((rule) => rule.id !== ruleId) }
          : system,
      ),
    }));
  }, []);

  const selectSystem = (id: string) => {
    setStore((prev) => ({ ...prev, activeId: id }));
    setView("workspace");
  };

  const createBlank = (name: string) => {
    const system = blankSystem(locale);
    if (name.trim()) system.name = { ...system.name, [locale]: name.trim() };
    setStore((prev) => ({
      ...prev,
      systems: [...prev.systems, system],
      activeId: system.id,
      onboarded: true,
    }));
    setView("workspace");
    setTab("context");
    notify(c.app.saved);
  };

  const createPreset = (key: string) => {
    const system = systemFromPreset(key);
    setStore((prev) => ({
      ...prev,
      systems: [...prev.systems, system],
      activeId: system.id,
      onboarded: true,
    }));
    setView("workspace");
    setTab("context");
  };

  const duplicateActive = () => {
    if (!active) return;
    const system = duplicateSystem(active, locale);
    setStore((prev) => ({ ...prev, systems: [...prev.systems, system], activeId: system.id }));
    notify(c.app.saved);
  };

  const deleteActive = () => {
    if (!active) return;
    setStore((prev) => {
      const systems = prev.systems.filter((system) => system.id !== active.id);
      return {
        ...prev,
        systems,
        activeId: systems[0]?.id ?? "",
      };
    });
    if (store.systems.length <= 1) setView("new");
    notify(c.app.saved);
  };

  const importSystem = (incoming: WorkSystem) => {
    const system: WorkSystem = {
      ...incoming,
      id: store.systems.some((existing) => existing.id === incoming.id)
        ? `sys_${Math.random().toString(36).slice(2, 9)}`
        : incoming.id,
      runs: Array.isArray(incoming.runs) ? incoming.runs : [],
      rules: Array.isArray(incoming.rules) ? incoming.rules : [],
      sim: incoming.sim ?? { minutesPerTask: 60, repeatsPerMonth: 1, savingsRate: 30 },
      delegation: incoming.delegation ?? "approve",
      presetKey: incoming.presetKey ?? null,
      createdAt: incoming.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    setStore((prev) => ({ ...prev, systems: [...prev.systems, system], activeId: system.id }));
    setView("workspace");
    setTab("context");
  };

  const preview = useMemo(() => {
    if (!active) return "";
    return buildPackage(active, locale, previewFormat, {
      activeRulesOnly: true,
      includeRedteam: true,
      includeHistory: false,
    });
  }, [active, locale, previewFormat]);

  const copyPreview = async () => {
    const ok = await copyText(preview);
    notify(ok ? c.exportTab.copied : c.app.cancel);
  };

  const onTabKey = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const index = tabs.indexOf(tab);
    let next: Tab | null = null;
    if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
    else if (event.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
    else if (event.key === "Home") next = tabs[0];
    else if (event.key === "End") next = tabs[tabs.length - 1];
    if (next) {
      event.preventDefault();
      setTab(next);
      document.getElementById(`tab-${next}`)?.focus();
    }
  };

  const tabLabel: Record<Tab, string> = {
    context: c.nav.context,
    rulebook: c.nav.rulebook,
    redteam: c.nav.redteam,
    export: c.nav.export,
    growth: c.nav.growth,
  };

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        {locale === "ko" ? "본문으로 건너뛰기" : "Skip to content"}
      </a>
      <header className="topbar">
        <div className="brand">
          <span className="wordmark">SYSTEMA</span>
          <span className="brand-sub">Studio</span>
        </div>
        {active ? <span className="topbar-context">{pick(active.name, locale) || c.workspace.untitled}</span> : null}
        <div className="topbar-actions">
          <button type="button" className="btn pro-link" onClick={() => setProOpen(true)}>
            {c.rail.proShort}
          </button>
          <div className="lang" role="group" aria-label={c.app.language}>
            <button
              type="button"
              className={`lang-btn${locale === "ko" ? " is-on" : ""}`}
              aria-pressed={locale === "ko"}
              onClick={() => setStore((prev) => ({ ...prev, locale: "ko" }))}
            >
              한국어
            </button>
            <button
              type="button"
              className={`lang-btn${locale === "en" ? " is-on" : ""}`}
              aria-pressed={locale === "en"}
              onClick={() => setStore((prev) => ({ ...prev, locale: "en" }))}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {!storageOk ? (
        <p className="banner" role="alert">
          {c.errors.storage}
        </p>
      ) : null}

      <div className={`shell${view === "workspace" && active ? "" : " shell-wide"}`}>
        <aside className="rail" aria-label={c.rail.systems}>
          <div className="rail-head">
            <p className="rail-title">{c.rail.systems}</p>
            <span className="count">{store.systems.length}</span>
          </div>
          <button
            type="button"
            className="btn btn-block"
            onClick={() => {
              setView("new");
              setTab("context");
            }}
          >
            <Icon name="plus" />
            {c.rail.newSystem}
          </button>

          <label className="rail-select">
            <span className="sr-only">{c.rail.systems}</span>
            <select
              className="select"
              value={active?.id ?? ""}
              onChange={(event) => selectSystem(event.target.value)}
            >
              {store.systems.map((system) => (
                <option key={system.id} value={system.id}>
                  {pick(system.name, locale) || c.workspace.untitled}
                </option>
              ))}
            </select>
          </label>

          <ul className="system-list">
            {store.systems.map((system) => {
              const isActive = system.id === active?.id && view === "workspace";
              return (
                <li key={system.id}>
                  <button
                    type="button"
                    className={`system-item${isActive ? " is-active" : ""}`}
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => selectSystem(system.id)}
                  >
                    <span className="system-name">{pick(system.name, locale) || c.workspace.untitled}</span>
                    <span className="system-meta">
                      {c.rail.rules} {system.rules.length}, {c.rail.runs} {system.runs.length}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {!store.systems.length ? <p className="rail-empty">{c.rail.empty}</p> : null}

          <div className="rail-foot">
            <button type="button" className="link-btn" onClick={() => setProOpen(true)}>
              {c.rail.pro}
            </button>
            <p className="rail-note">{c.rail.footer}</p>
          </div>
        </aside>

        <main className="main" id="main">
          {view === "new" || !active ? (
            <NewSystemView locale={locale} onCreateBlank={createBlank} onCreatePreset={createPreset} />
          ) : (
            <>
              <div className="workhead">
                <div className="workhead-fields">
                  <h1 className="sr-only">{pick(active.name, locale) || c.workspace.untitled}</h1>
                  <input
                    className="title-input"
                    value={pick(active.name, locale)}
                    aria-label={c.workspace.nameLabel}
                    placeholder={c.workspace.untitled}
                    onChange={(event) =>
                      updateActive({ name: { ...active.name, [locale]: event.target.value } })
                    }
                  />
                  <input
                    className="purpose-input"
                    value={pick(active.purpose, locale)}
                    aria-label={c.workspace.purposeLabel}
                    placeholder={c.workspace.purposePlaceholder}
                    onChange={(event) =>
                      updateActive({ purpose: { ...active.purpose, [locale]: event.target.value } })
                    }
                  />
                  <p className="workhead-meta">
                    {c.workspace.updated} {relativeDay(active.updatedAt, locale)}
                  </p>
                </div>
                <div className="workhead-actions">
                  <button type="button" className="btn btn-quiet" onClick={duplicateActive}>
                    {c.app.duplicate}
                  </button>
                  <DeleteButton onDelete={deleteActive} locale={locale} />
                </div>
              </div>

              <div className="tabs" role="tablist" aria-label={c.workspace.systemNo}>
                {tabs.map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    id={`tab-${item}`}
                    aria-selected={tab === item}
                    aria-controls={`panel-${item}`}
                    className={`tab${tab === item ? " is-active" : ""}`}
                    tabIndex={tab === item ? 0 : -1}
                    onClick={() => setTab(item)}
                    onKeyDown={onTabKey}
                  >
                    {tabLabel[item]}
                  </button>
                ))}
              </div>

              <div className="tabpanel" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
                {tab === "context" ? (
                  <ContextTab
                    system={active}
                    locale={locale}
                    onChange={updateActive}
                    onContinue={() => setTab("rulebook")}
                  />
                ) : null}
                {tab === "rulebook" ? (
                  <RulebookTab
                    system={active}
                    locale={locale}
                    onAdd={addRule}
                    onChange={updateRule}
                    onDelete={deleteRule}
                  />
                ) : null}
                {tab === "redteam" ? (
                  <RedteamTab
                    system={active}
                    locale={locale}
                    onRun={(run) => {
                      const counted = run.verdict !== "rework";
                      updateActive({
                        runs: [...active.runs, run],
                        rules: counted
                          ? active.rules.map((rule) => (rule.active ? { ...rule, verified: rule.verified + 1 } : rule))
                          : active.rules,
                      });
                    }}
                    notify={notify}
                  />
                ) : null}
                {tab === "export" ? (
                  <ExportTab system={active} locale={locale} notify={notify} onImport={importSystem} />
                ) : null}
                {tab === "growth" ? (
                  <GrowthTab
                    system={active}
                    locale={locale}
                    onPro={() => setProOpen(true)}
                    onSim={(sim) => updateActive({ sim })}
                  />
                ) : null}
              </div>
            </>
          )}
        </main>

        {view === "workspace" && active ? (
          <aside className="aside" aria-label={c.exportTab.title}>
            <div className="aside-head">
              <h2 className="aside-title">{c.exportTab.title}</h2>
              <div className="format-switch" role="group" aria-label={c.exportTab.format}>
                {(["claude", "chatgpt", "gemini"] as ExportFormat[]).map((format) => (
                  <button
                    key={format}
                    type="button"
                    className={`format-btn${previewFormat === format ? " is-on" : ""}`}
                    aria-pressed={previewFormat === format}
                    onClick={() => setPreviewFormat(format)}
                  >
                    {format === "claude" ? "Claude" : format === "chatgpt" ? "ChatGPT" : "Gemini"}
                  </button>
                ))}
              </div>
            </div>
            <pre className="preview" aria-label={c.exportTab.preview}>
              {preview}
            </pre>
            <div className="aside-actions">
              <button type="button" className="btn btn-primary" onClick={copyPreview}>
                <Icon name="copy" />
                {c.exportTab.copy}
              </button>
              <button type="button" className="link-btn" onClick={() => setTab("export")}>
                {c.exportTab.downloadMd}
              </button>
            </div>
            <p className="aside-note">{c.app.localOnly}</p>
          </aside>
        ) : null}
      </div>

      {proOpen ? <ProModal locale={locale} onClose={() => setProOpen(false)} /> : null}
      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function DeleteButton({ onDelete, locale }: { onDelete: () => void; locale: Locale }) {
  const c = copyTable[locale];
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), 6000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  if (!confirming) {
    return (
      <button type="button" className="btn btn-quiet" onClick={() => setConfirming(true)}>
        {c.app.delete}
      </button>
    );
  }
  return (
    <span className="confirm">
      <span className="confirm-text">{c.workspace.deleteConfirm}</span>
      <button type="button" className="btn btn-danger" onClick={onDelete}>
        {c.workspace.deleteForever}
      </button>
      <button type="button" className="btn btn-quiet" onClick={() => setConfirming(false)}>
        {c.app.cancel}
      </button>
    </span>
  );
}
