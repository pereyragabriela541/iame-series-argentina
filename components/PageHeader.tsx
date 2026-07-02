interface PageHeaderProps {
  kicker?: string;
  title: string;
  subtitle?: string;
}

export default function PageHeader({ kicker, title, subtitle }: PageHeaderProps) {
  return (
    <header className="racing-stripe pl-4">
      {kicker && (
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-iame-red">
          {kicker}
        </p>
      )}
      <h1 className="text-2xl font-bold uppercase tracking-wide text-white sm:text-3xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>
      )}
    </header>
  );
}
