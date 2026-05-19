import {
  LegalTitle,
  Section,
  Note,
  Ul,
  Footer,
} from "../_components/legal";

export const metadata = {
  title: "aviso de privacidad · dovo",
  description: "aviso de privacidad integral de dovo (LFPDPPP MX)",
};

export default function PrivacidadPage() {
  return (
    <>
      <LegalTitle
        title="aviso de privacidad"
        version="0.1"
        date="2026-05-19"
      />

      <Note>
        Este documento es un <strong>borrador para revisión legal</strong>{" "}
        antes del soft launch. Algunas secciones contienen marcadores
        pendientes de completar (domicilio fiscal, oficial de privacidad,
        encargados adicionales). No publicar como definitivo sin esa revisión.
      </Note>

      <Section n={1} title="responsable del tratamiento">
        <p>El responsable del tratamiento de sus datos personales es:</p>
        <Ul>
          <li>
            <strong>Nombre / razón social</strong>: Miguel Ángel Butrón López,
            persona física con actividad empresarial. (Pendiente de actualizar
            si se constituye sociedad antes del launch.)
          </li>
          <li>
            <strong>Domicilio</strong>: Ciudad de México, México. (Pendiente
            domicilio fiscal específico.)
          </li>
          <li>
            <strong>Correo de contacto en materia de privacidad</strong>:{" "}
            <a href="mailto:privacidad@dovofit.com" className="underline">
              privacidad@dovofit.com
            </a>
          </li>
          <li>
            <strong>Producto</strong>: dovo, plataforma de commitment device
            para dúos.
          </li>
        </Ul>
      </Section>

      <Section n={2} title="datos personales que se recaban">
        <p>
          Cuando usted crea una cuenta y usa dovo, se recaban los siguientes
          datos:
        </p>
        <p>
          <strong>Datos de identificación</strong>: nombre o alias, correo
          electrónico (para autenticación por magic link y comunicaciones del
          servicio).
        </p>
        <p>
          <strong>Datos de uso del servicio</strong>: tratos que crea o
          acepta (objetivo, frecuencia, duración, recompensa y castigo
          acordados), check-ins de cumplimiento, disputas marcadas sobre
          check-ins del otro miembro, resultado y fecha de cierre.
        </p>
        <p>
          <strong>Datos técnicos</strong> (recabados automáticamente):
          dirección IP, agente de usuario, fecha y hora del acceso. Cookies
          estrictamente necesarias para mantener su sesión.
        </p>
        <p>
          <strong>Datos que NO se recaban</strong>: teléfono, KYC, fotografía
          obligatoria, datos bancarios o financieros (dovo no custodia
          dinero), datos sensibles en el sentido del artículo 3, fracción VI
          de la LFPDPPP (origen racial o étnico, salud, opiniones políticas,
          convicciones religiosas, vida sexual). Si usted captura
          voluntariamente este tipo de contenido en el texto de un trato, lo
          hace bajo su exclusiva responsabilidad conforme a los Términos.
        </p>
      </Section>

      <Section n={3} title="finalidades del tratamiento">
        <p>
          <strong>Finalidades primarias</strong> (necesarias para prestar el
          servicio):
        </p>
        <Ul>
          <li>Crear y mantener su cuenta.</li>
          <li>
            Permitir la creación, invitación, aceptación, ejecución y cierre
            de tratos entre usted y la persona que invite.
          </li>
          <li>
            Mostrarle a usted y al otro miembro de su dúo el estado, los
            check-ins y el resultado de los tratos compartidos.
          </li>
          <li>
            Calcular y mostrar su score de cumplimiento agregado.
          </li>
          <li>Cumplir con obligaciones legales aplicables a dovo.</li>
        </Ul>
        <p>
          <strong>Finalidades secundarias</strong> (no necesarias; usted
          puede oponerse):
        </p>
        <Ul>
          <li>
            Enviarle comunicaciones del producto (cambios al servicio,
            recordatorios opcionales de check-in).
          </li>
          <li>
            Generar estadísticas agregadas anonimizadas sobre patrones de
            cumplimiento para mejorar el producto, publicar reportes, o
            compartirlas con socios académicos o comerciales conforme a la
            cláusula 5 ("Pulse").
          </li>
        </Ul>
        <p>
          Si usted no desea que sus datos se traten para las finalidades
          secundarias, puede oponerse desde <strong>Ajustes → Pulse</strong>{" "}
          para la finalidad de estadísticas, o respondiendo "BAJA" al correo
          de comunicaciones.
        </p>
      </Section>

      <Section n={4} title="fundamento legal">
        <p>
          El tratamiento se realiza con fundamento en su consentimiento
          expreso al aceptar este aviso al crear cuenta, así como en los
          artículos 8, 16 y 17 de la Ley Federal de Protección de Datos
          Personales en Posesión de los Particulares (LFPDPPP) y su
          Reglamento.
        </p>
      </Section>

      <Section n={5} title="pulse · estadísticas agregadas anonimizadas">
        <p>dovo opera una capa estadística llamada Pulse. Las estadísticas de Pulse:</p>
        <Ul>
          <li>
            Nunca incluyen información personal identificable: ni su nombre,
            ni su correo, ni el texto de su trato, ni los detalles de la
            recompensa o el castigo.
          </li>
          <li>
            Solo incluyen señales agregadas en cohortes de 100 personas o
            más (umbral k-anonymity ≥ 100).
          </li>
          <li>
            Pueden ser publicadas en reportes públicos, compartidas con
            socios académicos sin costo, o eventualmente licenciadas a
            terceros con fines de investigación o inteligencia sectorial.
          </li>
          <li>
            Por arquitectura técnica, viven en una base de datos lógicamente
            separada de la base de tratos individuales y no son
            re-identificables a un usuario.
          </li>
        </Ul>
        <p>
          Usted puede desactivar su contribución futura a Pulse desde{" "}
          <strong>Ajustes → Pulse</strong>. Al hacerlo, sus tratos futuros no
          se ingieren al dataset. Los datos previamente agregados no son
          reversibles por arquitectura.
        </p>
      </Section>

      <Section n={6} title="transferencias de datos">
        <p>
          Sus datos se almacenan y procesan en infraestructura proporcionada
          por los siguientes encargados:
        </p>
        <Ul>
          <li>
            <strong>Supabase, Inc.</strong> (Estados Unidos / Unión Europea)
            — base de datos PostgreSQL, autenticación y storage.
          </li>
          <li>
            <strong>Vercel, Inc.</strong> (Estados Unidos) — hosting de la
            aplicación web.
          </li>
          <li>
            Si se integra un proveedor de email transactional, se agregará a
            esta lista con anticipación razonable.
          </li>
        </Ul>
        <p>
          Estos encargados están contractualmente obligados a tratar sus
          datos únicamente conforme a las instrucciones de dovo y a mantener
          medidas de seguridad razonables. dovo no transfiere sus datos a
          terceros con fines comerciales sin su consentimiento, salvo en los
          casos previstos en el artículo 37 de la LFPDPPP.
        </p>
      </Section>

      <Section n={7} title="derechos arco">
        <p>Usted tiene derecho en todo momento a:</p>
        <Ul>
          <li>
            <strong>Acceder</strong> a sus datos personales que dovo posea.
          </li>
          <li>
            <strong>Rectificar</strong> datos inexactos o incompletos.
          </li>
          <li>
            <strong>Cancelar</strong> sus datos cuando considere que no se
            están tratando conforme a la ley.
          </li>
          <li>
            <strong>Oponerse</strong> al tratamiento para finalidades
            específicas.
          </li>
        </Ul>
        <p>
          Para ejercer estos derechos, envíe una solicitud a{" "}
          <a href="mailto:privacidad@dovofit.com" className="underline">
            privacidad@dovofit.com
          </a>{" "}
          indicando su nombre y correo de la cuenta, el derecho que ejerce,
          y la finalidad o tratamiento al que se refiere. dovo responderá
          en un plazo máximo de 20 días hábiles conforme a la LFPDPPP.
        </p>
        <p>
          Adicionalmente, dovo ofrece desde la aplicación: edición de datos
          desde <em>Ajustes → tu cuenta</em>, y cancelación de cuenta desde
          el mismo lugar (al cancelar, sus tratos activos se cierran con
          resultado "sin resolver" y sus datos personales se eliminan en un
          plazo de 30 días, salvo obligaciones legales aplicables).
        </p>
      </Section>

      <Section n={8} title="cookies">
        <p>
          dovo utiliza únicamente cookies estrictamente necesarias para
          mantener su sesión activa después del magic link. No se usan
          cookies de marketing, ni de terceros con fines publicitarios, ni
          píxeles de redes sociales.
        </p>
      </Section>

      <Section n={9} title="medidas de seguridad">
        <Ul>
          <li>Conexiones cifradas TLS en todo el tráfico (HTTPS).</li>
          <li>
            Aislamiento por Row Level Security en la base de datos: usted
            solo puede leer y modificar sus propios tratos y los del dúo que
            aceptó.
          </li>
          <li>
            Separación arquitectónica entre la base de tratos individuales
            (<code className="mono text-xs">core</code>) y la base de
            estadísticas agregadas (<code className="mono text-xs">pulse</code>),
            con llaves de servicio no relacionables.
          </li>
          <li>
            Acceso interno limitado al personal estrictamente necesario.
          </li>
        </Ul>
      </Section>

      <Section n={10} title="cambios al aviso">
        <p>
          dovo puede modificar este aviso para reflejar cambios legales o de
          producto. Cualquier modificación se publicará en esta misma
          dirección con una fecha de actualización visible. Si los cambios
          son sustantivos, dovo le notificará por correo electrónico con
          anticipación razonable antes de su entrada en vigor.
        </p>
      </Section>

      <Section n={11} title="cumplimiento y reporte">
        <p>
          dovo opera bajo las disposiciones de la LFPDPPP y mantiene
          reportes trimestrales públicos sobre el uso del dataset agregado
          de Pulse.
        </p>
        <p>
          Si usted considera que su derecho a la protección de datos
          personales ha sido vulnerado, puede acudir ante el Instituto
          Nacional de Transparencia, Acceso a la Información y Protección
          de Datos Personales (INAI) en{" "}
          <a
            href="https://home.inai.org.mx"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            home.inai.org.mx
          </a>
          .
        </p>
      </Section>

      <Footer />
    </>
  );
}
