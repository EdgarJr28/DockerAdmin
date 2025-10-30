"use client";
import * as React from "react";

type Option = { value: string | number; label: string; disabled?: boolean };

type Props = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> & {
  value: string | number;
  onChange: (value: string) => void;
  options: Option[];
};

export default function Select({
  value,
  onChange,
  options,
  className = "",
  ...rest
}: Props) {
  return (
    <div
      className={`relative inline-flex ${
        rest.disabled ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      <select
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          // base
          "appearance-none px-3 pr-9 py-2 rounded-lg border text-sm outline-none",
          "bg-(--surface-bg) border-color:(--surface-border) text-(--text)",
          "focus:ring-2 focus:ring-var(--accent)/30 focus:border-var(--accent)",
          "transition-colors",
          className,
        ].join(" ")}
      >
        {options.map((op) => (
          <option
            key={String(op.value)}
            value={op.value}
            disabled={op.disabled}
          >
            {op.label}
          </option>
        ))}
      </select>
    </div>
  );
}
