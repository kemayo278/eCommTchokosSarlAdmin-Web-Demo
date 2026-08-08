import type { StylesConfig } from "react-select";

export type SelectOption = { value: number; label: string };

export const selectStyles: StylesConfig<SelectOption> = {
  control: (base, state) => ({
    ...base,
    minHeight: "42px",
    borderRadius: "12px",
    borderColor: state.isFocused ? "var(--color-primary)" : "#e2e8f0",
    boxShadow: state.isFocused
      ? "0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent)"
      : "none",
    backgroundColor: "#fff",
    fontSize: "14px",
    "&:hover": { borderColor: state.isFocused ? "var(--color-primary)" : "#cbd5e1" },
  }),
  valueContainer: (base) => ({ ...base, padding: "0 10px" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({ ...base, padding: "0 8px", color: "#94a3b8" }),
  clearIndicator: (base) => ({ ...base, padding: "0 4px", color: "#94a3b8", cursor: "pointer" }),
  menu: (base) => ({
    ...base,
    borderRadius: "12px",
    border: "1px solid #f1f5f9",
    boxShadow: "0 4px 16px rgba(0,0,0,.08)",
    overflow: "hidden",
    zIndex: 50,
  }),
  menuList: (base) => ({ ...base, padding: "4px" }),
  option: (base, state) => ({
    ...base,
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: state.isSelected
      ? "var(--color-primary)"
      : state.isFocused
      ? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
      : "transparent",
    color: state.isSelected ? "#fff" : "var(--color-secondary)",
    cursor: "pointer",
  }),
  placeholder: (base) => ({ ...base, color: "#94a3b8" }),
  singleValue: (base) => ({ ...base, color: "var(--color-secondary)" }),
};
