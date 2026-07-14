import type { LegalSection } from "@/lib/legal-content";

interface LegalDocumentProps {
  sections: LegalSection[];
  lastUpdated: string;
}

export default function LegalDocument({ sections, lastUpdated }: LegalDocumentProps) {
  return (
    <article className="space-y-8 border border-neutral-800 bg-neutral-900/30 p-6 sm:p-8">
      <p className="text-xs text-neutral-500">Última actualización: {lastUpdated}</p>

      {sections.map((section) => (
        <section key={section.title} className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">
            {section.title}
          </h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-relaxed text-neutral-400">
              {paragraph}
            </p>
          ))}
          {section.list && (
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-400">
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}
