'use client';

import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar as CalendarIcon } from 'lucide-react';

interface AdminDatePickerProps {
  label?: string;
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  error?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  showTimeSelect?: boolean;
  dateFormat?: string;
  isClearable?: boolean;
  disabled?: boolean;
  id?: string;
}

export function AdminDatePicker({
  label,
  selected,
  onChange,
  error,
  placeholder = 'Select date',
  minDate,
  maxDate,
  showTimeSelect,
  dateFormat = 'dd/MM/yyyy',
  isClearable,
  disabled,
  id,
}: AdminDatePickerProps) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gold-700 dark:text-gold-300">
          {label}
        </label>
      )}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gold-400 z-10">
          <CalendarIcon size={16} />
        </div>
        <DatePicker
          id={id}
          selected={selected}
          onChange={onChange}
          placeholderText={placeholder}
          minDate={minDate}
          maxDate={maxDate}
          showTimeSelect={showTimeSelect}
          dateFormat={dateFormat}
          isClearable={isClearable}
          disabled={disabled}
          className={`w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gold-900 border rounded-lg text-sm text-gold-800 dark:text-gold-100 placeholder-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-colors ${
            error
              ? 'border-red-500 ring-1 ring-red-500'
              : 'border-gold-200 dark:border-gold-700 hover:border-gold-300 dark:hover:border-gold-600'
          }`}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default AdminDatePicker;
