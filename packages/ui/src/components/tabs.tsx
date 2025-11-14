import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode, ButtonHTMLAttributes, HTMLAttributes } from 'react';
import clsx from 'clsx';

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export const Tabs = ({ defaultValue, value, onValueChange, className, children, ...props }: TabsProps) => {
  const isControlled = typeof value !== 'undefined';
  const [internalValue, setInternalValue] = useState(defaultValue);

  const currentValue = isControlled ? value : internalValue;

  const context = useMemo(
    () => ({
      value: currentValue,
      setValue: (next: string) => {
        if (!isControlled) {
          setInternalValue(next);
        }
        onValueChange?.(next);
      },
    }),
    [currentValue, isControlled, onValueChange]
  );

  return (
    <TabsContext.Provider value={context}>
      <div className={clsx('flex flex-col gap-4', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('inline-flex flex-wrap items-center gap-2 border-b-2 border-[#E9ECEF]', className)} {...props} />
);

interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = ({ value, className, children, ...props }: TabsTriggerProps) => {
  const context = useTabsContext('TabsTrigger');
  const isActive = context.value === value;

  return (
    <button
      type="button"
      onClick={() => context.setValue(value)}
      className={clsx(
        'relative px-6 py-3 text-base font-semibold transition-colors',
        'text-[#6C757D] hover:text-[#212529]',
        isActive && 'text-[#FF6B35] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[3px] after:bg-[#FF6B35]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = ({ value, className, children, ...props }: TabsContentProps) => {
  const context = useTabsContext('TabsContent');

  if (context.value !== value) {
    return null;
  }

  return (
    <div className={clsx('animate-[fadeIn_0.3s_ease-out]', className)} {...props}>
      {children}
    </div>
  );
};

function useTabsContext(component: string) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error(`${component} must be used within <Tabs>`);
  }
  return context;
}
