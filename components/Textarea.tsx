import { ComponentPropsWithRef, forwardRef } from "react";

type TextareaProps = ComponentPropsWithRef<"textarea"> & {
  label?: string;
  hint?: string;
  helper?: string;
  containerClassName?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, hint, helper, className = "", containerClassName = "", id, ...props },
    ref,
  ) => {
    const textareaId = id || props.name;
    const describedBy = [
      hint ? `${textareaId}-hint` : undefined,
      helper ? `${textareaId}-helper` : undefined,
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
        htmlFor={textareaId}
      >
        {label && <span className="text-sm font-semibold text-slate-800">{label}</span>}
        <textarea
          ref={ref}
          id={textareaId}
          className={classes}
          aria-describedby={describedBy}
          {...props}
        />
        {hint && (
          <span id={`${textareaId}-hint`} className="text-xs text-slate-500">
            {hint}
          </span>
        )}
        {helper && (
          <span id={`${textareaId}-helper`} className="text-xs text-slate-500">
            {helper}
          </span>
        )}
      </label>
    );
  },
);

Textarea.displayName = "Textarea";
