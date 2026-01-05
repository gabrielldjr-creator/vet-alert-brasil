import { ComponentPropsWithRef, forwardRef } from "react";

type TextareaProps = ComponentPropsWithRef<"textarea"> & {
  label?: string;
  hint?: string;
  containerClassName?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, className = "", containerClassName = "", id, ...props }, ref) => {
    const textareaId = id || props.name;
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
          aria-describedby={hint ? `${textareaId}-hint` : undefined}
          {...props}
        />
        {hint && (
          <span id={`${textareaId}-hint`} className="text-xs text-slate-500">
            {hint}
          </span>
        )}
      </label>
    );
  },
);

Textarea.displayName = "Textarea";
