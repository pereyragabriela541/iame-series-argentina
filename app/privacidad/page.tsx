import Link from "next/link";
import LegalDocument from "@/components/LegalDocument";
import PageHeader from "@/components/PageHeader";
import { LEGAL_LAST_UPDATED, PRIVACY_SECTIONS } from "@/lib/legal-content";

export const metadata = {
  title: "Política de Privacidad | IAME Series Argentina",
  description:
    "Política de privacidad y tratamiento de datos personales de IAME Series Argentina.",
};

export default function PrivacidadPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Legal"
        title="Política de Privacidad"
        subtitle="Tratamiento de datos personales conforme a la legislación argentina"
      />
      <LegalDocument sections={PRIVACY_SECTIONS} lastUpdated={LEGAL_LAST_UPDATED} />
      <p className="text-xs text-neutral-500">
        También podés consultar los{" "}
        <Link href="/terminos" className="text-iame-sky hover:underline">
          términos y condiciones de uso
        </Link>
        .
      </p>
    </div>
  );
}
