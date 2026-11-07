"use client";

import { useLanguage } from "../i18n";
import {useId} from 'react';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export default function Pagination({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions = [10, 25, 50],
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const pageSizeId=useId();

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <nav
      className="nr-pagination"
      aria-label={
        isArabic
          ? "التنقل بين الصفحات"
          : "Pagination navigation"
      }
    >
      <div className="nr-pagination-size">
        <label htmlFor={pageSizeId}>
          {isArabic ? "عدد الصفوف" : "Rows per page"}
        </label>

        <select
          id={pageSizeId}
          className="nr-pagination-select"
          value={pageSize}
          onChange={(event) => {
            onPageSizeChange(Number(event.target.value));
          }}
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="nr-pagination-navigation">
        <button
          type="button"
          className="nr-secondary-button"
          disabled={!canGoPrevious}
          onClick={() => onPageChange(currentPage - 1)}
        >
          {isArabic ? "السابق" : "Previous"}
        </button>

        <span className="nr-pagination-status">
          {isArabic
            ? `الصفحة ${currentPage} من ${totalPages}`
            : `Page ${currentPage} of ${totalPages}`}
        </span>

        <button
          type="button"
          className="nr-secondary-button"
          disabled={!canGoNext}
          onClick={() => onPageChange(currentPage + 1)}
        >
          {isArabic ? "التالي" : "Next"}
        </button>
      </div>
    </nav>
  );
}
