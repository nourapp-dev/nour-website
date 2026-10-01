"use client";

import CountryForm, { type CountryFormValues } from "../forms/CountryForm";
import type { Country } from "../types";

type CountryDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  country?: Country;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: CountryFormValues) => Promise<void>;
};

export default function CountryDialog({
  open,
  mode,
  country,
  isSubmitting,
  onClose,
  onSubmit,
}: CountryDialogProps) {
  if (!open) return null;

  return (
    <div className="nr-dialog-overlay">
      <div className="nr-dialog">

        <div className="nr-dialog-header">
          <h2>
            {mode === "create"
              ? "إضافة دولة"
              : "تعديل الدولة"}
          </h2>

          <button
            type="button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <CountryForm
          initialValues={country}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
        />

      </div>
    </div>
  );
}
