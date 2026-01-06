import { ComponentPropsWithRef, forwardRef } from "react";

type InputProps = ComponentPropsWithRef<"input"> & {
  label?: string;
  hint?: string;
  helper?: string;
  containerClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, hint, helper, className = "", containerClassName = "", id, ...props },
    ref,
  ) => {
    const inputId = id || props.name;
    const describedBy = [
      hint ? `${inputId}-hint` : undefined,
      helper ? `${inputId}-helper` : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
    const classes = [
      "w-full rounded-xl border border-emerald-100 bg-white px-3.5 py-2.5 text-base text-slate-900 shadow-sm transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <label
        className={["flex flex-col gap-2", containerClassName].filter(Boolean).join(" ")}
        htmlFor={inputId}
      >
        {label && <span className="text-sm font-semibold text-slate-800">{label}</span>}
        <input
          ref={ref}
          id={inputId}
          className={classes}
          aria-describedby={describedBy}
          {...props}
        />
        {hint && (
          <span id={`${inputId}-hint`} className="text-xs text-slate-500">
            {hint}
          </span>
        )}
        {helper && (
          <span id={`${inputId}-helper`} className="text-xs text-slate-500">
            {helper}
          </span>
        )}
      </label>
    );
  },
);

Input.displayName = "Input";
