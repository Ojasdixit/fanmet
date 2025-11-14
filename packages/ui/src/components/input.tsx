import { forwardRef } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

interface BaseFieldProps {
  label?: string;
  helperText?: string;
  error?: string;
  requiredIndicator?: boolean;
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & BaseFieldProps;

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & BaseFieldProps;

const labelStyles = 'mb-2 block text-sm font-semibold text-[#212529]';
const helperTextStyles = 'mt-1 text-sm text-[#6C757D]';
const errorTextStyles = 'mt-1 text-sm text-[#E63946]';

const inputBaseStyles =
  'w-full rounded-[8px] border-2 border-[#E9ECEF] bg-white px-4 py-3 text-base transition-colors focus:border-[#FF6B35] focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8F9FA]';

export const TextInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, requiredIndicator = true, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="flex w-full flex-col">
        {label && (
          <label className={labelStyles} htmlFor={inputId}>
            {label}
            {props.required && requiredIndicator ? (
              <span className="ml-1 text-[#E63946]">*</span>
            ) : null}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(inputBaseStyles, error && 'border-[#E63946] focus:shadow-none', className)}
          {...props}
        />
        {error ? (
          <span className={errorTextStyles}>{error}</span>
        ) : helperText ? (
          <span className={helperTextStyles}>{helperText}</span>
        ) : null}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, helperText, error, requiredIndicator = true, className, id, rows = 4, ...props }, ref) => {
    const textareaId = id ?? props.name;

    return (
      <div className="flex w-full flex-col">
        {label && (
          <label className={labelStyles} htmlFor={textareaId}>
            {label}
            {props.required && requiredIndicator ? (
              <span className="ml-1 text-[#E63946]">*</span>
            ) : null}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={clsx(
            inputBaseStyles,
            'resize-y',
            error && 'border-[#E63946] focus:shadow-none',
            className
          )}
          {...props}
        />
        {error ? (
          <span className={errorTextStyles}>{error}</span>
        ) : helperText ? (
          <span className={helperTextStyles}>{helperText}</span>
        ) : null}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
