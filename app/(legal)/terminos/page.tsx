import {
  LegalTitle,
  Section,
  Note,
  Ul,
  Footer,
} from "../_components/legal";

export const metadata = {
  title: "términos · dovo",
  description: "términos de servicio de dovo",
};

export default function TerminosPage() {
  return (
    <>
      <LegalTitle title="términos de servicio" version="0.1" date="2026-05-19" />

      <Note>
        Borrador para revisión por abogado antes del soft launch. Marcadores
        pendientes de completar (razón social definitiva, correos
        funcionales, sociedad si se constituye). No publicar como definitivo
        sin esa revisión.
      </Note>

      <Section n={1} title="quiénes somos">
        <p>
          dovo es un servicio operado por Miguel Ángel Butrón López, persona
          física con actividad empresarial, en Ciudad de México (en
          adelante, "dovo" o "nosotros"). El servicio permite que dos
          personas formen un dúo, acuerden un trato sobre un objetivo
          concreto, definan una recompensa y un castigo para quien cumpla o
          falle, registren su cumplimiento diario y vean el resultado al
          cierre del período.
        </p>
        <p>
          Al crear una cuenta o usar dovo, usted acepta estos Términos. Si
          no está de acuerdo, no use el servicio.
        </p>
      </Section>

      <Section n={2} title="su cuenta">
        <p>Para usar dovo necesita una cuenta. Al crearla declara que:</p>
        <Ul>
          <li>Tiene al menos 18 años cumplidos.</li>
          <li>
            Los datos que proporciona son veraces y le pertenecen.
          </li>
          <li>
            Mantendrá la confidencialidad de su acceso. El magic link
            enviado a su correo es la credencial de inicio de sesión.
          </li>
        </Ul>
        <p>Usted es responsable de la actividad realizada desde su cuenta.</p>
      </Section>

      <Section n={3} title="mecánica del trato">
        <p>
          <strong>Acuerdo entre dos personas.</strong> dovo es una
          herramienta de registro y visualización. El compromiso ocurre
          entre usted y la otra persona del dúo; dovo no es parte del trato.
        </p>
        <p>
          <strong>No custodia de dinero.</strong> dovo no maneja, retiene,
          ni transfiere dinero entre los miembros del dúo, ni opera como
          escrow, ni almacena medios de pago. La recompensa y el castigo se
          acuerdan en texto libre y se ejecutan{" "}
          <em>fuera de la app</em>, directamente entre los dos miembros.
        </p>
        <p>
          <strong>Self-report.</strong> El cumplimiento diario se registra
          por cada usuario. dovo no verifica ni audita la veracidad de los
          check-ins. El otro miembro puede marcar una disputa con una razón
          breve. Si al cierre hay disputas no resueltas, el trato cierra
          con resultado "sin resolver".
        </p>
        <p>
          <strong>dovo no arbitra disputas.</strong> Si el dúo no llega a
          acuerdo, el resultado queda como "sin resolver" en la app y la
          resolución es responsabilidad de los miembros fuera de la
          plataforma.
        </p>
        <p>
          <strong>Cierre y score.</strong> Al cumplirse el período del
          trato, este cierra automáticamente y se actualiza el score
          agregado de cumplimiento de ambos miembros. El score público de
          cada usuario es <em>oculto por defecto</em> y puede activarse
          desde Ajustes.
        </p>
      </Section>

      <Section n={4} title="contenido prohibido">
        <p>
          Usted no puede crear tratos cuyo objetivo, recompensa o castigo:
        </p>
        <Ul>
          <li>
            Vulneren la ley mexicana aplicable (violencia física,
            intimidación, actividades ilícitas).
          </li>
          <li>Involucren a menores de edad como partes del trato.</li>
          <li>
            Impliquen actividades sexuales, prácticas degradantes, o que
            afecten la dignidad humana de cualquier parte.
          </li>
          <li>
            Contengan datos personales sensibles de terceros (artículo 3,
            fracción VI LFPDPPP: salud, origen racial, opiniones políticas,
            convicciones religiosas, vida sexual).
          </li>
          <li>
            Si el trato versa sobre datos sensibles propios del dúo
            (ejemplo: salud mental, peso, hábitos de consumo), ambos
            miembros declaran conceder <strong>consentimiento expreso</strong>{" "}
            al uso de la plataforma para ese fin.
          </li>
        </Ul>
        <p>
          dovo se reserva el derecho de suspender o eliminar tratos y
          cuentas que infrinjan esta cláusula.
        </p>
      </Section>

      <Section n={5} title="pulse · estadísticas agregadas anonimizadas">
        <p>
          dovo genera estadísticas agregadas anonimizadas sobre patrones de
          cumplimiento de tratos. Estas estadísticas:
        </p>
        <Ul>
          <li>
            Nunca incluyen información personal identificable (nombre,
            correo, contenido del trato, recompensa o castigo).
          </li>
          <li>Solo incluyen señales en cohortes de 100 personas o más.</li>
          <li>
            Pueden ser publicadas en reportes, compartidas con socios
            académicos sin costo, o eventualmente licenciadas a terceros
            con fines de investigación o inteligencia sectorial.
          </li>
          <li>
            Pueden ser desactivadas por usted en{" "}
            <strong>Ajustes → Pulse</strong>. Al hacerlo, sus tratos futuros
            no contribuyen al dataset agregado. Los datos previamente
            agregados no son reversibles por arquitectura.
          </li>
        </Ul>
        <p>Para más detalle ver el Aviso de Privacidad.</p>
      </Section>

      <Section n={6} title="tratos patrocinados (cuando aplique)">
        <p>
          dovo puede ofrecer "Tratos Patrocinados" por marcas socias. Al
          aceptar un trato patrocinado:
        </p>
        <Ul>
          <li>
            Usted acepta que el cumplimiento puede generar una recompensa
            entregada por la marca (cupón, código, producto) directamente
            al correo de la cuenta dovo.
          </li>
          <li>
            dovo recibe una contraprestación de la marca por la creación y
            por cada cierre con resultado positivo. dovo no comparte sus
            datos personales identificables con la marca; solo comparte el
            conteo agregado de cumplimientos para fines de facturación.
          </li>
          <li>
            La relación contractual de la recompensa es entre usted y la
            marca. dovo no responde por el canje, la calidad o la entrega
            de la recompensa otorgada por la marca.
          </li>
        </Ul>
      </Section>

      <Section n={7} title="propiedad intelectual">
        <p>
          El servicio dovo, su marca, código, diseño visual y contenidos
          son propiedad de dovo o de sus licenciantes.
        </p>
        <p>
          El contenido que usted genera (texto del trato, notas en
          check-ins) le pertenece. Al subirlo a dovo, usted otorga una
          licencia no exclusiva, mundial, gratuita, limitada al objeto de
          prestar el servicio (mostrarlo al otro miembro, almacenarlo en
          base de datos, generar estadísticas agregadas conforme a la
          cláusula 5).
        </p>
      </Section>

      <Section n={8} title="disponibilidad y limitación de responsabilidad">
        <p>
          dovo se ofrece "como está" y "según disponibilidad". No
          garantizamos que el servicio esté libre de interrupciones,
          errores o pérdidas de datos.
        </p>
        <p>dovo no es responsable por:</p>
        <Ul>
          <li>
            El cumplimiento o incumplimiento de la recompensa o el castigo
            entre miembros del dúo (eso se ejecuta fuera de la app).
          </li>
          <li>
            Disputas entre miembros del dúo sobre la veracidad del
            cumplimiento.
          </li>
          <li>
            Daños indirectos, lucro cesante, o consecuencias emocionales
            derivadas del uso de la plataforma.
          </li>
        </Ul>
        <p>
          La responsabilidad total de dovo frente al usuario, por cualquier
          concepto, se limita al monto pagado por usted a dovo en los 12
          meses previos al hecho generador, o $1,000.00 MXN si el servicio
          se usó gratuitamente.
        </p>
      </Section>

      <Section n={9} title="terminación">
        <Ul>
          <li>
            Usted puede cerrar su cuenta en cualquier momento desde Ajustes
            → tu cuenta.
          </li>
          <li>
            Al cerrarla, sus tratos activos quedan automáticamente con
            resultado "sin resolver" para el otro miembro del dúo.
          </li>
          <li>
            dovo puede suspender o terminar su cuenta si detecta infracción
            a estos Términos, fraude o uso indebido del servicio.
          </li>
        </Ul>
      </Section>

      <Section n={10} title="cambios a estos términos">
        <p>
          dovo puede modificar estos Términos. Los cambios sustantivos
          serán notificados al correo de la cuenta con al menos 15 días
          naturales de anticipación. Si usted no acepta los nuevos
          Términos, puede cerrar su cuenta antes de su entrada en vigor.
        </p>
      </Section>

      <Section n={11} title="ley aplicable y jurisdicción">
        <p>
          Estos Términos se rigen por las leyes de los Estados Unidos
          Mexicanos. Para cualquier controversia, las partes se someten a
          la jurisdicción de los tribunales competentes de la Ciudad de
          México, renunciando a cualquier otro fuero que pudiera
          corresponderles.
        </p>
      </Section>

      <Section n={12} title="contacto">
        <p>
          Para cualquier asunto sobre estos Términos:{" "}
          <a href="mailto:hola@dovo.app" className="underline">
            hola@dovo.app
          </a>
          .
        </p>
        <p>
          Para asuntos de privacidad y derechos ARCO:{" "}
          <a href="mailto:privacidad@dovo.app" className="underline">
            privacidad@dovo.app
          </a>
          .
        </p>
      </Section>

      <Footer />
    </>
  );
}
