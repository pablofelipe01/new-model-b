"use client";

import { Component, type ReactNode } from "react";

interface Props {
  label: string;
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/** Keeps a crashing panel from taking down the whole dev page. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            border: "0.5px solid var(--state-danger)",
            borderRadius: "var(--radius-md)",
            padding: 16,
            color: "var(--state-danger)",
            fontSize: 13,
          }}
        >
          <strong>{this.props.label}</strong> falló de forma aislada (la página
          sigue viva).
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8, fontSize: 12 }}>
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
