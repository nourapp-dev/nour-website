"use client";
import {useLanguage} from '../../../core/i18n';
import type {
  ReactNode,
  TableHTMLAttributes,
} from "react";

type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  children: ReactNode;
};

export default function Table({
  children,
  className = "",
  ...props
}: TableProps) {
  const {language}=useLanguage();
  return (
    <div className="nr-table-wrapper" role="region" tabIndex={0} aria-label={language==='ar'?'جدول البيانات — يمكن التمرير أفقيًا':'Data table — scroll horizontally'}>
      <table
        className={`nr-table ${className}`.trim()}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}
