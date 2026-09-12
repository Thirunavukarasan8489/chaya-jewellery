'use client';

import React, { useId } from 'react';
import Select, { Props as SelectProps, GroupBase } from 'react-select';

export interface AdminSelectOption {
  label: string;
  value: string | number;
  [key: string]: any;
}

interface AdminSelectCustomProps<
  Option = AdminSelectOption,
  IsMulti extends boolean = boolean,
  Group extends GroupBase<Option> = GroupBase<Option>
> extends SelectProps<Option, IsMulti, Group> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function AdminSelect<
  Option = AdminSelectOption,
  IsMulti extends boolean = boolean,
  Group extends GroupBase<Option> = GroupBase<Option>
>({
  label,
  error,
  helperText,
  className,
  ...props
}: AdminSelectCustomProps<Option, IsMulti, Group>) {
  const id = useId();

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-plum-900 dark:text-ivory-100">
          {label}
        </label>
      )}
      <Select
        instanceId={props.instanceId || props.name || id}
        unstyled
        className={`w-full ${className || ''}`}
        classNames={{
          control: ({ isFocused, isDisabled }) =>
            `flex items-center justify-between min-h-[42px] px-3 py-1 bg-white dark:bg-plum-950 border rounded-lg text-sm transition-colors ${
              isDisabled
                ? 'opacity-60 bg-gray-100 dark:bg-plum-900 cursor-not-allowed'
                : 'cursor-pointer'
            } ${
              error
                ? 'border-rose-500 ring-1 ring-rose-500'
                : isFocused
                ? 'border-plum-600 ring-2 ring-plum-600/20'
                : 'border-gray-300 dark:border-plum-700 hover:border-gray-400 dark:hover:border-plum-600'
            }`,
          valueContainer: () => 'flex items-center gap-1.5 flex-wrap text-plum-900 dark:text-ivory-100',
          singleValue: () => 'text-plum-900 dark:text-ivory-100 text-sm font-normal',
          multiValue: () => 'flex items-center bg-plum-100 dark:bg-plum-800 text-plum-900 dark:text-ivory-100 rounded px-2 py-0.5 text-xs font-medium gap-1 border border-plum-200 dark:border-plum-700',
          multiValueLabel: () => 'text-plum-900 dark:text-ivory-100',
          multiValueRemove: () => 'text-plum-500 hover:text-rose-600 cursor-pointer rounded-sm',
          placeholder: () => 'text-plum-400 text-sm',
          input: () => 'text-plum-900 dark:text-ivory-100 text-sm',
          menu: () => 'mt-1.5 bg-white dark:bg-plum-900 border border-gray-200 dark:border-plum-800 rounded-lg shadow-lg overflow-hidden z-50 py-1',
          menuList: () => 'max-h-60 overflow-y-auto text-sm',
          option: ({ isFocused, isSelected }) =>
            `px-3 py-2 cursor-pointer transition-colors text-sm ${
              isSelected
                ? 'bg-plum-900 text-ivory-100 font-medium'
                : isFocused
                ? 'bg-gray-100 dark:bg-plum-800 text-plum-900 dark:text-ivory-100'
                : 'text-plum-800 dark:text-plum-200'
            }`,
          noOptionsMessage: () => 'p-3 text-center text-sm text-plum-400',
          dropdownIndicator: () => 'p-1 text-plum-400 hover:text-plum-600 dark:hover:text-plum-200 cursor-pointer',
          clearIndicator: () => 'p-1 text-plum-400 hover:text-rose-500 cursor-pointer',
          indicatorSeparator: () => 'bg-gray-200 dark:bg-plum-700 my-1 mx-1.5 w-px',
        }}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-gold-400 mt-1">{helperText}</p>}
    </div>
  );
}

export default AdminSelect;
