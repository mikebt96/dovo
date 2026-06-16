import {
  LegalTitle,
  Section,
  Note,
  Ul,
  Footer,
} from "../_components/legal";

export const metadata = {
  title: "términos de servicio · dovo",
  description: "términos de servicio de dovo · versión 1.0",
};

export default function TerminosPage() {
  return (
    <>
      <LegalTitle
        title="términos de servicio"
        version="1.0"
        date="2026-06-12"
        draft={false}
      />

      <p className="text-xs mono opacity-60 mb-6">
        Disponible en:{" "}
        <a href="/terminos" className="underline">
          https://dovofit.com/terminos
        </a>
      </p>

      <p className="text-sm leading-relaxed mb-6 opacity-80">
        Estos Términos de Servicio (los "Términos") regulan el uso de{" "}
        <strong>dovo</strong>, un videojuego cooperativo de fitness para dúos.
        Le pedimos leerlos con calma: al crear una cuenta o usar dovo, usted
        acepta estos Términos en su totalidad. Si no está de acuerdo con algún
        punto, no use el servicio.
      </p>

      <p className="text-sm leading-relaxed mb-10 opacity-80">
        Estos Términos se complementan con el <strong>Aviso de Privacidad</strong>{" "}
        de dovo, versión 1.0, disponible en{" "}
        <a href="/privacidad" className="underline">
          https://dovofit.com/privacidad
        </a>
        , que forma parte integral de este acuerdo y que regula todo lo relativo
        al tratamiento de sus datos personales. En lo que aquí no se detalla
        sobre sus datos, rige el Aviso de Privacidad.
      </p>

      <Section n={1} title="quiénes somos y qué es dovo">
        <p>
          dovo es operado por{" "}
          <strong>
            Miguel Ángel Butrón López, persona física con actividad empresarial
          </strong>
          , con domicilio en:
        </p>
        <Note>
          <strong>
            [PENDIENTE DE INTEGRAR: domicilio completo del responsable en Ciudad
            de México, México. Debe ser el mismo domicilio que el indicado en el
            Aviso de Privacidad v1.0; estos Términos no deben publicarse como
            definitivos mientras este campo no esté integrado.]
          </strong>
        </Note>
        <p>(en adelante, "dovo", "nosotros" o "el responsable").</p>
        <p>
          dovo es un{" "}
          <strong>videojuego cooperativo de fitness para dúos</strong>,
          accesible en https://dovofit.com (hoy como aplicación web para
          teléfono; posteriormente como aplicación nativa para iOS y Android). En
          dovo, dos personas forman un dúo, se proponen objetivos de actividad
          física, registran sus check-ins, reciben planes de entrenamiento y
          nutrición generados por la plataforma, y compiten y cooperan a través
          de mecánicas de juego (niveles, retos, boosts, ataques entre dúos y un
          veredicto semanal).
        </p>
        <p>
          dovo es una{" "}
          <strong>herramienta de software de entretenimiento y registro</strong>
          . No es un gimnasio, no es un profesional de la salud y no es
          intermediario de pagos entre usted y su dúo.
        </p>
      </Section>

      <Section n={2} title="servicio exclusivo para mayores de 18 años">
        <p>
          dovo es un servicio{" "}
          <strong>exclusivamente para personas de 18 años cumplidos o más</strong>
          . No dirigimos el servicio a menores de edad. Al crear su cuenta, usted
          declara y garantiza que tiene al menos 18 años cumplidos. Si detectamos
          una cuenta de una persona menor de 18 años, la cancelaremos y
          eliminaremos sus datos conforme al Aviso de Privacidad.
        </p>
      </Section>

      <Section n={3} title="su cuenta">
        <Ul>
          <li>
            <strong>a) Una cuenta por persona.</strong> Cada persona puede tener
            una sola cuenta. La cuenta es personal e intransferible.
          </li>
          <li>
            <strong>b) Datos veraces.</strong> Al registrarse, usted declara que
            los datos que proporciona son veraces, exactos y le pertenecen, y se
            compromete a mantenerlos actualizados.
          </li>
          <li>
            <strong>c) Acceso.</strong> El inicio de sesión se realiza mediante
            enlace mágico ("magic link") enviado a su correo electrónico o
            mediante su cuenta de Google. El enlace mágico y su acceso son su
            credencial: trátelos con cuidado y no los comparta. Usted es
            responsable de toda la actividad realizada desde su cuenta.
          </li>
          <li>
            <strong>d) Avísenos de cualquier uso no autorizado.</strong> Si
            sospecha que alguien accedió a su cuenta sin su permiso, escríbanos
            de inmediato a{" "}
            <a href="mailto:hola@dovofit.com" className="underline">
              hola@dovofit.com
            </a>
            .
          </li>
        </Ul>
      </Section>

      <Section
        n={4}
        title="la esencia del juego: el premio conjunto y LA APUESTA — son acuerdos privados entre usted y su dúo"
      >
        <p>Esta sección es importante. Léala con atención.</p>
        <aside className="border-l-2 border-signal pl-4 py-2 my-3 text-sm">
          <strong>En pocas palabras:</strong> dovo le da el marcador; el pacto,
          el premio y su cumplimiento son cosa de usted y su dúo.{" "}
          <strong>
            dovo no respalda, no garantiza ni hace cumplir nada: si la otra
            persona de su dúo no cumple lo que pactaron, eso se resuelve entre
            ustedes dos, no con dovo.
          </strong>
        </aside>
        <p>
          Cada semana, su dúo puede pactar dos cosas en{" "}
          <strong>texto libre</strong> dentro de la app:
        </p>
        <Ul>
          <li>
            Un <strong>premio conjunto</strong>: una recompensa que ambos
            comparten si cumplen (por ejemplo, "ir al cine").
          </li>
          <li>
            <strong>LA APUESTA interna</strong>: una consecuencia para quien
            quede por debajo del esfuerzo del otro (por ejemplo, "las palomitas
            las paga el que quede abajo").
          </li>
        </Ul>
        <p>
          Sobre el premio conjunto y LA APUESTA, usted acepta y reconoce
          expresamente lo siguiente:
        </p>
        <Ul>
          <li>
            <strong>
              a) Son acuerdos privados, exclusivamente entre usted y la otra
              persona de su dúo.
            </strong>{" "}
            dovo <strong>no es parte</strong> de ningún premio ni de ninguna
            apuesta. dovo solo le ofrece un espacio de texto libre para que usted
            y su dúo escriban lo que pactaron, y un marcador para ver quién va
            ganando según el esfuerzo registrado.
          </li>
          <li>
            <strong>
              b) dovo no cobra, no garantiza, no entrega ni custodia nada de lo
              pactado entre ustedes.
            </strong>{" "}
            dovo{" "}
            <strong>
              no maneja, no retiene, no transfiere ni custodia dinero, premios ni
              valor alguno
            </strong>{" "}
            entre los miembros del dúo. No opera como depositario ni como
            custodio del premio ni de LA APUESTA. El premio y LA APUESTA se
            cumplen <strong>fuera de la app</strong>, directamente entre las dos
            personas del dúo, por sus propios medios. (Esto es distinto del pago
            de su suscripción a dovo, que sí se cobra a través de la plataforma;
            vea la sección 6.)
          </li>
          <li>
            <strong>c) dovo no arbitra ni hace cumplir nada.</strong> Si el dúo
            no se pone de acuerdo sobre quién cumplió o sobre cómo se paga LA
            APUESTA, esa es una cuestión <strong>entre ustedes dos</strong>. dovo
            no media, no arbitra, no juzga ni obliga a nadie a pagar o entregar
            nada. El resultado que muestra la app es solo informativo.
          </li>
          <li>
            <strong>d) El resultado depende de su esfuerzo, no del azar.</strong>{" "}
            Quién "queda arriba" o "queda abajo" se determina{" "}
            <strong>
              únicamente por el esfuerzo y la actividad física que cada quien
              registra
            </strong>{" "}
            en la app. <strong>No interviene el azar de ninguna forma</strong>:
            no hay sorteos, no hay ruleta, no hay número aleatorio, no hay suerte.
            Es una competencia de esfuerzo personal, como cualquier reto
            deportivo entre dos personas.
          </li>
          <li>
            <strong>
              e) Por qué esto no es un juego con apuesta ni un sorteo regulado.
            </strong>{" "}
            Las mecánicas de dovo no constituyen un juego de azar, un juego con
            apuesta ni un sorteo de los regulados por la{" "}
            <strong>Ley Federal de Juegos y Sorteos</strong>, por dos razones de
            fondo: <strong>(i) no interviene el azar</strong> —el resultado se
            determina solo por el esfuerzo deportivo registrado de cada persona—
            y{" "}
            <strong>
              (ii) dovo no recibe, no cobra, no paga, no custodia ni entrega
              dinero ni premio alguno por la consecuencia pactada entre ustedes a
              través de la plataforma
            </strong>
            . El premio conjunto y LA APUESTA son meros pactos privados de honor
            entre las dos personas del dúo, basados en su desempeño deportivo,
            comparables a una promesa entre dos personas que entrenan juntas. (La
            propia Ley, en su artículo 2º, ubica a "toda clase de deportes" entre
            las actividades que pueden permitirse; dovo no se apoya únicamente en
            ese rótulo, sino, sobre todo, en la ausencia de azar y en la ausencia
            de flujo de dinero o premio por la plataforma respecto del pacto
            entre ustedes.)
          </li>
        </Ul>
      </Section>

      <Section n={5} title="disclaimer de salud — léalo antes de empezar a entrenar">
        <p>
          Esta sección también es importante. Le pedimos leerla con atención.
        </p>
        <Ul>
          <li>
            <strong>
              a) dovo no es consejo médico ni nutricional profesional.
            </strong>{" "}
            Los planes de entrenamiento y de nutrición que dovo le muestra son{" "}
            <strong>contenido generado automáticamente</strong> (hoy, mediante un
            motor de reglas determinista; algunas funciones, como el escaneo
            corporal opcional, ya emplean inteligencia artificial de un tercero,
            según se describe en el Aviso de Privacidad). Son orientativos y de
            carácter general. <strong>No sustituyen</strong> la consulta, el
            diagnóstico ni el tratamiento de un médico, nutriólogo u otro
            profesional de la salud.
          </li>
          <li>
            <strong>b) Consulte a un médico antes de empezar.</strong> Antes de
            iniciar cualquier programa de ejercicio o alimentación con dovo, le
            recomendamos enfáticamente{" "}
            <strong>consultar a un profesional de la salud</strong>,
            especialmente si tiene lesiones, alguna condición médica, está
            embarazada, toma medicamentos o ha llevado una vida sedentaria.
          </li>
          <li>
            <strong>
              c) Las preguntas sobre lesiones y molestias son para ajustar su
              plan, no para diagnosticarle.
            </strong>{" "}
            dovo puede preguntarle por molestias o lesiones con el único fin de{" "}
            <strong>adaptar</strong> su plan de entrenamiento. dovo{" "}
            <strong>no diagnostica, no trata ni emite opinión médica</strong>{" "}
            sobre su estado de salud.
          </li>
          <li>
            <strong>d) El ejercicio implica un riesgo físico inherente.</strong>{" "}
            Toda actividad física conlleva un riesgo inherente de lesión u otros
            daños a la salud, que existe con independencia de dovo. Al usar dovo y
            realizar cualquier actividad física,{" "}
            <strong>
              usted asume voluntariamente los riesgos inherentes al ejercicio
              mismo
            </strong>
            . Usted es responsable de escuchar a su cuerpo, detenerse cuando lo
            necesite y buscar atención médica cuando corresponda.
          </li>
          <li>
            <strong>e) Alcance de esta advertencia.</strong> Esta sección es una{" "}
            <strong>advertencia informativa</strong>: le explica que dovo no es un
            profesional de la salud y que el ejercicio tiene riesgos inherentes
            que usted asume.{" "}
            <strong>
              No es, ni debe entenderse como, una liberación de la
              responsabilidad que legalmente corresponda a dovo por sus propios
              actos
            </strong>
            : dovo responde, en los términos que la ley aplicable establezca, por
            los daños que llegara a causar por su propia culpa o negligencia.
            Nada en esta sección excluye los{" "}
            <strong>
              derechos irrenunciables que la ley reconoce a las personas
              consumidoras
            </strong>
            .
          </li>
        </Ul>
      </Section>

      <Section n={6} title="suscripción, precios y pagos">
        <Ul>
          <li>
            <strong>a) Plan Free.</strong> dovo ofrece un plan gratuito
            ("Free"), disponible para los primeros 200 dúos.
          </li>
          <li>
            <strong>b) Plan Pro.</strong> dovo ofrece un plan de pago ("Pro")
            por{" "}
            <strong>
              $139.00 MXN por dúo, al mes. Este precio es final e incluye el IVA y
              demás impuestos aplicables; usted no pagará nada por encima del
              precio mostrado.
            </strong>
          </li>
          <li>
            <strong>c) Procesamiento de pagos.</strong> Los pagos se procesan a
            través de <strong>Stripe</strong>. dovo{" "}
            <strong>
              no almacena los datos completos de su tarjeta ni datos bancarios
            </strong>
            . El tratamiento de sus datos de pago se rige por el Aviso de
            Privacidad.
          </li>
          <li>
            <strong>d) Cobro recurrente.</strong> La suscripción Pro es de{" "}
            <strong>cobro recurrente mensual</strong>: antes de contratar verá el
            precio, la fecha del primer cargo y que la renovación es automática.
            Una vez contratada,{" "}
            <strong>se renueva y se cobra automáticamente cada mes</strong> hasta
            que usted la cancele. (Mientras el procesamiento de cobros aún no esté
            habilitado, no se le realizará ningún cargo; en ese caso, el plan Pro
            estará disponible sin costo y se lo indicaremos con claridad en el
            momento de contratar. No se activará ningún cobro recurrente sin
            avisarle antes.)
          </li>
          <li>
            <strong>e) Cancelación.</strong> Usted puede{" "}
            <strong>cancelar su suscripción en cualquier momento</strong> desde
            Ajustes. La cancelación surte efecto{" "}
            <strong>al final del periodo ya pagado</strong>: usted conserva el
            acceso al plan de pago hasta que termine ese periodo, y no se le
            volverá a cobrar.
          </li>
          <li>
            <strong>f) Reembolsos.</strong> Como se indica en el inciso (e), al
            cancelar usted{" "}
            <strong>
              conserva el acceso hasta el final del periodo ya pagado
            </strong>
            ; por la parte no utilizada de ese periodo no se realizan reembolsos
            prorrateados.{" "}
            <strong>
              Como excepción, sí le devolveremos la parte proporcional no
              utilizada cuando la cancelación se origine en un cambio de estos
              Términos hecho por dovo que usted no haya aceptado
            </strong>{" "}
            (vea la sección 13). Todo lo anterior se entiende{" "}
            <strong>
              sin perjuicio de los derechos irrenunciables que la ley reconoce a
              las personas consumidoras
            </strong>
            .
          </li>
          <li>
            <strong>g) Cambios de precio.</strong> Si modificamos el precio de su
            plan,{" "}
            <strong>
              se lo notificaremos antes de que aplique al siguiente cobro
            </strong>
            , con la anticipación que se indica en la sección 13. Si no está de
            acuerdo con el nuevo precio, puede cancelar su suscripción antes de
            que entre en vigor.
          </li>
        </Ul>
      </Section>

      <Section n={7} title="conducta y contenido del usuario">
        <Ul>
          <li>
            <strong>a) Texto libre responsable.</strong> El texto libre que usted
            captura en dovo —premios, apuestas, nombres de grupo o de dúo, notas—{" "}
            <strong>no puede</strong> ser ilegal, difamatorio, discriminatorio,
            de odio, violento, sexual respecto de terceros, ni vulnerar derechos
            de otras personas. Tampoco puede involucrar a menores de edad ni
            contener datos personales sensibles de terceros sin su
            consentimiento.
          </li>
          <li>
            <strong>b) dovo puede remover contenido.</strong> dovo puede{" "}
            <strong>revisar, ocultar o eliminar</strong> cualquier contenido que
            infrinja esta sección, con criterio razonable.
          </li>
          <li>
            <strong>c) Las mecánicas de juego son virtuales.</strong> Los
            "ataques", "duelos", "golpes" y "congelamientos" entre dúos son{" "}
            <strong>mecánicas virtuales del videojuego</strong> que solo afectan
            puntos, niveles y posiciones dentro del juego.{" "}
            <strong>
              No representan ni implican ninguna acción, amenaza o violencia en el
              mundo real.
            </strong>{" "}
            Son parte del entretenimiento.
          </li>
        </Ul>
      </Section>

      <Section n={8} title="su contenido y la licencia que nos otorga">
        <Ul>
          <li>
            <strong>a) Su contenido es suyo.</strong> Usted conserva la
            titularidad de los datos y contenidos que genera en dovo (texto de
            premios y apuestas, check-ins, notas, su perfil).
          </li>
          <li>
            <strong>b) Licencia limitada para operar el servicio.</strong> Al
            usar dovo, usted nos otorga una{" "}
            <strong>
              licencia no exclusiva, mundial y gratuita, limitada a lo necesario
              para prestarle el servicio
            </strong>
            : almacenar su contenido, mostrarlo a usted y a la otra persona de su
            dúo conforme al Aviso de Privacidad, y operar las mecánicas del juego.
          </li>
          <li>
            <strong>c) Estadísticas disociadas.</strong> dovo puede generar
            estadísticas agregadas y disociadas (que no le identifican) a partir
            de ciertos datos del juego, en los términos y con las salvaguardas
            —incluido su derecho a excluirse— descritos en el{" "}
            <strong>Aviso de Privacidad</strong> (sección "Pulse"). Esta sección
            no duplica ni modifica esas reglas: para conocerlas, consulte el Aviso
            de Privacidad.
          </li>
        </Ul>
      </Section>

      <Section n={9} title="propiedad intelectual de dovo">
        <p>
          dovo, su{" "}
          <strong>
            marca, nombre, diseño, interfaz, contenidos, mecánicas y software
          </strong>{" "}
          son propiedad del responsable o de sus licenciantes, y están protegidos
          por la legislación aplicable. Estos Términos no le transfieren ningún
          derecho de propiedad intelectual sobre dovo. Usted no puede copiar,
          modificar, descompilar, realizar ingeniería inversa, revender ni
          explotar el servicio fuera de lo que estos Términos permiten.
        </p>
      </Section>

      <Section n={10} title="disponibilidad del servicio y mecánicas del juego">
        <Ul>
          <li>
            <strong>a) Servicio "tal cual".</strong> dovo se ofrece{" "}
            <strong>"tal cual" ("as is") y "según disponibilidad"</strong>. No
            garantizamos que el servicio esté libre de interrupciones, errores,
            fallas o pérdidas de datos, ni que esté disponible de forma
            ininterrumpida. No ofrecemos garantía de tiempo de actividad
            ("uptime").
          </li>
          <li>
            <strong>b) Las mecánicas pueden cambiar.</strong> Las mecánicas del
            juego —puntos, niveles, retos, boosts, ataques, el veredicto semanal y
            similares—{" "}
            <strong>pueden ajustarse, modificarse o descontinuarse</strong> para
            mejorar el juego o por razones operativas. El{" "}
            <strong>veredicto semanal</strong> y los marcadores se generan
            mediante un proceso automatizado;{" "}
            <strong>
              usted tiene derecho a oponerse a ese tratamiento automatizado
            </strong>{" "}
            en los términos que detalla el Aviso de Privacidad (sección 9), sin
            que ello le impida seguir usando las demás funciones del juego.
          </li>
          <li>
            <strong>c) Los puntos y niveles no tienen valor monetario.</strong>{" "}
            Los puntos, niveles, posiciones, boosts y demás elementos virtuales
            del juego{" "}
            <strong>
              no tienen valor monetario, no son dinero, no son canjeables con dovo
              por dinero ni por premios, y no constituyen un derecho adquirido
            </strong>
            . Son parte de la experiencia de entretenimiento.
          </li>
        </Ul>
      </Section>

      <Section n={11} title="suspensión y cancelación de cuentas">
        <p>
          <strong>a) Usted puede cancelar cuando quiera.</strong> Puede cancelar
          su cuenta en cualquier momento desde <strong>Ajustes</strong>. La
          eliminación de sus datos tras la cancelación se realiza conforme al{" "}
          <strong>Aviso de Privacidad</strong>.
        </p>
        <p>
          <strong>b) dovo puede suspender o cancelar cuentas.</strong> Con
          criterio razonable y, salvo impedimento legal o de seguridad,{" "}
          <strong>previa notificación</strong>, dovo puede suspender o cancelar su
          cuenta si detecta:
        </p>
        <Ul>
          <li>
            <strong>Trampa</strong>, como manipular el candado de validación por
            ubicación, falsificar check-ins o introducir datos falsos de forma
            masiva;
          </li>
          <li>
            <strong>Abuso</strong> del servicio o de otras personas usuarias;
          </li>
          <li>
            <strong>Uso ilegal</strong> del servicio o <strong>infracción</strong>{" "}
            a estos Términos.
          </li>
        </Ul>
        <p>
          <strong>c) Efectos.</strong> La suspensión o cancelación puede implicar
          la pérdida de acceso a su cuenta y a sus elementos de juego, que —como
          se indicó— no tienen valor monetario.
        </p>
      </Section>

      <Section n={12} title="limitación de responsabilidad">
        <p>
          En la máxima medida permitida por la ley aplicable, y{" "}
          <strong>
            sin perjuicio de los derechos irrenunciables que la Ley Federal de
            Protección al Consumidor reconoce a las personas consumidoras
          </strong>
          , usted acepta que dovo <strong>no será responsable</strong> por:
        </p>
        <Ul>
          <li>
            <strong>a)</strong> El cumplimiento o incumplimiento del{" "}
            <strong>premio conjunto o de LA APUESTA</strong> entre usted y su dúo
            (que ocurren fuera de la app y en los que dovo no es parte, conforme a
            la sección 4).
          </li>
          <li>
            <strong>b)</strong> Las{" "}
            <strong>disputas entre miembros del dúo</strong> sobre el esfuerzo,
            los check-ins o cualquier otro aspecto de su relación.
          </li>
          <li>
            <strong>c)</strong> Los{" "}
            <strong>riesgos inherentes al ejercicio físico</strong> que usted
            asume conforme a la sección 5, distintos de los daños que dovo
            llegara a causar por su propia culpa o negligencia.
          </li>
          <li>
            <strong>d)</strong> Daños indirectos, incidentales, pérdida de
            ganancias o consecuencias emocionales derivadas del uso o de la
            imposibilidad de uso del servicio.
          </li>
          <li>
            <strong>e)</strong> Interrupciones, errores o pérdida de datos en un
            servicio que se ofrece "tal cual" y "según disponibilidad".
          </li>
        </Ul>
        <p>
          Esta limitación <strong>no aplica</strong> a la responsabilidad que
          dovo tenga por daños causados por su propia culpa o negligencia, ni a
          ningún otro caso en que la ley no permita limitar o excluir la
          responsabilidad. En particular, nada en estos Términos libera a dovo de
          su responsabilidad civil ni la traslada a usted o a un tercero cuando la
          ley lo prohíba. Si alguna cláusula de esta sección resultara contraria a
          los <strong>derechos irrenunciables</strong> de las personas
          consumidoras, se tendrá por no puesta en lo que los contravenga, sin
          afectar el resto de los Términos.
        </p>
      </Section>

      <Section n={13} title="cambios a estos términos">
        <Ul>
          <li>
            <strong>a)</strong> Podemos modificar estos Términos para reflejar
            cambios legales, regulatorios o del producto. Cualquier modificación
            se publicará en{" "}
            <strong>
              <a href="/terminos" className="underline">
                https://dovofit.com/terminos
              </a>
            </strong>{" "}
            con su número de versión y fecha visibles.
          </li>
          <li>
            <strong>
              b) Le avisaremos con al menos 15 días naturales de anticipación
            </strong>{" "}
            a que surtan efecto los cambios sustantivos, por correo electrónico o
            dentro de la app.{" "}
            <strong>
              Los cambios sustantivos no se le aplicarán por el solo hecho de que
              usted siga usando dovo: requerimos su aceptación.
            </strong>{" "}
            Cuando entre en vigor un cambio sustantivo, le pediremos confirmar de
            forma afirmativa que lo acepta antes de continuar usando las funciones
            afectadas. Si usted no lo acepta, puede seguir usando dovo bajo los
            Términos vigentes hasta el fin de su periodo en curso y{" "}
            <strong>terminar su suscripción sin penalización</strong>, con derecho
            al reembolso de la parte proporcional no utilizada conforme a la
            sección 6(f). Los ajustes menores o no sustantivos (por ejemplo,
            correcciones de redacción que no alteran sus derechos ni sus
            obligaciones) podrán aplicarse al publicarse.
          </li>
          <li>
            <strong>c) Cambios de precio:</strong> se le notificarán{" "}
            <strong>antes del siguiente cobro</strong>, conforme a la sección 6, y
            usted podrá cancelar antes de que el nuevo precio entre en vigor.
          </li>
        </Ul>
      </Section>

      <Section n={14} title="ley aplicable, autoridades y jurisdicción">
        <Ul>
          <li>
            <strong>a) Ley aplicable.</strong> Estos Términos se rigen por las
            leyes de los <strong>Estados Unidos Mexicanos</strong>.
          </li>
          <li>
            <strong>b) Protección al consumidor.</strong> En materia de consumo,
            usted cuenta con la protección de la{" "}
            <strong>Ley Federal de Protección al Consumidor</strong> y puede
            acudir a la{" "}
            <strong>Procuraduría Federal del Consumidor (PROFECO)</strong> para
            asesoría, conciliación o queja. Sus derechos como persona consumidora
            son <strong>irrenunciables</strong>.
          </li>
          <li>
            <strong>c) Protección de datos personales.</strong> El tratamiento de
            sus datos se rige por el <strong>Aviso de Privacidad</strong> y por la{" "}
            <strong>
              Ley Federal de Protección de Datos Personales en Posesión de los
              Particulares
            </strong>{" "}
            vigente. La autoridad en la materia es la{" "}
            <strong>Secretaría Anticorrupción y Buen Gobierno (SABG)</strong>,
            conforme se detalla en el Aviso de Privacidad.
          </li>
          <li>
            <strong>d) Jurisdicción.</strong> Para cualquier controversia,{" "}
            <strong>
              sin perjuicio de la competencia de PROFECO en materia de consumo y
              del derecho que la ley le reconoce como persona consumidora de
              reclamar ante la autoridad o el tribunal de su propio domicilio
            </strong>
            , las partes se someten a la jurisdicción de los{" "}
            <strong>tribunales competentes de la Ciudad de México</strong>, en lo
            que dicha sumisión sea válida conforme a la ley. Esta cláusula no le
            obliga a renunciar a la protección de la Ley Federal de Protección al
            Consumidor ni a litigar fuera de su domicilio cuando la ley le permita
            hacerlo en él.
          </li>
        </Ul>
      </Section>

      <Section n={15} title="contacto">
        <Ul>
          <li>
            <strong>Asuntos generales y sobre estos Términos:</strong>{" "}
            <a href="mailto:hola@dovofit.com" className="underline">
              hola@dovofit.com
            </a>
          </li>
          <li>
            <strong>Privacidad y derechos ARCO:</strong>{" "}
            <a href="mailto:privacidad@dovofit.com" className="underline">
              privacidad@dovofit.com
            </a>{" "}
            (conforme al Aviso de Privacidad)
          </li>
        </Ul>
      </Section>

      <p className="text-sm leading-relaxed border-t border-ink/15 pt-6">
        <strong>
          Al crear su cuenta en dovo, usted declara que es mayor de 18 años, que
          ha leído y acepta estos Términos de Servicio y el Aviso de Privacidad, y
          que entiende que el premio conjunto y LA APUESTA con su dúo son acuerdos
          privados en los que dovo no es parte.
        </strong>
      </p>

      <p className="text-xs mono opacity-60 mt-4">
        Términos de Servicio de dovo · Versión 1.0 · 12 de junio de 2026 ·
        https://dovofit.com/terminos
      </p>

      <Footer>
        Términos de Servicio · Versión 1.0 · 12 de junio de 2026 · Cualquier
        duda:{" "}
        <a href="mailto:hola@dovofit.com" className="underline">
          hola@dovofit.com
        </a>
      </Footer>
    </>
  );
}
