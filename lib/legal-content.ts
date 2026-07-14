import { BRAND } from "@/lib/branding";
import { SITE_URL } from "@/lib/site";

export const LEGAL_LAST_UPDATED = "3 de julio de 2026";

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  list?: string[];
}

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: "1. Responsable del tratamiento",
    paragraphs: [
      `El responsable del tratamiento de los datos personales es ${BRAND.organizer}, organizador de ${BRAND.name}, con domicilio en la República Argentina.`,
      `Para consultas relacionadas con privacidad podés escribir a ${BRAND.email}.`,
    ],
  },
  {
    title: "2. Alcance",
    paragraphs: [
      `Esta política aplica al sitio web ${SITE_URL} y a los formularios de inscripción, reserva de turnos y comunicaciones vinculadas al campeonato ${BRAND.name}.`,
    ],
  },
  {
    title: "3. Datos que recopilamos",
    paragraphs: ["Podemos tratar, entre otros, los siguientes datos:"],
    list: [
      "Nombre y apellido",
      "DNI o documento de identidad",
      "Fecha de nacimiento",
      "Correo electrónico y teléfono",
      "Categoría deportiva, número de kart, equipo/escudería y ciudad",
      "Datos de turnos de administración y confirmaciones de inscripción",
      "Datos técnicos de navegación necesarios para el funcionamiento del sitio",
    ],
  },
  {
    title: "4. Finalidad del tratamiento",
    paragraphs: ["Utilizamos tus datos para:"],
    list: [
      "Gestionar inscripciones y reservas de turnos",
      "Enviar confirmaciones y comunicaciones deportivas o informativas",
      "Administrar el campeonato, resultados y documentación",
      "Atender consultas de pilotos, equipos y público",
      "Cumplir obligaciones legales y de seguridad deportiva",
    ],
  },
  {
    title: "5. Base de consentimiento",
    paragraphs: [
      "El tratamiento se realiza con tu consentimiento expreso al completar formularios y aceptar esta política, y cuando sea necesario para la ejecución de la inscripción o el cumplimiento de obligaciones legales.",
    ],
  },
  {
    title: "6. Conservación",
    paragraphs: [
      "Conservamos los datos mientras dure la relación deportiva vinculada al campeonato y el tiempo adicional que resulte necesario para fines administrativos, contables o legales.",
    ],
  },
  {
    title: "7. Cesión y encargados",
    paragraphs: [
      "No vendemos ni comercializamos datos personales. Podemos compartirlos con proveedores que nos prestan servicios tecnológicos estrictamente necesarios, como hosting, base de datos y envío de correos electrónicos, bajo obligaciones de confidencialidad y seguridad.",
    ],
  },
  {
    title: "8. Derechos de los titulares",
    paragraphs: [
      "De acuerdo con la Ley N.º 25.326 de Protección de Datos Personales de la República Argentina, podés solicitar acceso, rectificación, actualización o supresión de tus datos, y oponerte a su tratamiento cuando corresponda.",
      `Las solicitudes deben enviarse a ${BRAND.email}, indicando tu nombre, DNI y el derecho que querés ejercer.`,
    ],
  },
  {
    title: "9. Seguridad",
    paragraphs: [
      "Adoptamos medidas razonables de seguridad técnicas y organizativas para proteger la información. Ningún sistema en Internet garantiza seguridad absoluta.",
    ],
  },
  {
    title: "10. Menores de edad",
    paragraphs: [
      "Si el titular de los datos es menor de edad, la inscripción debe ser realizada o autorizada por su padre, madre o tutor legal, quien acepta esta política en su representación.",
    ],
  },
  {
    title: "11. Cookies y tecnologías similares",
    paragraphs: [
      "El sitio puede utilizar cookies técnicas estrictamente necesarias para su funcionamiento. No utilizamos cookies publicitarias de terceros en este sitio.",
    ],
  },
  {
    title: "12. Cambios",
    paragraphs: [
      "Podemos actualizar esta política. La versión vigente estará siempre publicada en esta página con su fecha de última actualización.",
    ],
  },
];

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: "1. Aceptación",
    paragraphs: [
      `Al acceder y utilizar ${SITE_URL} aceptás estos Términos y Condiciones de Uso. Si no estás de acuerdo, no utilices el sitio.`,
    ],
  },
  {
    title: "2. Titular del sitio",
    paragraphs: [
      `El sitio es operado por ${BRAND.organizer} en el marco de ${BRAND.name}. Las referencias a “nosotros” o “la organización” aluden a ${BRAND.organizer} y al equipo organizador del campeonato.`,
    ],
  },
  {
    title: "3. Objeto del sitio",
    paragraphs: [
      "El sitio tiene fines informativos y operativos: difusión de calendario, campeonato, resultados, noticias, inscripciones, turnos de administración y material oficial del campeonato.",
    ],
  },
  {
    title: "4. Uso permitido",
    paragraphs: ["Te comprometés a:"],
    list: [
      "Utilizar el sitio de forma lícita y respetuosa",
      "Proporcionar datos veraces al inscribirte",
      "No intentar vulnerar la seguridad, disponibilidad o integridad del sitio",
      "No utilizar el contenido con fines comerciales no autorizados",
    ],
  },
  {
    title: "5. Inscripciones y turnos",
    paragraphs: [
      "La inscripción por este sitio no reemplaza requisitos reglamentarios, médicos o administrativos exigidos por la organización.",
      "La reserva de turnos está sujeta a disponibilidad. La organización puede modificar horarios, sedes o procedimientos por razones operativas o de fuerza mayor.",
      "El incumplimiento de normas deportivas o administrativas puede impedir la participación, sin perjuicio de lo dispuesto en los reglamentos oficiales.",
    ],
  },
  {
    title: "6. Propiedad intelectual",
    paragraphs: [
      `Los contenidos del sitio — textos, diseño, logotipos, imágenes, resultados y documentación — son propiedad de ${BRAND.organizer} o de sus respectivos titulares, y no pueden reproducirse sin autorización previa.`,
    ],
  },
  {
    title: "7. Enlaces externos",
    paragraphs: [
      "El sitio puede incluir enlaces a sitios de terceros (por ejemplo, transmisiones, cronometraje o redes sociales). No controlamos ni somos responsables por el contenido o las políticas de esos sitios.",
    ],
  },
  {
    title: "8. Disponibilidad",
    paragraphs: [
      "Procuramos mantener el sitio disponible, pero no garantizamos acceso ininterrumpido. Podemos suspender temporalmente el servicio por mantenimiento, actualizaciones o causas fuera de nuestro control.",
    ],
  },
  {
    title: "9. Limitación de responsabilidad",
    paragraphs: [
      "La información publicada tiene carácter orientativo y puede actualizarse. La organización no será responsable por daños indirectos derivados del uso del sitio, salvo disposición legal imperativa en contrario.",
      "La participación deportiva implica riesgos propios de la actividad. Cada piloto y su equipo son responsables de cumplir reglamentos, requisitos técnicos y de seguridad.",
    ],
  },
  {
    title: "10. Privacidad",
    paragraphs: [
      "El tratamiento de datos personales se rige por nuestra Política de Privacidad publicada en este sitio web.",
    ],
  },
  {
    title: "11. Modificaciones",
    paragraphs: [
      "Podemos modificar estos términos en cualquier momento. El uso continuado del sitio después de su publicación implica la aceptación de la versión vigente.",
    ],
  },
  {
    title: "12. Legislación aplicable",
    paragraphs: [
      "Estos términos se rigen por las leyes de la República Argentina.",
    ],
  },
  {
    title: "13. Contacto",
    paragraphs: [
      `Para consultas sobre estos términos escribinos a ${BRAND.email}.`,
    ],
  },
];
