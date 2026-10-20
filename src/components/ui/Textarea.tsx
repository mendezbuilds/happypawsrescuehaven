import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

/**
 * Shared Textarea primitive for forms with modern rounded-xl styling and indigo focus ring.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-slate-700 select-none">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-4 py-3 text-sm text-slate-900 font-sans placeholder-slate-400 transition-all focus:outline-none min-h-[110px] resize-y ${
            error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10 bg-rose-50/30' : ''
          } ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs text-rose-600 font-medium">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
