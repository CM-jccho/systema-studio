import { Component, type ErrorInfo, type ReactNode } from "react";
import { copy as copyTable } from "../i18n";
import { STORE_KEY } from "../storage";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("SYSTEMA render error", error.message, info.componentStack);
  }

  private exportData = () => {
    try {
      const raw = localStorage.getItem(STORE_KEY) ?? "{}";
      const blob = new Blob([raw], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "systema-backup.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      /* nothing else to do */
    }
  };

  render() {
    const c = copyTable.ko;
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="crash" role="alert">
        <h1>{c.errors.boundaryTitle}</h1>
        <p>{c.errors.boundaryBody}</p>
        <div className="crash-actions">
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            {c.errors.reload}
          </button>
          <button type="button" className="btn" onClick={this.exportData}>
            {c.errors.reset}
          </button>
        </div>
      </div>
    );
  }
}
