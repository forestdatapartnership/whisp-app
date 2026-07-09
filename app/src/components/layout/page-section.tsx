import { cn } from '@/lib/utils';
import { cardLayout } from '@/components/ui/styles';

export function PageSection({
  title,
  titleClassName,
  children,
  className,
}: {
  title: string;
  titleClassName?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('flex flex-col gap-4', className)}>
      <h2 className={cn('text-[11px] font-medium uppercase tracking-widest text-text-muted', titleClassName)}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function CenteredShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-1 items-center justify-center w-full', className)}>
      {children}
    </div>
  );
}

export function ContentShell({
  children,
  className,
  wide,
  ...props
}: React.ComponentProps<'div'> & {
  wide?: boolean;
}) {
  return (
    <div
      {...props}
      className={cn(
        'flex min-h-0 w-full flex-1 flex-col',
        wide ? 'max-w-none' : `mx-auto ${cardLayout.lg}`,
        className
      )}
    >
      {children}
    </div>
  );
}
