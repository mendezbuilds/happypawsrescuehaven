import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Base card primitive using the brand's 'paper-dark' background and subtle dark borders.
 */
export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
