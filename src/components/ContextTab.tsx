import type { Locale, WorkSystem } from "../types";
import { copy as copyTable, pick } from "../i18n";
import { Field, TextArea } from "./ui";

interface Props {
  system: WorkSystem;
  locale: Locale;
  onChange: (patch: Partial<WorkSystem>) => void;
  onContinue: () => void;
}

export function ContextTab({ system, locale, onChange, onContinue }: Props) {
  const c = copyTable[locale];
  const filled = [system.goal, system.background, system.constraints, system.success].filter(
    (value) => pick(value, locale).trim().length > 0,
  ).length;

  const set = (key: "goal" | "background" | "constraints" | "success") => (value: string) =>
    onChange({ [key]: { ...system[key], [locale]: value } } as Partial<WorkSystem>);

  const delegationOptions: { value: WorkSystem["delegation"]; label: string }[] = [
    { value: "draft", label: c.context.delegationDraft },
    { value: "approve", label: c.context.delegationApprove },
    { value: "auto", label: c.context.delegationAuto },
  ];

  return (
    <div className="stack">
      <div className="section-intro">
        <h2>{c.context.title}</h2>
        <p>{c.context.intro}</p>
      </div>

      <div className="coverage" aria-live="polite">
        <span className="coverage-label">{c.context.completeness}</span>
        <span className="coverage-value">
          {filled} / 4
        </span>
        <span className="coverage-meter" aria-hidden="true">
          <span className="coverage-fill" style={{ transform: `scaleX(${filled / 4})` }} />
        </span>
      </div>

      <Field label={c.context.goal} hint={c.context.goalHint} htmlFor="ctx-goal">
        <TextArea id="ctx-goal" rows={2} value={pick(system.goal, locale)} onChange={set("goal")} placeholder={c.context.goalPlaceholder} />
      </Field>

      <Field label={c.context.background} hint={c.context.backgroundHint} htmlFor="ctx-background">
        <TextArea
          id="ctx-background"
          rows={5}
          value={pick(system.background, locale)}
          onChange={set("background")}
          placeholder={c.context.backgroundPlaceholder}
        />
      </Field>

      <Field label={c.context.constraints} hint={c.context.constraintsHint} htmlFor="ctx-constraints">
        <TextArea
          id="ctx-constraints"
          rows={3}
          value={pick(system.constraints, locale)}
          onChange={set("constraints")}
          placeholder={c.context.constraintsPlaceholder}
        />
      </Field>

      <Field
        label={c.context.success}
        hint={c.context.successHint}
        htmlFor="ctx-success"
        action={
          <span className="field-count">
            {pick(system.success, locale).split("\n").filter((line) => line.trim()).length} {c.context.items}
          </span>
        }
      >
        <TextArea
          id="ctx-success"
          rows={3}
          value={pick(system.success, locale)}
          onChange={set("success")}
          placeholder={c.context.successPlaceholder}
        />
      </Field>

      <fieldset className="field">
        <legend className="field-label">{c.context.delegation}</legend>
        <p className="field-hint">{c.context.delegationHint}</p>
        <div className="radio-list">
          {delegationOptions.map((option) => (
            <label key={option.value} className={`radio-row${system.delegation === option.value ? " is-on" : ""}`}>
              <input
                type="radio"
                name="delegation"
                value={option.value}
                checked={system.delegation === option.value}
                onChange={() => onChange({ delegation: option.value })}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="row-end">
        <button type="button" className="btn btn-primary" onClick={onContinue}>
          {c.context.toRules}
        </button>
      </div>
    </div>
  );
}
