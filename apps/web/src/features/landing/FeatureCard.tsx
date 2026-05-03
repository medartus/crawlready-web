export const FeatureCard = (props: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border border-cr-border bg-cr-bg p-5">
    <div className="flex size-12 items-center justify-center rounded-lg bg-cr-primary p-2 [&_svg]:stroke-cr-primary-fg [&_svg]:stroke-2">
      {props.icon}
    </div>

    <h3 className="mt-3 text-lg font-semibold text-cr-fg">{props.title}</h3>

    <p className="mt-2 text-cr-fg-secondary">{props.children}</p>
  </div>
);
