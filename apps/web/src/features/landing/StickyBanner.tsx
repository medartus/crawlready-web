export const StickyBanner = (props: { children: React.ReactNode }) => (
  <div className="bg-primary text-primary-foreground sticky top-0 z-50 p-4 text-center text-lg font-semibold [&_a:hover]:text-indigo-500 [&_a]:text-fuchsia-500">
    {props.children}
  </div>
);
