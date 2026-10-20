import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

/**
 * Custom StatusTag / Badge primitive representing a hand-stamped label.
 * Rotated slightly, double/thick bordered, and styled with ink-like colors.
 */
export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const normalizedStatus = status.toUpperCase().trim();

  const baseStyle = 'inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold tracking-wide px-3 py-1 rounded-full select-none transition-all duration-150';
  
  let statusStyle = 'text-slate-600 bg-slate-100 ring-1 ring-slate-200';
  let dotColor = 'bg-slate-400';

  // 1. Success / Available / Active (Emerald)
  const emeraldStatuses = [
    'AVAILABLE',
    'APPROVED',
    'CONFIRMED',
    'PAID',
    'DELIVERED',
    'ACTIVE',
    'CLEARED',
    'SHIPPED',
    'EN_ROUTE',
    'ARRIVED_AT_HUB',
    'OUT_FOR_DELIVERY',
    'YES'
  ];

  // 2. Pending / Review (Sky / Indigo)
  const pendingStatuses = [
    'PENDING',
    'PENDING_REVIEW',
    'SUBMITTED',
    'ASSIGNED',
    'DEPOSIT_PENDING',
    'PREPARING',
    'PENDING AUDIT'
  ];

  // 3. Rose / Urgent / Closed (Rose)
  const roseStatuses = [
    'REJECTED',
    'CANCELLED',
    'ON_HOLD',
    'MEDICAL_HOLD',
    'ADOPTED',
    'NO'
  ];

  if (emeraldStatuses.includes(normalizedStatus)) {
    statusStyle = 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-600/20';
    dotColor = 'bg-emerald-500 animate-pulse';
  } else if (pendingStatuses.includes(normalizedStatus)) {
    statusStyle = 'text-indigo-700 bg-indigo-50 ring-1 ring-indigo-600/20';
    dotColor = 'bg-indigo-500';
  } else if (roseStatuses.includes(normalizedStatus)) {
    statusStyle = 'text-rose-700 bg-rose-50 ring-1 ring-rose-600/20';
    dotColor = 'bg-rose-500';
  } else if (normalizedStatus === 'NOT_LISTED' || normalizedStatus === 'INACTIVE' || normalizedStatus === 'IN_FOSTER') {
    statusStyle = 'text-sky-700 bg-sky-50 ring-1 ring-sky-600/20';
    dotColor = 'bg-sky-500';
  }

  return (
    <span className={`${baseStyle} ${statusStyle} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      <span>{status}</span>
    </span>
  );
};

export default Badge;
