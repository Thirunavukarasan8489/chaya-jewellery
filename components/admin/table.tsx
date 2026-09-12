import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Search } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TableProps {
  columns: string[];
  children: React.ReactNode;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  filters?: React.ReactNode;
}

export function Table({ columns, children, searchPlaceholder = "Search...", onSearch, filters }: TableProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {/* Table Header / Toolbar */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
        {onSearch && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
        <div className="flex gap-2 w-full sm:w-auto">
          {filters}
        </div>
      </div>
      
      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} scope="col" className="px-6 py-3 font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TableRow({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <tr className={cn("bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors", className)}>
      {children}
    </tr>
  );
}

export function TableCell({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <td className={cn("px-6 py-4 align-middle", className)}>
      {children}
    </td>
  );
}
