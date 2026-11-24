import type { Locale, WorkSystem } from "../types";
import { copy as copyTable, pick } from "../i18n";
import { dateLabel, formatDuration, masteryOf, relativeDay, savedMinutes } from "../mastery";
import { clampNumber, formatNumber } from "../utils";

interface Props {
  system: WorkSystem;
  locale: Locale;
  onPro: () => void;
  onSim: (sim: WorkSystem["sim"]) => void;
}

const thresholds = [0, 1, 3, 6, 10];

export function GrowthTab({ system, locale, onPro, onSim }: Props) {
  const c = copyTable[locale];
  const mastery = masteryOf(system);
  const minutes = savedMinutes(system);
  const levelName = c.growth.levels[mastery.level - 1]?.name ?? c.growth.levels[0].name;

  const simChange = (key: keyof WorkSystem["sim"], raw: string) => {
    const limits: Record<keyof WorkSystem["sim"], [number, number]> = {
      minutesPerTask: [5, 600],
      repeatsPerMonth: [1, 100],
      savingsRate: [0, 90],
    };
    const [min, max] = limits[key];
    const next = clampNumber(raw, min, max, system.sim[key]);
    onSim({ ...system.sim, [key]: next });
  };

  return (
    <div className="stack">
      <div className="section-intro">
        <h2>{c.growth.title}</h2>
        <p>{c.growth.intro}</p>
      </div>

      <div className="figures">
        <div className="figure">
          <span className="figure-value">Lv {mastery.level}</span>
          <span className="figure-label">
            {c.growth.levelName}, {levelName}
          </span>
        </div>
        <div className="figure">
          <span className="figure-value">{mastery.passes}</span>
          <span className="figure-label">{c.growth.passes}</span>
        </div>
        <div className="figure">
          <span className="figure-value">{formatDuration(minutes, locale)}</span>
          <span className="figure-label">{c.growth.savedPerMonth}</span>
        </div>
      </div>

      <section className="growth-section">
        <h3>{c.growth.ladder}</h3>
        <ol className="ladder">
          {c.growth.levels.map((level, index) => {
            const reached = mastery.level >= index + 1;
            const current = mastery.level === index + 1;
            return (
              <li key={level.name} className={`ladder-row${current ? " is-current" : ""}${reached ? " is-reached" : ""}`}>
                <span className="ladder-no">{index + 1}</span>
                <span className="ladder-name">{level.name}</span>
                <span className="ladder-detail">{level.detail}</span>
                <span className="ladder-at">
                  {thresholds[index]}
                  {locale === "ko" ? "회" : ""}
                </span>
                {current ? <span className="ladder-current">{c.growth.current}</span> : null}
              </li>
            );
          })}
        </ol>
        {mastery.nextAt !== null ? (
          <p className="muted-line">
            {c.growth.nextLevel} {mastery.nextAt - mastery.passes}
            {locale === "ko" ? "회" : " reviews"}
          </p>
        ) : null}
      </section>

      <section className="growth-section">
        <h3>{c.growth.simulator}</h3>
        <p className="section-note">{c.growth.simulatorIntro}</p>
        <div className="sim-row">
          <label className="sim-field">
            <span>{c.growth.minutesPerTask}</span>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              min={5}
              max={600}
              value={system.sim.minutesPerTask}
              onChange={(event) => simChange("minutesPerTask", event.target.value)}
            />
          </label>
          <label className="sim-field">
            <span>{c.growth.repeatsPerMonth}</span>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              value={system.sim.repeatsPerMonth}
              onChange={(event) => simChange("repeatsPerMonth", event.target.value)}
            />
          </label>
          <label className="sim-field">
            <span>{c.growth.savingsRate}</span>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              min={0}
              max={90}
              value={system.sim.savingsRate}
              onChange={(event) => simChange("savingsRate", event.target.value)}
            />
          </label>
        </div>
        <div className="sim-result">
          <span>
            {c.growth.savedMonth} {formatDuration(minutes, locale)}
          </span>
          <span>
            {c.growth.savedYear} {formatDuration(minutes * 12, locale)}
          </span>
        </div>
      </section>

      <section className="growth-section">
        <h3>{c.growth.historyTitle}</h3>
        {system.runs.length ? (
          <ol className="timeline">
            {[...system.runs]
              .sort((a, b) => b.at - a.at)
              .map((run) => (
                <li key={run.id} className="timeline-row">
                  <span className="timeline-date">{dateLabel(run.at, locale)}</span>
                  <span className={`verdict verdict-${run.verdict}`}>{c.verdicts[run.verdict]}</span>
                  <span className="timeline-meta">
                    {run.checked.length}
                    {locale === "ko" ? "개 확인" : " checked"}
                  </span>
                  <span className="timeline-ago">{relativeDay(run.at, locale)}</span>
                  {pick(run.notes, locale) ? <span className="timeline-note">{pick(run.notes, locale)}</span> : null}
                </li>
              ))}
          </ol>
        ) : (
          <p className="muted-line">{c.growth.noHistory}</p>
        )}
      </section>

      <section className="growth-section">
        <h3>{c.growth.ruleTitle}</h3>
        {system.rules.length ? (
          <ul className="rule-stats">
            {[...system.rules]
              .sort((a, b) => b.verified - a.verified)
              .map((rule) => (
                <li key={rule.id}>
                  <span className={`rule-stat-count${rule.verified > 0 ? " is-positive" : ""}`}>
                    {formatNumber(rule.verified, locale)}
                  </span>
                  <span className={rule.active ? "" : "is-off"}>{pick(rule.text, locale)}</span>
                </li>
              ))}
          </ul>
        ) : (
          <p className="muted-line">{c.growth.noRules}</p>
        )}
      </section>

      <section className="growth-section pro-block">
        <h3>{c.growth.proTitle}</h3>
        <p className="section-note">{c.growth.proIntro}</p>
        <ul className="pro-index">
          {c.pro.packs.slice(0, 6).map((pack) => (
            <li key={pack.title}>
              <span>{pack.title}</span>
              {pack.free ? <span className="pro-free">{c.pro.freeBadge}</span> : null}
            </li>
          ))}
        </ul>
        <button type="button" className="btn" onClick={onPro}>
          {c.growth.proCta}
        </button>
      </section>
    </div>
  );
}
