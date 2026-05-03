import { cn } from '@/utils/Helpers';

export const Section = (props: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  className?: string;
  id?: string;
}) => (
  <section id={props.id} className={cn('px-4 py-16 sm:px-6 lg:px-8', props.className)}>
    {(props.title || props.subtitle || props.description) && (
      <div className="mx-auto mb-12 max-w-screen-md text-center">
        {props.subtitle && (
          <div className="text-sm font-semibold tracking-wide text-cr-primary">
            {props.subtitle}
          </div>
        )}

        {props.title && (
          <h2 className="mt-1 text-3xl font-bold text-cr-fg">{props.title}</h2>
        )}

        {props.description && (
          <p className="mt-2 text-lg text-cr-fg-secondary">
            {props.description}
          </p>
        )}
      </div>
    )}

    <div className="mx-auto max-w-screen-lg">{props.children}</div>
  </section>
);
