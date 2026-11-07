"use client";

import Button from "../../components/ui/Button";
import { useLanguage } from "../i18n";
import {useRef} from 'react';
import {useModalFocus} from '../../features/admin-workspace/useModalFocus';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const dialogRef=useRef<HTMLElement>(null);
  useModalFocus(open,dialogRef,onCancel,isLoading);

  const resolvedConfirmLabel =
    confirmLabel ??
    (isLoading
      ? isArabic
        ? "جارٍ التنفيذ..."
        : "Processing..."
      : isArabic
        ? "تأكيد"
        : "Confirm");

  const resolvedCancelLabel =
    cancelLabel ??
    (isArabic ? "إلغاء" : "Cancel");

  if (!open) {
    return null;
  }

  return (
    <div
      className="nr-modal-backdrop"
      role="presentation"
      onMouseDown={() => {
        if (!isLoading) {
          onCancel();
        }
      }}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        className="nr-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={
          description
            ? "confirm-dialog-description"
            : undefined
        }
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="nr-confirm-dialog-header">
          <h2 id="confirm-dialog-title">
            {title}
          </h2>

          <button
            type="button"
            className="nr-modal-close"
            aria-label={
              isArabic
                ? "إغلاق النافذة"
                : "Close dialog"
            }
            disabled={isLoading}
            onClick={onCancel}
          >
            ×
          </button>
        </div>

        {description ? (
          <p id="confirm-dialog-description">
            {description}
          </p>
        ) : null}

        <div className="nr-confirm-dialog-actions">
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading}
            onClick={onCancel}
          >
            {resolvedCancelLabel}
          </Button>

          <Button
            type="button"
            variant="danger"
            disabled={isLoading}
            onClick={onConfirm}
          >
            {resolvedConfirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
