import { BRAND } from "@/lib/branding";
import { SITE_URL } from "@/lib/site";

export const LEGAL_LAST_UPDATED = "24 de julio de 2026";

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
      `Esta política aplica al sitio web ${SITE_URL}, a la aplicación móvil oficial de ${BRAND.name} (iOS y Android) y a los formularios de inscripción, reserva de turnos, creación de cuenta de usuario y comunicaciones vinculadas al campeonato.`,
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
      "Contraseña de acceso a la cuenta (almacenada de forma cifrada por el proveedor de autenticación; no es accesible en texto plano por la organización)",
      "Foto de perfil que el usuario cargue voluntariamente en la app",
      "Categoría deportiva, número de kart, equipo/escudería, chasis y ciudad",
      "Datos de turnos de administración y confirmaciones de inscripción",
      "Tokens de notificación push del dispositivo, cuando el usuario habilite las alertas",
      "Datos técnicos de navegación o del dispositivo necesarios para el funcionamiento del sitio y de la app",
    ],
  },
  {
    title: "4. Finalidad del tratamiento",
    paragraphs: ["Utilizamos tus datos para:"],
    list: [
      "Crear y administrar la cuenta de usuario en la app y en los servicios asociados",
      "Gestionar inscripciones y reservas de turnos",
      "Enviar confirmaciones por correo y, si corresponde, notificaciones push de alertas del campeonato",
      "Mostrar en la cuenta del piloto información vinculada al campeonato (por ejemplo presentismo, posición y puntos) según el número de kart y categoría declarados",
      "Administrar el campeonato, resultados y documentación",
      "Atender consultas de pilotos, equipos y público",
      "Cumplir obligaciones legales y de seguridad deportiva",
    ],
  },
  {
    title: "5. Base de consentimiento",
    paragraphs: [
      "El tratamiento se realiza con tu consentimiento expreso al completar formularios, crear una cuenta o aceptar esta política, y cuando sea necesario para la ejecución de la inscripción, el uso de la app o el cumplimiento de obligaciones legales.",
      "El acceso a la aplicación móvil puede requerir registro e inicio de sesión. Al crear una cuenta aceptás esta política y los términos de uso vigentes.",
    ],
  },
  {
    title: "6. Conservación",
    paragraphs: [
      "Conservamos los datos mientras dure la relación deportiva vinculada al campeonato, mientras la cuenta de usuario permanezca activa, y el tiempo adicional que resulte necesario para fines administrativos, contables o legales.",
      "La eliminación de la cuenta de la app se rige por la sección 8. Los registros de inscripción y turnos del campeonato pueden conservarse el tiempo necesario para la administración deportiva y obligaciones legales, aunque hayas eliminado tu cuenta de la app.",
    ],
  },
  {
    title: "7. Cesión y encargados",
    paragraphs: [
      "No vendemos ni comercializamos datos personales. Podemos compartirlos con proveedores que nos prestan servicios tecnológicos estrictamente necesarios —por ejemplo hosting, base de datos, autenticación, almacenamiento de archivos (como fotos de perfil) y envío de correos o notificaciones push— bajo obligaciones de confidencialidad y seguridad.",
      "No utilizamos tus datos para publicidad personalizada de terceros ni para seguimiento (tracking) entre apps o sitios con fines publicitarios.",
    ],
  },
  {
    title: "8. Eliminación de cuenta (aplicación móvil)",
    paragraphs: [
      "Si creaste una cuenta en la aplicación móvil, podés eliminar tu cuenta desde la propia app: sección Cuenta → Eliminar cuenta.",
      "Al confirmar la eliminación se borra de inmediato tu cuenta de acceso, tu perfil (nombre, teléfono, kart, categoría, equipo, chasis, foto), tus tokens de notificación push y la foto de perfil almacenada.",
      "La eliminación es definitiva: no se trata de una desactivación temporal. Si solo querés dejar de usar la app sin borrar datos, usá Cerrar sesión.",
      `Si no podés acceder a la app (por ejemplo, perdiste el dispositivo), escribinos a ${BRAND.email} desde el correo de la cuenta para solicitar la eliminación. Completamos esas solicitudes en un plazo razonable, generalmente dentro de los 30 días.`,
    ],
  },
  {
    title: "9. Derechos de los titulares",
    paragraphs: [
      "De acuerdo con la Ley N.º 25.326 de Protección de Datos Personales de la República Argentina, podés solicitar acceso, rectificación, actualización o supresión de tus datos, y oponerte a su tratamiento cuando corresponda.",
      `Además de la eliminación de cuenta desde la app, las solicitudes de acceso, rectificación u otros derechos pueden enviarse a ${BRAND.email}, indicando tu nombre, DNI y el derecho que querés ejercer.`,
    ],
  },
  {
    title: "10. Seguridad",
    paragraphs: [
      "Adoptamos medidas razonables de seguridad técnicas y organizativas para proteger la información. Ningún sistema en Internet garantiza seguridad absoluta.",
      "Sos responsable de mantener la confidencialidad de tu contraseña y del uso de tu cuenta en la app.",
    ],
  },
  {
    title: "11. Menores de edad",
    paragraphs: [
      "Si el titular de los datos es menor de edad, la inscripción y/o la creación de cuenta deben ser realizadas o autorizadas por su padre, madre o tutor legal, quien acepta esta política en su representación.",
    ],
  },
  {
    title: "12. Cookies y tecnologías similares",
    paragraphs: [
      "El sitio puede utilizar cookies técnicas estrictamente necesarias para su funcionamiento. No utilizamos cookies publicitarias de terceros en este sitio.",
      "La app puede almacenar de forma local tokens de sesión y de notificaciones necesarios para su funcionamiento.",
    ],
  },
  {
    title: "13. Cambios",
    paragraphs: [
      "Podemos actualizar esta política. La versión vigente estará siempre publicada en esta página con su fecha de última actualización.",
    ],
  },
];

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: "1. Aceptación",
    paragraphs: [
      `Al acceder y utilizar ${SITE_URL} y/o la aplicación móvil oficial de ${BRAND.name} aceptás estos Términos y Condiciones de Uso. Si no estás de acuerdo, no utilices el sitio ni la app.`,
    ],
  },
  {
    title: "2. Titular del sitio y de la app",
    paragraphs: [
      `El sitio y la aplicación móvil son operados por ${BRAND.organizer} en el marco de ${BRAND.name}. Las referencias a “nosotros” o “la organización” aluden a ${BRAND.organizer} y al equipo organizador del campeonato.`,
    ],
  },
  {
    title: "3. Objeto",
    paragraphs: [
      "El sitio y la app tienen fines informativos y operativos: difusión de calendario, campeonato, resultados, noticias, inscripciones, turnos de administración, material oficial y, en la app, gestión de cuenta de usuario, perfil del piloto y alertas.",
    ],
  },
  {
    title: "4. Cuenta de usuario (aplicación móvil)",
    paragraphs: [
      "El uso de la aplicación móvil puede requerir crear una cuenta e iniciar sesión con correo electrónico y contraseña.",
      "Te comprometés a proporcionar datos veraces en tu perfil (incluyendo, si corresponde, número de kart, categoría, equipo y chasis) y a mantener actualizada tu información.",
      "La foto de perfil es opcional y de tu exclusiva responsabilidad en cuanto a derechos de imagen y contenido.",
      "Podés eliminar tu cuenta en cualquier momento desde la sección Cuenta de la app. La eliminación borra el acceso y los datos de perfil asociados, conforme a la Política de Privacidad.",
      "La organización puede suspender o cancelar cuentas ante uso indebido, datos falsos o incumplimiento de estos términos o de los reglamentos del campeonato.",
    ],
  },
  {
    title: "5. Uso permitido",
    paragraphs: ["Te comprometés a:"],
    list: [
      "Utilizar el sitio y la app de forma lícita y respetuosa",
      "Proporcionar datos veraces al inscribirte o al crear/editar tu perfil",
      "No intentar vulnerar la seguridad, disponibilidad o integridad del sitio o de la app",
      "No utilizar el contenido con fines comerciales no autorizados",
      "No suplantar la identidad de terceros ni vincular un número de kart o categoría que no te corresponda",
    ],
  },
  {
    title: "6. Inscripciones y turnos",
    paragraphs: [
      "La inscripción por este sitio o por la app no reemplaza requisitos reglamentarios, médicos o administrativos exigidos por la organización.",
      "La reserva de turnos está sujeta a disponibilidad. La organización puede modificar horarios, sedes o procedimientos por razones operativas o de fuerza mayor.",
      "El incumplimiento de normas deportivas o administrativas puede impedir la participación, sin perjuicio de lo dispuesto en los reglamentos oficiales.",
    ],
  },
  {
    title: "7. Información del campeonato en la cuenta",
    paragraphs: [
      "La app puede mostrar presentismo, posición y puntos del campeonato asociados al número de kart y categoría declarados en el perfil. Esa información tiene carácter informativo y puede actualizarse o corregirse cuando la organización publique o revise la clasificación oficial.",
      "En caso de discrepancia, prevalecen los resultados y reglamentos oficiales del campeonato.",
    ],
  },
  {
    title: "8. Notificaciones",
    paragraphs: [
      "Si habilitás las notificaciones push, podés recibir alertas y comunicados del campeonato en tu dispositivo. Podés desactivarlas desde la configuración del sistema operativo.",
    ],
  },
  {
    title: "9. Propiedad intelectual",
    paragraphs: [
      `Los contenidos del sitio y de la app — textos, diseño, logotipos, imágenes, resultados y documentación — son propiedad de ${BRAND.organizer} o de sus respectivos titulares, y no pueden reproducirse sin autorización previa.`,
    ],
  },
  {
    title: "10. Enlaces externos",
    paragraphs: [
      "El sitio y la app pueden incluir enlaces a sitios de terceros (por ejemplo, transmisiones, cronometraje o redes sociales). No controlamos ni somos responsables por el contenido o las políticas de esos sitios.",
    ],
  },
  {
    title: "11. Disponibilidad",
    paragraphs: [
      "Procuramos mantener el sitio y la app disponibles, pero no garantizamos acceso ininterrumpido. Podemos suspender temporalmente el servicio por mantenimiento, actualizaciones o causas fuera de nuestro control.",
    ],
  },
  {
    title: "12. Limitación de responsabilidad",
    paragraphs: [
      "La información publicada tiene carácter orientativo y puede actualizarse. La organización no será responsable por daños indirectos derivados del uso del sitio o de la app, salvo disposición legal imperativa en contrario.",
      "La participación deportiva implica riesgos propios de la actividad. Cada piloto y su equipo son responsables de cumplir reglamentos, requisitos técnicos y de seguridad.",
    ],
  },
  {
    title: "13. Privacidad",
    paragraphs: [
      "El tratamiento de datos personales se rige por nuestra Política de Privacidad publicada en este sitio web.",
    ],
  },
  {
    title: "14. Modificaciones",
    paragraphs: [
      "Podemos modificar estos términos en cualquier momento. El uso continuado del sitio o de la app después de su publicación implica la aceptación de la versión vigente.",
    ],
  },
  {
    title: "15. Legislación aplicable",
    paragraphs: [
      "Estos términos se rigen por las leyes de la República Argentina.",
    ],
  },
  {
    title: "16. Contacto",
    paragraphs: [
      `Para consultas sobre estos términos escribinos a ${BRAND.email}.`,
    ],
  },
];
