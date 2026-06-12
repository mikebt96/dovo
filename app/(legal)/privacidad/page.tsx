import {
  LegalTitle,
  Section,
  Note,
  Ul,
  Footer,
} from "../_components/legal";

export const metadata = {
  title: "aviso de privacidad · dovo",
  description: "aviso de privacidad integral de dovo · versión 1.0 (LFPDPPP 2025)",
};

const th = "mono uppercase text-xs opacity-60 font-medium text-left py-2 px-3";
const td = "py-2 px-3 border-t border-ink/15 align-top";

export default function PrivacidadPage() {
  return (
    <>
      <LegalTitle
        title="aviso de privacidad"
        version="1.0"
        date="2026-06-12"
        draft={false}
      />

      <p className="text-xs mono opacity-60 mb-6">
        Disponible en:{" "}
        <a href="/privacidad" className="underline">
          https://dovofit.com/privacidad
        </a>
      </p>

      <p className="text-sm leading-relaxed mb-10 opacity-80">
        Este Aviso de Privacidad se emite en cumplimiento de la Ley Federal de
        Protección de Datos Personales en Posesión de los Particulares, vigente
        desde el 21 de marzo de 2025 (en adelante, la "Ley"). Donde resultan
        aplicables y no se oponen a la Ley, observamos también su Reglamento de
        2011 y los Lineamientos del Aviso de Privacidad de 2013.
      </p>

      <Section n={1} title="responsable del tratamiento de sus datos personales">
        <p>El responsable del tratamiento de sus datos personales es:</p>
        <Ul>
          <li>
            <strong>Responsable:</strong> Miguel Ángel Butrón López, persona
            física con actividad empresarial.
          </li>
          <li>
            <strong>Domicilio:</strong>
            <Note>
              <strong>
                [PENDIENTE DE INTEGRAR: domicilio completo del responsable en
                Ciudad de México, México. Este aviso NO debe publicarse ni debe
                recabarse dato personal alguno mientras este campo no esté
                integrado — el domicilio es elemento obligatorio del aviso
                conforme al artículo 15, fracción I de la Ley.]
              </strong>
            </Note>
          </li>
          <li>
            <strong>Contacto en materia de privacidad:</strong>{" "}
            <a href="mailto:privacidad@dovofit.com" className="underline">
              privacidad@dovofit.com
            </a>
          </li>
          <li>
            <strong>Producto:</strong> dovo, videojuego cooperativo de fitness
            para dúos, accesible en https://dovofit.com (actualmente como
            aplicación web móvil; posteriormente como aplicación nativa para
            iOS y Android).
          </li>
        </Ul>
        <p>
          En este aviso, "dovo", "nosotros" o "el responsable" se refieren a la
          persona indicada arriba. "Usted" se refiere a la persona titular de
          los datos personales (artículo 2, fracción XVIII de la Ley).
        </p>
      </Section>

      <Section n={2} title="datos personales que recabamos">
        <p>
          Recabamos los siguientes datos personales cuando usted utiliza dovo
          (artículo 15, fracción II de la Ley).{" "}
          <strong>
            Los datos marcados como sensibles solo se recaban después de que
            usted activa el interruptor dedicado de datos de salud descrito en
            la sección 5; la app no le solicita ningún campo sensible antes de
            ese momento.
          </strong>
        </p>

        <p>
          <strong>a) Datos de identificación y contacto:</strong>
        </p>
        <Ul>
          <li>Nombre o alias.</li>
          <li>Correo electrónico (autenticación y comunicaciones del servicio).</li>
        </Ul>

        <p>
          <strong>
            b) Datos de perfil físico y de salud — los tratamos como datos
            personales sensibles
          </strong>{" "}
          (artículo 2, fracción VI de la Ley: información que puede revelar su
          estado de salud presente o futuro):
        </p>
        <Ul>
          <li>Peso, altura, edad y sexo.</li>
          <li>
            Nivel de actividad física, objetivo físico y experiencia de
            entrenamiento.
          </li>
          <li>Lesiones o molestias que usted reporte antes de entrenar.</li>
          <li>
            Fotografías de escaneo corporal (<em>body scan</em>), únicamente si
            usted decide tomarlas. Son opcionales.
          </li>
        </Ul>

        <p>
          <strong>c) Datos de nutrición:</strong>
        </p>
        <Ul>
          <li>
            Restricciones alimentarias y alergias declaradas (las alergias se
            tratan también como datos sensibles, por revelar estado de salud).
          </li>
          <li>Alimentos vetados y favoritos.</li>
          <li>Presupuesto aproximado de alimentación.</li>
        </Ul>

        <p>
          <strong>d) Datos de uso del juego:</strong>
        </p>
        <Ul>
          <li>Check-ins de actividad.</li>
          <li>
            Texto libre de los premios y apuestas que usted captura en LA
            APUESTA semanal.
          </li>
          <li>Retos, boosts, ataques entre dúos, niveles y puntuaciones.</li>
        </Ul>

        <p>
          <strong>e) Datos de ubicación geográfica:</strong>
        </p>
        <Ul>
          <li>
            El punto de anclaje de su gimnasio o lugar de entrenamiento, que
            usted fija expresamente. Se usa para validar sus check-ins y,{" "}
            <strong>
              solo si usted no se ha excluido de Pulse (sección 8), derivamos
              de él su región a nivel ciudad
            </strong>{" "}
            (por ejemplo, "Ciudad de México") como categoría estadística —
            nunca sus coordenadas exactas.
          </li>
          <li>
            Un punto de ubicación al momento de su check-in, usado únicamente
            para validar su presencia y conservado únicamente como constancia
            de esa validación.{" "}
            <strong>
              Los puntos de check-in jamás se usan para Pulse ni para ninguna
              otra finalidad.
            </strong>
          </li>
          <li>
            Un resumen de distancia y duración cuando registra una carrera.
          </li>
        </Ul>

        <p>
          <strong>dovo jamás almacena su ruta o rastro GPS.</strong> Solo se
          conservan los puntos y resúmenes descritos. No recolectamos su
          ubicación en segundo plano. Vea la sección 7.
        </p>

        <p>
          <strong>f) Datos técnicos (recolección automática):</strong>
        </p>
        <Ul>
          <li>
            Dirección IP, agente de usuario (navegador y dispositivo), fecha y
            hora de acceso.
          </li>
          <li>
            Cookies estrictamente necesarias para mantener su sesión. No usamos
            cookies de marketing ni de terceros con fines publicitarios. Vea la
            sección 12.
          </li>
        </Ul>

        <p>
          <strong>g) Datos de pago:</strong>
        </p>
        <Ul>
          <li>
            Los pagos de su suscripción se procesan a través de Stripe.{" "}
            <strong>
              dovo no almacena números de tarjeta ni datos bancarios completos
            </strong>
            ; únicamente recibe de Stripe la confirmación del estado de su
            suscripción y los últimos dígitos de referencia.
          </li>
        </Ul>

        <p>
          <strong>
            h) Datos de salud de plataformas (tratamiento futuro, declarado
            desde hoy):
          </strong>
        </p>
        <p>
          Cuando exista la aplicación nativa para iOS y Android, usted podrá
          conectar de manera <strong>opcional</strong> Apple Health (HealthKit)
          o Health Connect. Si decide hacerlo, dovo podrá recibir
          exclusivamente los siguientes tipos de datos, que se tratan como
          sensibles:{" "}
          <strong>
            frecuencia cardiaca, pasos, distancia, sueño, calorías y
            entrenamientos
          </strong>
          . La conexión requerirá su consentimiento expreso y los permisos
          granulares del sistema operativo, que usted puede otorgar o revocar
          tipo por tipo en cualquier momento. Declaramos esta posibilidad desde
          ahora porque la Ley (artículo 11) exige que toda finalidad conste en
          el aviso desde el primer momento; si en el futuro pretendiéramos
          tratar datos distintos a los aquí descritos, le pediríamos un nuevo
          consentimiento.
        </p>
      </Section>

      <Section n={3} title="finalidades del tratamiento">
        <p>
          Tratamos sus datos para las siguientes finalidades (artículo 15,
          fracción III de la Ley). Distinguimos entre finalidades{" "}
          <strong>necesarias</strong> para prestarle el servicio y finalidades{" "}
          <strong>con derecho de negativa</strong>, que usted puede rechazar
          sin que ello afecte el servicio:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm border-collapse">
            <thead>
              <tr>
                <th className={th}>Finalidad</th>
                <th className={th}>Carácter</th>
                <th className={th}>Consentimiento</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={td}>
                  Crear y administrar su cuenta; autenticarle y comunicarle
                  asuntos del servicio
                </td>
                <td className={td}>Necesaria</td>
                <td className={td}>Tácito, al aceptar este aviso</td>
              </tr>
              <tr>
                <td className={td}>
                  Compartir con su compañero o compañera de dúo su progreso,
                  check-ins, el resultado del veredicto semanal y el marcador
                  de LA APUESTA (transferencia descrita en la sección 4)
                </td>
                <td className={td}>Necesaria (es la esencia del servicio)</td>
                <td className={td}>
                  Aceptación expresa al formar un dúo; además, exenta por ser
                  necesaria para la relación jurídica (artículo 36, fracción
                  VII de la Ley)
                </td>
              </tr>
              <tr>
                <td className={td}>
                  Operar la mecánica del juego: niveles, retos, boosts, ataques
                  entre dúos y veredicto semanal
                </td>
                <td className={td}>Necesaria</td>
                <td className={td}>Tácito</td>
              </tr>
              <tr>
                <td className={td}>
                  Tratar sus datos de perfil físico, salud y nutrición para
                  generar sus planes de entrenamiento y nutrición, validar su
                  actividad y mostrarle su progreso
                </td>
                <td className={td}>
                  Necesaria{" "}
                  <strong>
                    solo para las funciones de planes, validación y progreso;
                    el resto del juego funciona sin estos datos
                  </strong>{" "}
                  (sección 5)
                </td>
                <td className={td}>
                  <strong>Expreso</strong>, mediante el interruptor dedicado de
                  datos de salud (sección 5)
                </td>
              </tr>
              <tr>
                <td className={td}>
                  Importar métricas de Apple Health / Health Connect, cuando
                  exista la app nativa y usted decida conectarlas,{" "}
                  <strong>
                    para validar su actividad, calcular su progreso y ajustar
                    sus planes de entrenamiento — nunca para publicidad ni para
                    los estudios de la sección 8
                  </strong>
                </td>
                <td className={td}>Opcional</td>
                <td className={td}>
                  <strong>Expreso</strong>, mediante interruptor dedicado +
                  permisos del sistema operativo
                </td>
              </tr>
              <tr>
                <td className={td}>
                  Validar su presencia en su lugar de entrenamiento y registrar
                  resúmenes de carrera mediante su ubicación
                </td>
                <td className={td}>Necesaria para las funciones que la usan</td>
                <td className={td}>
                  <strong>Expreso</strong>, mediante interruptor + permiso de
                  ubicación del navegador o sistema operativo
                </td>
              </tr>
              <tr>
                <td className={td}>
                  Procesar los pagos de su suscripción a través de Stripe
                </td>
                <td className={td}>Necesaria</td>
                <td className={td}>
                  <strong>Expreso</strong> (datos de carácter financiero,
                  artículo 7 de la Ley)
                </td>
              </tr>
              <tr>
                <td className={td}>
                  Seguridad de la plataforma, prevención de fraude y atención
                  de soporte
                </td>
                <td className={td}>Necesaria</td>
                <td className={td}>Tácito</td>
              </tr>
              <tr>
                <td className={td}>
                  Cumplir obligaciones legales y requerimientos de autoridad
                  competente
                </td>
                <td className={td}>Necesaria</td>
                <td className={td}>
                  No requiere consentimiento (artículo 9 de la Ley)
                </td>
              </tr>
              <tr>
                <td className={td}>
                  <strong>
                    Elaborar y comercializar estudios estadísticos agregados y
                    disociados sobre preferencias de premios, uso de la app y
                    región a nivel ciudad (derivada de su punto de anclaje)
                  </strong>
                  , para marcas y socios comerciales (sección 8, "Pulse")
                </td>
                <td className={td}>
                  <strong>Con derecho de negativa</strong>
                </td>
                <td className={td}>
                  Tácito, con mecanismo de exclusión en{" "}
                  <strong>Ajustes → Pulse</strong>
                </td>
              </tr>
              <tr>
                <td className={td}>
                  Enviarle comunicaciones promocionales propias de dovo
                  (novedades, recordatorios opcionales)
                </td>
                <td className={td}>
                  <strong>Con derecho de negativa</strong>
                </td>
                <td className={td}>
                  Tácito, con baja respondiendo "BAJA" al correo o desde
                  Ajustes
                </td>
              </tr>
              <tr>
                <td className={td}>Enviarle notificaciones push</td>
                <td className={td}>
                  <strong>Con derecho de negativa</strong>
                </td>
                <td className={td}>
                  Solo si usted las activa en su navegador; revocable en todo
                  momento
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          Si usted no desea que tratemos sus datos para las finalidades con
          derecho de negativa, puede manifestarlo desde el momento del registro
          y en cualquier momento posterior mediante los mecanismos indicados en
          la tabla y en la sección 15. La normativa le otorga además una
          ventana inicial de cinco días hábiles, a partir de que este aviso se
          pone a su disposición, para manifestar su negativa sin que ello
          condicione el servicio.{" "}
          <strong>
            Su derecho a negarse nunca expira: los cinco días hábiles son solo
            esa ventana inicial, no un límite.
          </strong>
        </p>
        <p>
          Conforme al artículo 11 de la Ley,{" "}
          <strong>
            cualquier finalidad nueva que no esté descrita en este aviso
            requerirá su nuevo consentimiento
          </strong>
          ; no nos basta con actualizar este documento.
        </p>
      </Section>

      <Section n={4} title="qué ve su dúo y qué no">
        <p>
          Compartir su avance con su compañero o compañera de dúo es la esencia
          de dovo. Su compañero o compañera de dúo es una persona distinta de
          usted y de dovo, por lo que esta comunicación constituye una{" "}
          <strong>transferencia de datos personales</strong> en términos del
          artículo 2, fracción XX de la Ley.{" "}
          <strong>
            Al formar un dúo usted manifiesta expresamente que acepta esta
            transferencia
          </strong>{" "}
          (artículo 35 de la Ley); además, la transferencia es necesaria para
          el mantenimiento y cumplimiento de la relación jurídica entre usted y
          dovo (artículo 36, fracción VII de la Ley), porque sin ella el
          servicio no puede prestarse. Si no acepta esta transferencia, no
          forme un dúo; tome en cuenta que dovo no funciona sin dúo.
        </p>
        <p>
          Al aceptar este aviso y formar un dúo, usted acepta que la otra
          persona de su dúo vea:
        </p>
        <Ul>
          <li>
            Su progreso general en el juego (niveles, retos, boosts, ataques).
          </li>
          <li>Sus check-ins.</li>
          <li>El resultado del veredicto semanal.</li>
          <li>El marcador y el contenido de LA APUESTA que ambos pactaron.</li>
        </Ul>
        <p>
          <strong>Su dúo NO ve sus datos de salud.</strong> Son visibles{" "}
          <strong>únicamente para usted</strong>:
        </p>
        <Ul>
          <li>Su peso, altura, edad y sexo.</li>
          <li>
            Su frecuencia cardiaca, sueño, calorías y demás métricas conectadas
            desde Apple Health / Health Connect.
          </li>
          <li>Las lesiones o molestias que usted reporte.</li>
          <li>
            Sus datos de nutrición (restricciones, alergias, alimentos vetados
            y favoritos, presupuesto).
          </li>
          <li>Sus fotografías de escaneo corporal.</li>
        </Ul>
      </Section>

      <Section n={5} title="datos sensibles y su consentimiento expreso">
        <p>
          Sus datos de perfil físico, salud y alergias son datos personales
          sensibles (artículo 2, fracción VI de la Ley). Por ello:
        </p>
        <Ul>
          <li>
            Solo los tratamos con su{" "}
            <strong>consentimiento expreso y por escrito</strong>, otorgado
            conforme al artículo 8 de la Ley mediante un mecanismo de
            autenticación: un interruptor dedicado y específico que usted
            activa dentro de su sesión autenticada, separado de la aceptación
            general de este aviso.{" "}
            <strong>Jamás usamos casillas premarcadas.</strong>
          </li>
          <li>
            <strong>
              El interruptor se le presenta antes de que la app le solicite
              cualquier dato sensible.
            </strong>{" "}
            Ningún campo de peso, altura, lesiones, alergias o similares se
            recaba sin que usted lo haya activado primero.
          </li>
          <li>
            Conservamos evidencia de su consentimiento en una bitácora de solo
            escritura que registra su identificador de usuario, la fecha y
            hora, y la versión de este aviso que usted aceptó (versión actual:
            1.0).
          </li>
          <li>
            Si usted no activa el interruptor de datos de salud, las funciones
            que dependen de esos datos (planes de entrenamiento y nutrición,
            validación de actividad y progreso) permanecen desactivadas; el
            resto del juego sigue disponible.
          </li>
          <li>
            Tratamos sus datos sensibles durante el periodo mínimo
            indispensable para las finalidades descritas (artículo 12 de la
            Ley) y mantenemos justificadas las finalidades concretas de cada
            base que los contiene (artículo 8 de la Ley).
          </li>
          <li>
            Puede revocar este consentimiento en cualquier momento (sección
            14).
          </li>
        </Ul>
      </Section>

      <Section
        n={6}
        title="compromisos sobre sus datos de salud (incluidas las reglas de apple y google)"
      >
        <p>
          Estos compromisos aplican hoy a todos sus datos de salud en dovo y,
          cuando exista la app nativa, también a los datos provenientes de
          Apple Health (HealthKit) y Health Connect:
        </p>
        <ol className="space-y-2 pl-5 list-decimal marker:opacity-50">
          <li>
            <strong>
              Nunca usamos sus datos de salud para publicidad, marketing ni
              minería de datos.
            </strong>{" "}
            La única excepción posible, siempre con su permiso, es mejorar la
            gestión de su propia salud y entrenamiento dentro de dovo.
          </li>
          <li>
            <strong>
              Nunca vendemos ni transferimos sus datos de salud a plataformas
              de publicidad, data brokers, revendedores de información ni a
              ningún tercero para sus fines propios.
            </strong>
          </li>
          <li>
            <strong>
              Nunca usamos sus datos de salud para decisiones de crédito,
              seguros, empleo o préstamos.
            </strong>
          </li>
          <li>
            Sus datos de salud{" "}
            <strong>
              jamás se utilizan como insumo de los estudios estadísticos
              comercializables
            </strong>{" "}
            descritos en la sección 8: ese producto se construye exclusivamente
            con los datos nativos del juego ahí enumerados.
          </li>
          <li>
            Los tipos exactos de datos de salud que podemos tratar son los
            enumerados en la sección 2, incisos b), c) (alergias) y h). Ningún
            otro.
          </li>
          <li>
            En la app nativa, el acceso a Apple Health / Health Connect se
            controla con los permisos granulares del sistema operativo: usted
            decide qué tipos comparte y puede revocar cada permiso en cualquier
            momento desde los ajustes de su dispositivo, además de desconectar
            la integración desde dovo.
          </li>
          <li>
            Nuestros proveedores técnicos (sección 10) tratan algunos de sus
            datos de salud{" "}
            <strong>por cuenta y bajo instrucciones de dovo</strong>, con
            prohibición contractual de usarlos para fines propios: Supabase los
            almacena en nuestra base de datos y, cuando se active la generación
            de planes con inteligencia artificial, Anthropic recibirá
            únicamente el inventario limitado de datos descrito en la sección
            10 — con una única excepción adicional que usted controla:{" "}
            <strong>
              si usted usa la función de escaneo corporal con análisis de
              inteligencia artificial, la fotografía que usted tome se remite a
              Anthropic exclusivamente para generar su análisis en ese momento,
              y no se usa para entrenar modelos
            </strong>
            . Eso no es venderlos ni compartirlos para fines ajenos.{" "}
            <strong>
              Los datos importados de Apple Health / Health Connect jamás se
              remitirán a Anthropic ni a ningún otro proveedor de inteligencia
              artificial
            </strong>
            : permanecen en nuestra base de datos, segregados como regla del
            sistema, y solo alimentan las funciones que usted ve en la app.
          </li>
          <li>
            Fuera de esos proveedores, solo compartiríamos datos de salud con
            un tercero si éste le presta a usted directamente un servicio de
            salud o fitness y usted lo autoriza de forma expresa y específica.
            Hoy no existe ningún tercero en ese supuesto.
          </li>
        </ol>
      </Section>

      <Section n={7} title="ubicación geográfica">
        <Ul>
          <li>
            dovo solo accede a su ubicación con su consentimiento: un
            interruptor dentro de la app más el permiso de ubicación de su
            navegador o sistema operativo (la app opera siempre bajo conexión
            cifrada HTTPS, requisito para que el navegador permita la
            geolocalización).
          </li>
          <li>
            Antes de pedirle el permiso, la app le explica para qué se usa la
            ubicación.
          </li>
          <li>
            Recabamos únicamente: (i) el punto de anclaje de su lugar de
            entrenamiento, que usted mismo fija; (ii) un punto al momento de
            cada check-in para validar su presencia, que se conserva solo como
            constancia de esa validación; y (iii) un resumen de distancia y
            duración cuando registra una carrera.
          </li>
          <li>
            Del punto de anclaje —y solo de él, nunca de los puntos de
            check-in— derivamos su región a nivel ciudad como categoría
            estadística para Pulse, únicamente si usted no se ha excluido
            (secciones 2.e y 8).
          </li>
          <li>
            <strong>
              No almacenamos rutas ni rastros GPS y no recolectamos su
              ubicación en segundo plano.
            </strong>
          </li>
          <li>
            Puede desactivar el uso de ubicación en cualquier momento desde
            Ajustes o revocando el permiso en su navegador o dispositivo; las
            funciones que dependen de ella dejarán de operar, sin afectar el
            resto del servicio.
          </li>
        </Ul>
      </Section>

      <Section
        n={8}
        title="pulse: estudios estadísticos agregados y disociados (y cómo negarse)"
      >
        <p>
          <strong>
            Dicho de frente: si usted no hace nada, sus datos SÍ entran a Pulse
            — siempre como categorías y conteos, nunca de forma identificable.
            Para salirse: Ajustes → Pulse, en cualquier momento.
          </strong>
        </p>
        <p>
          dovo declara desde el día uno la finalidad de{" "}
          <strong>
            elaborar y comercializar estudios estadísticos agregados y
            disociados sobre preferencias de premios, uso de la app y región a
            nivel ciudad
          </strong>
          , dirigidos a marcas y socios comerciales (por ejemplo: "el 40 % de
          los usuarios de la Ciudad de México apuesta premios de la categoría
          cine" — donde "Ciudad de México" se deriva del punto de anclaje que
          cada usuario fijó, nunca de coordenadas ni de puntos de check-in). A
          esta capa la llamamos <strong>Pulse</strong>. Funciona bajo las
          siguientes reglas:
        </p>
        <p>
          <strong>Cómo se construyen los estudios.</strong> Los estudios se
          calculan a partir de los datos enumerados abajo al momento de
          elaborarlos: el sistema clasifica la información en categorías y
          cuenta cuántas personas caen en cada una. Del proceso{" "}
          <strong>solo se conservan y se comparten categorías y conteos</strong>
          . El producto final es información disociada en términos del artículo
          2, fracción IX de la Ley: por su estructura, contenido y grado de
          agregación no permite identificarle, y conforme al artículo 9 de la
          Ley la información disociada puede tratarse sin consentimiento; aun
          así, declaramos esta finalidad y le damos derecho de negarse.
        </p>
        <p>
          <strong>Reglas duras, implementadas en el sistema:</strong>
        </p>
        <ol className="space-y-2 pl-5 list-decimal marker:opacity-50">
          <li>
            <strong>
              El texto libre de sus apuestas y premios jamás sale de dovo.
            </strong>{" "}
            Solo salen categorías ("cine", "comida") y conteos.
          </li>
          <li>
            <strong>
              Cohorte mínima de 100 personas (k ≥ 100), aplicada también a cada
              corte geográfico:
            </strong>{" "}
            ningún dato se comparte externamente si el grupo que lo respalda
            —incluido cualquier corte por ciudad— tiene menos de 100 personas.
            No se publican cortes que puedan aislar a un dúo o a una persona.
          </li>
          <li>
            <strong>Insumo: una lista cerrada de datos nativos del juego.</strong>{" "}
            Pueden entrar a Pulse únicamente: (i) las <strong>categorías</strong>{" "}
            de sus premios y apuestas (nunca el texto libre); (ii) la{" "}
            <strong>
              frecuencia de sus check-ins y de su uso de las funciones del
              juego
            </strong>{" "}
            (retos, boosts, ataques, niveles), tratadas como métricas de uso de
            la app, no como métricas de actividad física; y (iii) su{" "}
            <strong>región a nivel ciudad</strong>, derivada del punto de
            anclaje que usted fijó. <strong>Jamás entran a Pulse:</strong> sus
            datos de salud (incluido, en el futuro, cualquier dato de Apple
            Health / Health Connect), sus datos de nutrición (restricciones,
            alergias, alimentos vetados o favoritos), su presupuesto de
            alimentación, el texto libre de sus apuestas, sus coordenadas o
            puntos de check-in, su nombre o alias y su correo. Esa segregación
            es una regla del sistema.
          </li>
          <li>
            <strong>
              Usted puede excluirse en cualquier momento desde Ajustes → Pulse.
            </strong>{" "}
            Si cualquier miembro de un dúo se excluye,{" "}
            <strong>se excluye el dúo completo</strong>.
          </li>
          <li>
            <strong>La exclusión es definitiva hacia atrás:</strong> su
            histórico no vuelve a ingresar a los estudios, ni siquiera si usted
            deja el dúo o más tarde reactiva la opción para datos futuros.
          </li>
        </ol>
        <p>
          <strong>Lo que Pulse no es:</strong> no es venta de datos personales.
          Ningún estudio contiene nombres, correos, ubicaciones precisas o
          individuales (la única dimensión geográfica posible es la ciudad, con
          el umbral k ≥ 100), textos libres, datos de salud ni identificador
          alguno. Si algún día pretendiéramos transferir datos personales
          identificables a un tercero para sus fines propios, ello requeriría
          su consentimiento previo conforme al artículo 35 de la Ley; hoy no
          realizamos ni planeamos esa transferencia.
        </p>
      </Section>

      <Section n={9} title="decisiones y tratamientos automatizados">
        <p>dovo realiza los siguientes tratamientos automatizados de sus datos:</p>
        <Ul>
          <li>
            El <strong>veredicto semanal</strong> de su dúo, calculado
            automáticamente cada semana.
          </li>
          <li>
            El cálculo de <strong>niveles y puntuaciones</strong> del juego.
          </li>
          <li>
            La{" "}
            <strong>generación de planes de entrenamiento y nutrición</strong>{" "}
            a partir de su perfil. Hoy los genera un motor de reglas
            determinista; cuando se active la generación con inteligencia
            artificial, el proveedor será Anthropic, que recibirá
            exclusivamente el inventario limitado de datos descrito en la
            sección 10 — nunca su nombre, su correo, su ubicación ni datos de
            Apple Health / Health Connect.
          </li>
          <li>
            El <strong>análisis del escaneo corporal</strong>, si usted decide
            usarlo: la fotografía que usted tome se analiza con inteligencia
            artificial (Anthropic) únicamente para devolverle su análisis,
            conforme a la sección 10.
          </li>
        </Ul>
        <p>
          Conforme al artículo 26, fracción II de la Ley, usted tiene derecho a{" "}
          <strong>
            oponerse a tratamientos automatizados sin intervención humana
          </strong>{" "}
          que evalúen o predigan aspectos como su estado de salud o
          comportamiento y que le produzcan efectos no deseados o afecten
          significativamente sus intereses. Para ejercerlo, escriba a{" "}
          <strong>
            <a href="mailto:privacidad@dovofit.com" className="underline">
              privacidad@dovofit.com
            </a>
          </strong>{" "}
          indicando el tratamiento al que se opone: una persona revisará su
          caso y le responderá dentro del plazo máximo legal de 20 días.{" "}
          <strong>
            Si su oposición se refiere al veredicto semanal en curso, la
            atenderemos de forma prioritaria, buscando resolverla dentro del
            mismo ciclo semanal del juego; los 20 días son el máximo legal, no
            nuestra meta.
          </strong>{" "}
          Según el caso, la revisión humana podrá confirmar, corregir o
          desactivar el resultado automatizado correspondiente.
        </p>
      </Section>

      <Section n={10} title="encargados y transferencias de datos">
        <p>
          <strong>Encargados (remisiones).</strong> Para operar el servicio
          utilizamos proveedores que tratan datos por cuenta y bajo
          instrucciones de dovo, como personas encargadas en términos del
          artículo 2, fracción XII de la Ley. Estas remisiones no constituyen
          transferencias y no requieren su consentimiento; los encargados están
          obligados contractualmente a tratar sus datos solo conforme a
          nuestras instrucciones, con medidas de seguridad, y sin usarlos para
          fines propios (con la precisión sobre Stripe indicada abajo):
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm border-collapse">
            <thead>
              <tr>
                <th className={th}>Encargado</th>
                <th className={th}>Función</th>
                <th className={th}>Ubicación</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={td}>Supabase, Inc.</td>
                <td className={td}>
                  Base de datos, autenticación y almacenamiento
                </td>
                <td className={td}>Estados Unidos / Unión Europea</td>
              </tr>
              <tr>
                <td className={td}>Vercel, Inc.</td>
                <td className={td}>Alojamiento de la aplicación web</td>
                <td className={td}>Estados Unidos</td>
              </tr>
              <tr>
                <td className={td}>Resend, Inc.</td>
                <td className={td}>
                  Envío de correos transaccionales del servicio
                </td>
                <td className={td}>Estados Unidos</td>
              </tr>
              <tr>
                <td className={td}>Stripe, Inc.</td>
                <td className={td}>
                  Procesamiento de pagos (dovo no almacena tarjetas)
                </td>
                <td className={td}>Estados Unidos</td>
              </tr>
              <tr>
                <td className={td}>Anthropic, PBC</td>
                <td className={td}>
                  Generación de planes de entrenamiento y nutrición con
                  inteligencia artificial, cuando esta función se active, bajo
                  términos que prohíben el uso de su información para fines
                  propios, incluido el entrenamiento de modelos
                </td>
                <td className={td}>Estados Unidos</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          <strong>
            Qué recibirá exactamente Anthropic cuando se active la IA de
            planes:
          </strong>{" "}
          únicamente su perfil físico (peso, altura, edad, sexo, nivel de
          actividad, objetivo y experiencia), las lesiones o molestias que
          usted haya reportado y sus datos de nutrición (restricciones,
          alergias, alimentos vetados y favoritos, presupuesto).
          Adicionalmente,{" "}
          <strong>
            solo si usted usa la función de escaneo corporal con análisis de IA
          </strong>
          , recibirá la fotografía que usted tome, exclusivamente para generar
          ese análisis. <strong>Jamás recibirá:</strong> su nombre o alias, su
          correo electrónico, su ubicación, ni datos importados de Apple Health
          / Health Connect.
        </p>
        <p>
          <strong>Precisión sobre Stripe:</strong> además de actuar por cuenta
          de dovo, Stripe trata los datos del flujo de pago como responsable
          independiente para sus propios fines de prevención de fraude a nivel
          de red y cumplimiento regulatorio. Esa porción del flujo constituye
          una transferencia que no requiere su consentimiento por ser necesaria
          para la relación jurídica de suscripción que usted solicita (artículo
          36, fracción VII de la Ley).
        </p>
        <p>
          <strong>Transferencias.</strong> Las únicas transferencias de datos
          personales que dovo realiza son: (i) la comunicación a su compañero o
          compañera de dúo descrita en la sección 4, que usted acepta al formar
          el dúo y que es necesaria para la relación jurídica entre usted y
          dovo (artículo 36, fracción VII de la Ley); y (ii) la porción del
          flujo de pagos en la que Stripe actúa como responsable independiente,
          descrita arriba.{" "}
          <strong>
            Fuera de esas dos, dovo no transfiere sus datos personales
            identificables a terceros para que éstos los usen con fines
            propios.
          </strong>{" "}
          Únicamente comunicaríamos datos personales adicionales sin su
          consentimiento en los supuestos de excepción del artículo 36 de la
          Ley (por ejemplo, requerimientos fundados de autoridad competente o
          el ejercicio o defensa de derechos en un proceso). Si en el futuro
          pretendiéramos realizar una transferencia que requiera su
          consentimiento, se lo solicitaríamos de forma previa y expresa
          mediante la cláusula correspondiente, en la que usted podrá señalar
          si acepta o no la transferencia (artículo 35 de la Ley).
        </p>
      </Section>

      <Section n={11} title="notificaciones push">
        <p>
          Las notificaciones push son opcionales: solo se envían si usted las
          activa mediante el permiso de su navegador. Puede desactivarlas en
          cualquier momento desde los ajustes de su navegador o dispositivo,
          sin afectar el servicio.
        </p>
      </Section>

      <Section n={12} title="cookies y recolección automática de datos">
        <p>
          Al usar dovo se recaban automáticamente su dirección IP, agente de
          usuario y fecha y hora de acceso, con fines de seguridad y operación
          del servicio. Usamos exclusivamente{" "}
          <strong>cookies estrictamente necesarias</strong> para mantener su
          sesión iniciada.{" "}
          <strong>
            No usamos cookies de marketing, cookies de terceros con fines
            publicitarios, ni píxeles de redes sociales.
          </strong>
        </p>
        <p>
          Usted puede deshabilitar o eliminar las cookies desde la
          configuración de su navegador; tome en cuenta que, al ser cookies de
          sesión, deshabilitarlas le impedirá mantener la sesión iniciada en
          dovo.
        </p>
      </Section>

      <Section n={13} title="conservación, cancelación de cuenta y eliminación">
        <Ul>
          <li>
            Conservamos sus datos mientras su cuenta esté activa.{" "}
            <strong>
              Sus datos sensibles de salud y nutrición se conservan únicamente
              mientras el interruptor de datos de salud esté activo:
            </strong>{" "}
            si lo desactiva, se eliminan conforme a la sección 14, sin
            necesidad de cancelar la cuenta (artículo 12 de la Ley: periodo
            mínimo indispensable).
          </li>
          <li>
            Usted puede{" "}
            <strong>cancelar su cuenta en cualquier momento desde Ajustes</strong>
            . Al hacerlo, sus datos personales se eliminan en un plazo máximo
            de <strong>30 días naturales</strong>, salvo: (i) aquellos que
            debamos conservar o bloquear por obligación legal, únicamente por
            el plazo que esa obligación exija, y (ii) la información
            estadística ya disociada conforme a la sección 8, que por diseño es
            irreversible y ya no está ligada a su persona.
          </li>
          <li>
            Las fotografías de escaneo corporal pueden eliminarse
            individualmente desde la app en cualquier momento, sin cancelar la
            cuenta.
          </li>
        </Ul>
      </Section>

      <Section n={14} title="revocación del consentimiento">
        <p>
          Usted puede revocar en cualquier momento el consentimiento que nos
          haya otorgado, en términos del artículo 7 de la Ley, mediante estos
          mecanismos:
        </p>
        <Ul>
          <li>
            <strong>Datos de salud:</strong> desactivando el interruptor de
            datos de salud en Ajustes. Las funciones que dependen de esos datos
            se desactivan y{" "}
            <strong>
              sus datos de salud y nutrición —perfil físico, lesiones,
              alergias, restricciones y preferencias alimentarias, presupuesto,
              fotografías de escaneo corporal y, en su caso, las métricas ya
              importadas de Apple Health / Health Connect— se eliminan de
              nuestra base de datos en un plazo máximo de 30 días naturales.
            </strong>{" "}
            Solo se bloquean temporalmente, en lugar de eliminarse, aquellos
            que debamos conservar por obligación legal, y únicamente por el
            plazo que esa obligación exija.
          </li>
          <li>
            <strong>Ubicación:</strong> desactivando el interruptor en Ajustes
            o revocando el permiso del navegador o dispositivo.
          </li>
          <li>
            <strong>Apple Health / Health Connect (cuando exista):</strong>{" "}
            revocando los permisos en su dispositivo o desconectando la
            integración en Ajustes. Al hacerlo dejamos de recibir datos de
            inmediato y{" "}
            <strong>
              eliminamos los ya importados en un plazo máximo de 30 días
              naturales.
            </strong>
          </li>
          <li>
            <strong>Pulse:</strong> desde Ajustes → Pulse (sección 8).
          </li>
          <li>
            <strong>Comunicaciones promocionales:</strong> respondiendo "BAJA"
            a cualquier correo o desde Ajustes.
          </li>
          <li>
            <strong>Notificaciones push:</strong> desde su navegador o
            dispositivo.
          </li>
          <li>
            <strong>Cualquier otro consentimiento:</strong> escribiendo a{" "}
            <a href="mailto:privacidad@dovofit.com" className="underline">
              privacidad@dovofit.com
            </a>
            .
          </li>
        </Ul>
        <p>
          La revocación no tendrá efectos retroactivos sobre tratamientos ya
          realizados lícitamente, y puede implicar que ciertas funciones —o el
          servicio completo, si revoca consentimientos necesarios— dejen de
          estar disponibles para usted.
        </p>
      </Section>

      <Section n={15} title="limitación del uso o divulgación de sus datos">
        <p>
          Además de la revocación, usted puede{" "}
          <strong>limitar el uso o divulgación</strong> de sus datos personales
          (artículo 15, fracción IV de la Ley) mediante:
        </p>
        <Ul>
          <li>
            <strong>Ajustes → Pulse</strong>, para excluir sus datos de los
            estudios estadísticos agregados.
          </li>
          <li>
            La respuesta <strong>"BAJA"</strong> a correos promocionales o el
            ajuste correspondiente, para dejar de recibir comunicaciones no
            indispensables. Su solicitud se registra en una lista interna de
            exclusión para que no vuelva a recibirlas.
          </li>
          <li>
            Una solicitud a{" "}
            <strong>
              <a href="mailto:privacidad@dovofit.com" className="underline">
                privacidad@dovofit.com
              </a>
            </strong>{" "}
            describiendo la limitación concreta que desea (por ejemplo,
            restringir la visibilidad de algún dato frente a su dúo en lo que
            las funciones lo permitan, o limitar un canal de contacto). Le
            responderemos en un plazo máximo de 20 días.
          </li>
        </Ul>
      </Section>

      <Section n={16} title="derechos arco">
        <p>
          Usted tiene derecho a <strong>Acceder</strong> a sus datos
          personales, <strong>Rectificarlos</strong> cuando sean inexactos o
          incompletos, <strong>Cancelarlos</strong> y <strong>Oponerse</strong>{" "}
          a su tratamiento (artículos 22 a 26 de la Ley). Puede ejercer estos
          derechos usted o su representante legal debidamente acreditado:
        </p>
        <Ul>
          <li>
            <strong>Por correo:</strong> escriba a{" "}
            <strong>
              <a href="mailto:privacidad@dovofit.com" className="underline">
                privacidad@dovofit.com
              </a>
            </strong>{" "}
            indicando (i) su nombre o alias y el correo de su cuenta, (ii) el
            derecho que desea ejercer, (iii) una descripción clara de los datos
            o el tratamiento de que se trate, y (iv) cualquier elemento que
            facilite localizar sus datos.
          </li>
          <li>
            <strong>
              Acreditación de identidad (artículos 28, fracción II, y 31 de la
              Ley):
            </strong>{" "}
            antes de entregar, modificar o eliminar datos le pediremos{" "}
            <strong>
              confirmar la solicitud dentro de su sesión autenticada en dovo
            </strong>
            ; el solo envío desde el correo registrado no es suficiente,
            especialmente cuando la solicitud involucra datos de salud. Si
            usted no puede acceder a su cuenta, podrá acreditar su identidad
            con los documentos que prevé la Ley.
          </li>
          <li>
            <strong>Desde la app:</strong> en Ajustes puede consultar y editar
            directamente sus datos de perfil y cancelar su cuenta.
          </li>
        </Ul>
        <p>
          Le responderemos en un plazo máximo de <strong>20 días</strong>{" "}
          contados desde la recepción de su solicitud y, de resultar
          procedente, la haremos efectiva dentro de los 15 días siguientes a la
          respuesta (artículo 31 de la Ley). La respuesta será gratuita; solo
          se le podrían cobrar gastos justificados de envío o reproducción, en
          su caso.
        </p>
        <p>
          La Ley vigente no contempla un derecho de portabilidad de datos para
          el sector privado, por lo que dovo no lo ofrece como derecho legal;
          no obstante, mediante el derecho de acceso usted puede obtener la
          información que tenemos sobre usted.
        </p>
      </Section>

      <Section n={17} title="menores de edad">
        <p>
          dovo es un servicio exclusivamente para personas{" "}
          <strong>de 18 años cumplidos o más</strong>. No dirigimos el servicio
          a menores de edad ni tratamos deliberadamente sus datos. Si usted
          tiene menos de 18 años, no cree una cuenta. Si detectamos una cuenta
          de una persona menor de 18 años, la cancelaremos y eliminaremos sus
          datos conforme a la sección 13.
        </p>
      </Section>

      <Section n={18} title="medidas de seguridad">
        <p>
          Mantenemos las medidas de seguridad administrativas, técnicas y
          físicas que exige el artículo 18 de la Ley para proteger sus datos
          contra daño, pérdida, alteración, destrucción y uso, acceso o
          tratamiento no autorizados, entre ellas:
        </p>
        <Ul>
          <li>Cifrado TLS (HTTPS) en todo el tráfico.</li>
          <li>
            Aislamiento por reglas de seguridad a nivel de fila en la base de
            datos: cada usuario solo puede leer y modificar sus propios datos y
            los compartidos con su dúo conforme a la sección 4; sus datos de
            salud —incluidos peso, altura, edad y sexo— son visibles solo para
            usted.
          </li>
          <li>Bitácora de consentimientos de solo escritura (sección 5).</li>
          <li>
            Reglas de sistema que impiden que el texto libre, los datos de
            salud y de nutrición, las coordenadas y los puntos de check-in
            ingresen a los productos estadísticos (sección 8).
          </li>
          <li>Acceso interno restringido al mínimo necesario.</li>
          <li>
            Procesamiento de pagos delegado a Stripe, sin almacenamiento de
            tarjetas en dovo.
          </li>
        </Ul>
        <p>
          En caso de una vulneración de seguridad que afecte de forma
          significativa sus derechos, se lo informaremos sin dilación, conforme
          a la Ley.
        </p>
      </Section>

      <Section n={19} title="cambios a este aviso de privacidad">
        <p>
          Podemos modificar este aviso para reflejar cambios legales,
          regulatorios o del producto (artículo 15, fracción VI de la Ley).
          Cualquier modificación se publicará en{" "}
          <strong>
            <a href="/privacidad" className="underline">
              https://dovofit.com/privacidad
            </a>
          </strong>{" "}
          con su número de versión y fecha visibles. Si el cambio es
          sustantivo, se lo notificaremos además por correo electrónico o
          dentro de la app{" "}
          <strong>
            con al menos 15 días naturales de anticipación a que surta efectos
          </strong>
          . Si el cambio implica finalidades nuevas,{" "}
          <strong>
            le pediremos un nuevo consentimiento antes de tratar sus datos para
            ellas
          </strong>{" "}
          (artículo 11 de la Ley); actualizar el aviso no sustituye ese
          consentimiento. Conservamos el historial de versiones y el registro
          de la versión que cada usuario aceptó.
        </p>
      </Section>

      <Section n={20} title="autoridad competente">
        <p>
          La autoridad encargada de vigilar y garantizar la protección de datos
          personales en el sector privado es la{" "}
          <strong>Secretaría Anticorrupción y Buen Gobierno (SABG)</strong>, a
          través de su Unidad de Protección de Datos Personales (artículo 2,
          fracción XV, y artículos 38 y 39 de la Ley).
        </p>
        <p>
          Si usted considera que dovo ha vulnerado su derecho a la protección
          de datos personales, le pedimos contactarnos primero en{" "}
          <strong>
            <a href="mailto:privacidad@dovofit.com" className="underline">
              privacidad@dovofit.com
            </a>
          </strong>
          . Adicionalmente, usted puede presentar una{" "}
          <strong>solicitud de protección de derechos ante la SABG</strong>{" "}
          (artículo 40 de la Ley) en dos supuestos distintos:
        </p>
        <Ul>
          <li>
            <strong>
              Si recibió respuesta de dovo a su solicitud ARCO y no le
              satisface:
            </strong>{" "}
            dentro de los <strong>15 días siguientes</strong> a que se le
            comunique la respuesta.
          </li>
          <li>
            <strong>Si dovo no le respondió dentro del plazo legal:</strong>{" "}
            <strong>a partir de que venza ese plazo</strong>, sin que la Ley
            fije en este supuesto una ventana límite para presentarla.
          </li>
        </Ul>
        <p>
          También puede presentar denuncias ante la propia SABG por presuntos
          incumplimientos a la Ley. Más información en{" "}
          <a
            href="https://www.gob.mx/buengobierno"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            https://www.gob.mx/buengobierno
          </a>
          .
        </p>
      </Section>

      <p className="text-sm leading-relaxed border-t border-ink/15 pt-6">
        <strong>
          Al crear su cuenta en dovo usted declara que ha leído este Aviso de
          Privacidad y consiente el tratamiento de sus datos personales
          conforme al mismo; al formar un dúo, acepta además la transferencia
          descrita en la sección 4.
        </strong>{" "}
        Los consentimientos expresos (datos de salud, ubicación y pagos) se le
        solicitarán por separado, en el momento correspondiente, mediante los
        mecanismos descritos en las secciones 3, 5, 6 y 7.
      </p>
      <p className="text-xs mono opacity-60 mt-6">
        Aviso de Privacidad Integral de dovo · Versión 1.0 · 12 de junio de
        2026 ·{" "}
        <a href="mailto:privacidad@dovofit.com" className="underline">
          privacidad@dovofit.com
        </a>
      </p>

      <Footer>
        Aviso de Privacidad Integral · Versión 1.0 · 12 de junio de 2026 ·
        Cualquier duda:{" "}
        <a href="mailto:privacidad@dovofit.com" className="underline">
          privacidad@dovofit.com
        </a>
      </Footer>
    </>
  );
}
