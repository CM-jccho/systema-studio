import { useEffect, useRef, type ReactNode, type TextareaHTMLAttributes } from "react";

export function Field({
  label,
  hint,
  htmlFor,
  children,
  action,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="field">
      <div className="field-head">
        <label className="field-label" htmlFor={htmlFor}>
          {label}
        </label>
        {action}
      </div>
      {hint ? <p className="field-hint">{hint}</p> : null}
      {children}
    </div>
  );
}

export function TextArea({
  value,
  onChange,
  id,
  placeholder,
  rows = 4,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  rows?: number;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.max(node.scrollHeight, 44)}px`;
  }, [value]);

  const props: TextareaHTMLAttributes<HTMLTextAreaElement> = {
    id,
    value,
    rows,
    placeholder,
    "aria-label": ariaLabel,
    onChange: (event) => onChange(event.target.value),
  };

  return <textarea ref={ref} {...props} className="input textarea" />;
}

export function Toggle({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  id?: string;
}) {
  return (
    <button
      type="button"
      id={id}
      className={`toggle${checked ? " is-on" : ""}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-thumb" />
      </span>
    </button>
  );
}

export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      <p className="empty-body">{body}</p>
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}

export function Icon({ name, size = 16 }: { name: "plus" | "copy" | "trash" | "check" | "chevron" | "close" | "download" | "play" | "stop"; size?: number }) {
  const paths: Record<string, ReactNode> = {
    plus: <path d="M8 3v10M3 8h10" />,
    copy: (
      <>
        <rect x="5.5" y="5.5" width="8" height="8" rx="1" />
        <path d="M10.5 5.5V3.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
      </>
    ),
    trash: <path d="M3 5h10M6.5 5V3.5h3V5M5 5l.6 8h4.8L11 5" />,
    check: <path d="M3 8.5l3.2 3L13 4.5" />,
    chevron: <path d="M6 3.5L10.5 8 6 12.5" />,
    close: <path d="M4 4l8 8M12 4l-8 8" />,
    download: <path d="M8 3v7M4.8 7.2L8 10.5l3.2-3.3M3 13h10" />,
    play: <path d="M4.5 2.8v10.4L13 8z" />,
    stop: <rect x="4" y="4" width="8" height="8" rx="1" />,
  };
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
