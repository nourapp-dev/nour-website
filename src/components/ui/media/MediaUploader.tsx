"use client";

import { useEffect, useRef, useState } from "react";

import Button from "../Button";
import { useLanguage } from "../../../core/i18n";

type MediaUploaderProps = {
  label?: string;
  accept?: string;
  maxSizeMb?: number;
  initialPreviewUrl?: string | null;
  onFileSelect: (file: File | null) => void;
};

export default function MediaUploader({
  label,
  accept = "image/png,image/jpeg,image/webp,image/svg+xml",
  maxSizeMb = 10,
  initialPreviewUrl = null,
  onFileSelect,
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(initialPreviewUrl);

  const [errorMessage, setErrorMessage] =
    useState("");

  const resolvedLabel =
    label ??
    (isArabic ? "رفع صورة" : "Upload Image");

  const [previousInitialUrl, setPreviousInitialUrl] = useState(initialPreviewUrl);
  if (initialPreviewUrl !== previousInitialUrl) {
    setPreviousInitialUrl(initialPreviewUrl);
    setPreviewUrl(initialPreviewUrl);
  }

  useEffect(() => {
    return () => {
      if (
        previewUrl &&
        previewUrl.startsWith("blob:")
      ) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function validateFile(file: File) {
    const maxSizeBytes = maxSizeMb * 1024 * 1024;
    const acceptedTypes = accept
      .split(",")
      .map((type) => type.trim());

    if (!acceptedTypes.includes(file.type)) {
      throw new Error(
        isArabic
          ? "نوع الملف غير مدعوم."
          : "Unsupported file type.",
      );
    }

    if (file.size > maxSizeBytes) {
      throw new Error(
        isArabic
          ? `حجم الملف يجب ألا يتجاوز ${maxSizeMb} MB.`
          : `File size must not exceed ${maxSizeMb} MB.`,
      );
    }
  }

  function handleFile(file: File | null) {
    setErrorMessage("");

    if (!file) {
      clearFile();
      return;
    }

    try {
      validateFile(file);

      if (
        previewUrl &&
        previewUrl.startsWith("blob:")
      ) {
        URL.revokeObjectURL(previewUrl);
      }

      const nextPreviewUrl =
        URL.createObjectURL(file);

      setPreviewUrl(nextPreviewUrl);
      onFileSelect(file);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : isArabic
            ? "تعذر قراءة الملف."
            : "Unable to read the file.",
      );

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleDrop(
    event: React.DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();

    const file =
      event.dataTransfer.files?.[0] ?? null;

    handleFile(file);
  }

  function openFileDialog() {
    inputRef.current?.click();
  }

  function clearFile() {
    if (
      previewUrl &&
      previewUrl.startsWith("blob:")
    ) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setErrorMessage("");
    onFileSelect(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="nr-media-uploader">
      <div className="nr-media-uploader-heading">
        <span>{resolvedLabel}</span>

        <small>
          {isArabic
            ? `PNG أو JPG أو WEBP أو SVG — حتى ${maxSizeMb} MB`
            : `PNG, JPG, WEBP or SVG — up to ${maxSizeMb} MB`}
        </small>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(event) =>
          handleFile(
            event.target.files?.[0] ?? null,
          )
        }
      />

      <div
        className={`nr-media-dropzone ${
          previewUrl ? "has-preview" : ""
        }`}
        onDragOver={(event) =>
          event.preventDefault()
        }
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <div className="nr-media-preview">
            <img
              src={previewUrl}
              alt={
                isArabic
                  ? "معاينة الصورة"
                  : "Image preview"
              }
            />

            <div className="nr-media-preview-actions">
              <Button
                type="button"
                variant="outline"
                onClick={openFileDialog}
              >
                {isArabic
                  ? "تغيير الصورة"
                  : "Change Image"}
              </Button>

              <Button
                type="button"
                variant="danger"
                onClick={clearFile}
              >
                {isArabic
                  ? "حذف الصورة"
                  : "Remove Image"}
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="nr-media-dropzone-button"
            onClick={openFileDialog}
          >
            <span
              className="nr-media-dropzone-icon"
              aria-hidden="true"
            >
              ↑
            </span>

            <strong>
              {isArabic
                ? "اسحب الصورة هنا أو اضغط للاختيار"
                : "Drag an image here or click to select"}
            </strong>

            <small>
              {isArabic
                ? "سيتم عرض المعاينة قبل الرفع"
                : "A preview will appear before upload"}
            </small>
          </button>
        )}
      </div>

      {errorMessage ? (
        <p className="nr-media-uploader-error">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}