import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function AccountField({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  className?: string;
  children?: ReactNode;
}) {
  const control =
    error && isValidElement(children)
      ? cloneElement(children as ReactElement<{ error?: string }>, { error })
      : children;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {control}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function AccountInput({
  error,
  ...props
}: React.ComponentProps<typeof Input> & { error?: string }) {
  return <Input aria-invalid={error ? true : undefined} {...props} />;
}
