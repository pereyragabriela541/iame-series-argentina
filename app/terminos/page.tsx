import Link from "next/link";
import LegalDocument from "@/components/LegalDocument";
import PageHeader from "@/components/PageHeader";
import { LEGAL_LAST_UPDATED, TERMS_SECTIONS } from "@/lib/legal-content";

export const metadata = {
  title: "Términos y Condiciones | IAME Series Argentina",
  description:
    "Términos y condiciones de uso del sitio oficial de IAME Series Argentina.",
};

export default function TerminosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Legal"
        title="Términos y Condiciones"
        subtitle="Condiciones de uso del sitio web oficial del campeonato"
      />
      <LegalDocument sections={TERMS_SECTIONS} lastUpdated={LEGAL_LAST_UPDATED} />
      <p className="text-xs text-neutral-500">
        Consultá también nuestra{" "}
        <Link href="/privacidad" className="text-iame-sky hover:underline">
          política de privacidad
        </Link>
        .
      </p>
    </div>
  );
}
