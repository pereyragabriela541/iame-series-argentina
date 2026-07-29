import Link from "next/link";

import PageHeader from "@/components/PageHeader";
import { BRAND } from "@/lib/branding";
import { LEGAL_LAST_UPDATED } from "@/lib/legal-content";

export const metadata = {
  title: `Eliminar cuenta y datos | ${BRAND.name}`,
  description: `Cómo solicitar la eliminación de cuenta y datos personales de la app ${BRAND.name}, organizada por ${BRAND.organizer}.`,
};

export default function EliminarCuentaPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        kicker={BRAND.name}
        title="Eliminar cuenta y datos"
        subtitle={`Solicitud de borrado para la app ${BRAND.name} (desarrollada / organizada por ${BRAND.organizer})`}
      />

      <article className="space-y-8 border border-neutral-800 bg-neutral-900/30 p-6 sm:p-8">
        <p className="text-xs text-neutral-500">
          Última actualización: {LEGAL_LAST_UPDATED}
        </p>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">
            App y desarrollador
          </h2>
          <p className="text-sm leading-relaxed text-neutral-400">
            Esta página corresponde a la aplicación móvil{" "}
            <strong className="text-white">{BRAND.name}</strong>, cuyo
            responsable/organizador es{" "}
            <strong className="text-white">{BRAND.organizer}</strong>. Contacto:{" "}
            <a
              href={`mailto:${BRAND.email}`}
              className="text-iame-sky hover:underline"
            >
              {BRAND.email}
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">
            Pasos para solicitar el borrado
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-neutral-400">
            <li>
              Abrí la app <strong className="text-white">{BRAND.name}</strong> en
              tu teléfono.
            </li>
            <li>Iniciá sesión con el email y contraseña de tu cuenta.</li>
            <li>
              Andá a la pestaña <strong className="text-white">Cuenta</strong>.
            </li>
            <li>
              Tocá <strong className="text-white">Eliminar cuenta</strong> y
              confirmá la acción.
            </li>
            <li>
              Si no podés acceder a la app (por ejemplo, perdiste el
              dispositivo), escribí a{" "}
              <a
                href={`mailto:${BRAND.email}`}
                className="text-iame-sky hover:underline"
              >
                {BRAND.email}
              </a>{" "}
              desde el mismo correo de la cuenta e indicá que querés eliminarla.
              Completamos esas solicitudes generalmente dentro de{" "}
              <strong className="text-white">30 días</strong>.
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">
            Qué se borra al eliminar la cuenta
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-400">
            <li>Cuenta de acceso (email y credenciales de autenticación)</li>
            <li>
              Perfil de la app: nombre, teléfono, número de kart, categoría,
              equipo, chasis
            </li>
            <li>Foto de perfil almacenada</li>
            <li>Tokens de notificación push del dispositivo</li>
          </ul>
          <p className="text-sm leading-relaxed text-neutral-400">
            La eliminación de la cuenta desde la app es inmediata y definitiva
            (no es una desactivación temporal).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">
            Qué puede conservarse
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-400">
            <li>
              Inscripciones al campeonato, turnos de administración y
              confirmaciones asociadas
            </li>
            <li>
              Fotos de dúos (titular / invitado) publicadas en el sitio o la
              app con fines de difusión del campeonato
            </li>
            <li>
              Datos necesarios por obligaciones legales o administrativas del
              campeonato
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-neutral-400">
            Esos registros pueden conservarse mientras dure la relación
            deportiva vinculada al campeonato y el tiempo adicional razonable
            por fines administrativos o legales. Para pedir su borrado o
            rectificación, escribinos a{" "}
            <a
              href={`mailto:${BRAND.email}`}
              className="text-iame-sky hover:underline"
            >
              {BRAND.email}
            </a>
            , identificando tu inscripción.
          </p>
        </section>
      </article>

      <p className="text-xs text-neutral-500">
        Más detalles en la{" "}
        <Link href="/privacidad" className="text-iame-sky hover:underline">
          política de privacidad
        </Link>
        .
      </p>
    </div>
  );
}
