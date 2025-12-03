import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  status?: 'Normal' | 'Warning' | 'Critical' | 'Neutral';
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  unit, 
  status = 'Neutral', 
  icon,
  children,
  className = ''
}) => {
  const statusColors = {
    Normal: 'text-teal-600 bg-teal-50 border-teal-100',
    Warning: 'text-amber-600 bg-amber-50 border-amber-100',
    Critical: 'text-rose-600 bg-rose-50 border-rose-100',
    Neutral: 'text-slate-600 bg-white border-slate-100',
  };

  return (
    <div className={`p-4 rounded-xl border shadow-sm ${statusColors[status]} ${className}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium opacity-80 uppercase tracking-wide">{title}</span>
        {icon && <div className="opacity-70">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        {unit && <span className="text-sm font-medium opacity-70">{unit}</span>}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
};
