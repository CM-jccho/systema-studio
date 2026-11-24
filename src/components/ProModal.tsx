import { useEffect, useRef } from "react";
import type { Locale } from "../types";
import { copy as copyTable } from "../i18n";
import { PRO_PACK_AVAILABLE, STORE_URL } from "../config";
import { Icon } from "./ui";

export function ProModal({ locale, onClose }: { locale: Locale; onClose: () => void }) {
  const c = copyTable[locale];
  const ref = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="pro-title"
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="modal-inner">
        <div className="modal-head">
          <h2 id="pro-title">{c.pro.title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={c.pro.close}>
            <Icon name="close" />
          </button>
        </div>
        <p className="modal-intro">{c.pro.intro}</p>

        <div className="pack-grid">
          {c.pro.packs.map((pack, index) => (
            <div key={pack.title} className={`pack${pack.free ? " is-free" : ""}`}>
              <span className="pack-no">{String(index + 1).padStart(2, "0")}</span>
              <div className="pack-body">
                <h3>{pack.title}</h3>
                <p>{pack.desc}</p>
              </div>
              <span className={`pack-badge${pack.free ? " is-free" : ""}`}>
                {pack.free ? c.pro.freeBadge : c.pro.proBadge}
              </span>
            </div>
          ))}
        </div>

        <div className="modal-foot">
          <div>
            <h3>{c.pro.included}</h3>
            <ul className="included-list">
              {c.pro.includedItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="modal-note">{c.pro.freeNote}</p>
          </div>
          <div className="modal-cta">
            {PRO_PACK_AVAILABLE ? (
              <a className="btn btn-primary" href={STORE_URL} target="_blank" rel="noreferrer">
                {c.pro.storeCta}
              </a>
            ) : (
              <>
                <span className="soon">{c.pro.comingSoon}</span>
                <a className="link-btn" href={STORE_URL} target="_blank" rel="noreferrer">
                  {c.pro.storeCta}
                </a>
              </>
            )}
            <button type="button" className="btn" onClick={onClose}>
              {c.pro.close}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
