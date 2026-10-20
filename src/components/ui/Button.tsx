import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'destructive';
  children: React.ReactNode;
}

/**
 * Brand button primitive with custom variant stylings matching HPRH aesthetics.
 * Utilizes monospace, tracking, and uppercase text for a warm tactile layout.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-sans text-xs font-semibold py-2.5 px-5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer';
  
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-500 hover:to-indigo-600 hover:shadow-md hover:shadow-indigo-500/20 border border-transparent focus:ring-indigo-600 focus:ring-offset-white',
    secondary: 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs focus:ring-indigo-600 focus:ring-offset-white',
    ghost: 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100 border border-transparent shadow-none focus:ring-indigo-600 focus:ring-offset-white',
    success: 'bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-500/20 border border-transparent focus:ring-emerald-600 focus:ring-offset-white',
    destructive: 'bg-rose-600 text-white hover:bg-rose-500 hover:shadow-md hover:shadow-rose-500/20 border border-transparent focus:ring-rose-600 focus:ring-offset-white',
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
