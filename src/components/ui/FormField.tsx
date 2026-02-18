'use client';

import { useId } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

interface FormFieldInputProps {
  kind?: 'input';
  label: string;
  value: string | number;
  readonly?: boolean;
  type?: 'text' | 'number';
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string | number) => void;
  className?: string;
}

interface FormFieldTextareaProps {
  kind: 'textarea';
  label: string;
  value: string;
  readonly?: boolean;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  onChange?: (value: string) => void;
  className?: string;
}

interface FormFieldCheckboxProps {
  kind: 'checkbox';
  label: string;
  value: boolean | null | undefined;
  triState?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  onChange?: (value: boolean | undefined) => void;
}

interface FormFieldSelectProps {
  kind: 'select';
  label: string;
  value: string;
  readonly?: boolean;
  disabled?: boolean;
  options: string[];
  placeholder?: string;
  onChange?: (value: string) => void;
  className?: string;
}

type FormFieldProps = FormFieldInputProps | FormFieldTextareaProps | FormFieldCheckboxProps | FormFieldSelectProps;

export function FormField(props: FormFieldProps) {
  const id = useId();

  if (props.kind === 'textarea') {
    const { label, value, readonly, placeholder, disabled, rows, onChange, className = 'bg-gray-700 border-gray-600' } = props;
    return (
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <Textarea
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readonly}
          rows={rows}
          className={className}
        />
      </div>
    );
  }

  if (props.kind === 'select') {
    const { label, value, readonly, disabled, options, placeholder, onChange, className = 'bg-gray-700 border-gray-600' } = props;
    return (
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <Select
          value={value || ''}
          onValueChange={(v) => onChange?.(v)}
          disabled={readonly ?? disabled}
        >
          <SelectTrigger className={className}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (props.kind === 'checkbox') {
    const { label, value, triState, readonly, disabled, onChange } = props;
    const checked = value === true ? true : value === false ? false : (triState ? 'indeterminate' : false);
    const handleChange = (next: boolean | 'indeterminate') => {
      if (readonly || !onChange) return;
      const nextValue = triState
        ? (next === 'indeterminate' ? undefined : (value === false && next === true ? undefined : next))
        : !!next;
      onChange(nextValue);
    };
    return (
      <label htmlFor={id} className="block cursor-pointer">
        <span className="block text-sm font-medium text-gray-300 mb-1">{label}</span>
        <div className="flex h-9 w-full items-center rounded-md border border-gray-600 bg-gray-700 px-3">
          <Checkbox
            id={id}
            checked={checked}
            triState={triState}
            disabled={readonly ?? disabled}
            onCheckedChange={handleChange}
          />
        </div>
      </label>
    );
  }

  const {
    label,
    value,
    readonly,
    type = 'text',
    placeholder,
    disabled,
    onChange,
    className = 'bg-gray-700 border-gray-600',
  } = props;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <Input
        type={type}
        value={value ?? ''}
        onChange={(e) => {
          if (onChange) {
            const v = e.target.value;
            onChange(type === 'number' ? (v ? Number(v) : 0) : v);
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readonly}
        className={className}
      />
    </div>
  );
}
