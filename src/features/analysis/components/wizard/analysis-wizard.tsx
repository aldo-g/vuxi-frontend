"use client";

import React from "react";

/**
 * Limited deployment placeholder:
 * - Removes any dependency on `AnalysisProgress` and other wizard steps.
 * - Keeps the named export `AnalysisWizard` so existing imports continue to work.
 * - Provides a minimal UI so pages that render the wizard won’t crash.
 */
export function AnalysisWizard({ onCancel }: { onCancel?: () => void }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        maxWidth: 640,
        margin: "24px auto",
      }}
    >
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
        Analysis Wizard (Limited)
      </h2>
      <p style={{ marginTop: 12, lineHeight: 1.6 }}>
        This is a limited deployment build. The full analysis flow is disabled
        for now. You can proceed with the rest of the app.
      </p>

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            border: "1px solid #e5e7eb",
            background: "white",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
