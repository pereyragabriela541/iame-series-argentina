import PageHeader from "@/components/PageHeader";
import { DbSetupBanner, EmptyState, PdfLink } from "@/components/ui";
import type { FormDoc } from "@/lib/types";
import { getForms } from "@/lib/queries";

export const metadata = { title: "Formularios | IAME Series Argentina" };

export default async function FormulariosPage() {
  let forms: FormDoc[] = [];
  let dbReady = true;
  try {
    forms = await getForms();
  } catch {
    dbReady = false;
  }

  return (
    <div className="space-y-6">
      {!dbReady && <DbSetupBanner />}
      <PageHeader kicker="Documentos" title="Formularios" />
      {forms.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {forms.map((f) => (
            <PdfLink key={f.id} href={f.pdf_url} label={f.title} />
          ))}
        </div>
      ) : (
        <EmptyState message="Sin formularios publicados." />
      )}
    </div>
  );
}
