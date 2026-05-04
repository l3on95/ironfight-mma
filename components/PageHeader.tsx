export default function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-carbon-500/60 bg-carbon-800/30">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        {eyebrow && (
          <div className="text-xs font-bold uppercase tracking-widest text-blood">
            {eyebrow}
          </div>
        )}
        <h1 className="heading-display mt-2 text-4xl font-black sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-foreground/70">{description}</p>
        )}
      </div>
    </div>
  );
}
