import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Shared Input form primitive with modern rounded-xl styling,
 * smooth focus rings, and clear error / helper indicators.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-slate-700 select-none">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-4 py-3 text-sm text-slate-900 font-sans placeholder-slate-400 transition-all focus:outline-none ${
            error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10 bg-rose-50/30' : ''
          } ${className}`}
          {...props}
        />
        {error ? (
          <span className="text-xs text-rose-600 font-medium">
            {error}
          </span>
        ) : helperText ? (
          <span className="text-xs text-slate-500">
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
