import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  iconColor?: 'blue' | 'green' | 'red' | 'purple' | 'amber';
  className?: string;
}

export default function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  iconColor = 'blue',
  className,
}: KpiCardProps) {
  
  const colorMap = {
    blue: 'bg-plum-100 text-plum-800 dark:bg-plum-800 dark:text-plum-200 border border-plum-200 dark:border-plum-700',
    green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    red: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    purple: 'bg-plum-100 text-plum-800 dark:bg-plum-800 dark:text-plum-200 border border-plum-200 dark:border-plum-700',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
  };

  return (
    <div className={cn("bg-white dark:bg-plum-900 rounded-xl p-6 shadow-xs border border-gray-200 dark:border-plum-800 transition-all hover:border-plum-400/50 hover:shadow-md", className)}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-plum-600 dark:text-plum-300">{title}</p>
          <h3 className="text-2xl font-bold text-plum-900 dark:text-ivory-100 mt-2">{value}</h3>
        </div>
        <div className={cn("p-3 rounded-xl", colorMap[iconColor])}>
          <Icon size={24} />
        </div>
      </div>
      
      {trend && trendValue && (
        <div className="mt-4 flex items-center gap-1.5 text-sm">
          {trend === 'up' && <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />}
          {trend === 'down' && <TrendingDown size={16} className="text-rose-600 dark:text-rose-400" />}
          {trend === 'neutral' && <Minus size={16} className="text-plum-400" />}
          
          <span className={cn(
            "font-semibold",
            trend === 'up' ? "text-emerald-700 dark:text-emerald-400" : "",
            trend === 'down' ? "text-rose-700 dark:text-rose-400" : "",
            trend === 'neutral' ? "text-plum-600 dark:text-plum-300" : ""
          )}>
            {trendValue}
          </span>
          <span className="text-plum-500 dark:text-plum-400 ml-1">vs last month</span>
        </div>
      )}
    </div>
  );
}
