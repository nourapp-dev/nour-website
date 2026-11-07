"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { countries, type Language } from "../utils/partner-interest-form";
import styles from "./partnership.module.css";

type Props = {
  id: string; label: string; value: string; onChange: (value: string) => void;
  language: Language; error?: string; disabled?: boolean; optional?: boolean;
};
export default function CountrySelect({ id, label, value, onChange, language, error, disabled, optional }: Props) {
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const ar = language === "ar";
  const selected = countries.find(c => c.code === value);
  const options = useMemo(() => {
    const search = (query ?? "").toLocaleLowerCase().trim();
    return countries.filter(c => `${c.ar} ${c.en} ${c.code}`.toLocaleLowerCase().includes(search))
      .sort((a, b) => a[language].localeCompare(b[language], language));
  }, [query, language]);
  useEffect(() => {
    if (open && options[active]) document.getElementById(`${listId}-${options[active].code}`)?.scrollIntoView?.({ block: "nearest", behavior: "instant" });
  }, [active, open, options, listId]);
  function choose(code: string) { onChange(code); setQuery(null); setOpen(false); setActive(0); }
  return <div className={styles.country} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) { setOpen(false); setQuery(null); }
  }}>
    <label htmlFor={id}>{label}{!optional && <span aria-hidden="true"> *</span>}</label>
    <input id={id} type="text" role="combobox" aria-autocomplete="list" aria-expanded={open}
      aria-controls={listId} aria-required={!optional} aria-activedescendant={open && options[active] ? `${listId}-${options[active].code}` : undefined}
      aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} autoComplete="off" disabled={disabled}
      value={query ?? (selected?.[language] ?? "")} placeholder={ar ? "ابحث باسم الدولة" : "Search for a country"}
      onFocus={() => { setOpen(true); setQuery(""); setActive(0); }}
      onClick={() => { setOpen(true); setActive(0); }}
      onChange={event => { setQuery(event.target.value); setOpen(true); setActive(0); if (value) onChange(""); }}
      onKeyDown={event => {
        if (event.key === "Escape") { event.preventDefault(); setOpen(false); setQuery(null); }
        if (["ArrowDown", "ArrowUp"].includes(event.key)) {
          event.preventDefault(); setOpen(true);
          setActive(current => Math.max(0, Math.min(options.length - 1, current + (event.key === "ArrowDown" ? 1 : -1))));
        }
        if (event.key === "Enter") { event.preventDefault(); event.stopPropagation(); if (open && options[active]) choose(options[active].code); }
      }} />
    {open && !disabled && <ul id={listId} role="listbox" aria-label={label} className={styles.countryOptions}>
      {options.length ? options.map((country, index) => <li key={country.code} id={`${listId}-${country.code}`} role="option"
        aria-selected={country.code === value} data-active={index === active} onMouseDown={event => event.preventDefault()}
        onMouseEnter={() => setActive(index)} onClick={() => choose(country.code)}>{country[language]} <small>{country.code}</small></li>) :
        <li role="option" aria-disabled="true" aria-selected="false">{ar ? "لا توجد نتائج" : "No results"}</li>}
    </ul>}
    {error && <span className={styles.error} id={`${id}-error`}>{error}</span>}
  </div>;
}
