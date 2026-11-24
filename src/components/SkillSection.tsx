import { useMemo } from "react";
import type { Locale, WorkSystem } from "../types";
import { copy as copyTable } from "../i18n";
import { buildSkillMd, skillSlug } from "../skill";
import { copyText, downloadFile } from "../utils";
import { Icon } from "./ui";

interface Props {
  system: WorkSystem;
  locale: Locale;
  notify: (message: string) => void;
}

/**
 * One click turns the system into an official Agent Skills file:
 * YAML frontmatter plus Context, Rules, Red-team and the Evaluator rubric.
 */
export function SkillSection({ system, locale, notify }: Props) {
  const c = copyTable[locale];
  const text = useMemo(() => buildSkillMd(system, locale), [system, locale]);
  const slug = skillSlug(system);

  const copy = async () => {
    const ok = await copyText(text);
    notify(ok ? c.skill.copied : c.app.cancel);
  };

  const download = () => {
    downloadFile("SKILL.md", text, "text/markdown;charset=utf-8");
    notify(c.skill.downloaded);
  };

  return (
    <section className="skill-block" aria-labelledby="skill-heading">
      <div className="preview-head">
        <h3 id="skill-heading">{c.skill.title}</h3>
        <span className="field-count">{slug}/SKILL.md</span>
      </div>
      <p className="section-note">{c.skill.intro}</p>
      <p className="skill-facts">{c.skill.included}</p>
      <pre className="preview tall skill-preview" tabIndex={0}>
        {text}
      </pre>
      <div className="skill-actions">
        <button type="button" className="btn btn-primary" onClick={copy}>
          <Icon name="copy" />
          {c.skill.copy}
        </button>
        <button type="button" className="btn" onClick={download}>
          <Icon name="download" />
          {c.skill.download}
        </button>
      </div>
      <p className="section-note">{c.skill.note}</p>
    </section>
  );
}
