import { ComponentPropsWithRef, forwardRef } from "react";

type SelectProps = ComponentPropsWithRef<"select"> & {
  label?: string;
  hint?: string;
  helper?: string;
  containerClassName?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, hint, helper, className = "", containerClassName = "", id, children, ...props },
    ref,
  ) => {
    const selectId = id || props.name;
    const describedBy = [
      hint ? `${selectId}-hint` : undefined,
      helper ? `${selectId}-helper` : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
    const classes = [
      "w-full rounded-xl border border-emerald-100 bg-white px-3.5 py-2.5 text-base text-slate-900 shadow-sm transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <label
        className={["flex flex-col gap-2", containerClassName].filter(Boolean).join(" ")}
        htmlFor={selectId}
      >
        {label && <span className="text-sm font-semibold text-slate-800">{label}</span>}
        <select
          ref={ref}
          id={selectId}
          className={classes}
          aria-describedby={describedBy}
          {...props}
        >
          {children}
        </select>
        {hint && (
          <span id={`${selectId}-hint`} className="text-xs text-slate-500">
            {hint}
          </span>
        )}
        {helper && (
          <span id={`${selectId}-helper`} className="text-xs text-slate-500">
            {helper}
          </span>
        )}
      </label>
    );
  },
);

Select.displayName = "Select";
