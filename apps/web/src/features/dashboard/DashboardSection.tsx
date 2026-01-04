export const DashboardSection = (props: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="bg-card rounded-md p-5">
    <div className="max-w-3xl">
      <div className="text-lg font-semibold">{props.title}</div>

      <div className="text-muted-foreground mb-4 text-sm font-medium">
        {props.description}
      </div>

      {props.children}
    </div>
  </div>
);
