interface ViewTabsProps {
  children: React.ReactNode;
}

export function ViewTabs({ children }: ViewTabsProps) {
  return <div className="w-full">{children}</div>;
}