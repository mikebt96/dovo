# Aviso de Privacidad — dovo

**Última actualización**: 2026-05-19
**Versión**: 0.1 (borrador)

> ⚠️ **Este documento es un borrador para revisión por abogado de privacidad antes del soft launch.** Marcadores `TODO:` indican datos que Miguel debe completar. No publicar como aviso definitivo sin esa revisión.

---

## 1. Responsable del tratamiento

El responsable del tratamiento de sus datos personales es:

- **Nombre / razón social**: TODO: Miguel Ángel Butrón López, persona física con actividad empresarial (o nombre de la sociedad si se constituye antes del launch).
- **Domicilio**: TODO: domicilio fiscal en Ciudad de México, México.
- **Correo de contacto en materia de privacidad**: `privacidad@dovofit.com` (TODO: configurar buzón).
- **Producto**: dovo, plataforma de commitment device para dúos enfocada en actividad física compartida, accesible en `https://dovofit.com`.

## 2. Datos personales que se recaban

Cuando usted crea una cuenta y usa dovo, se recaban los siguientes datos:

**Datos de identificación**:
- Nombre o alias.
- Correo electrónico (para autenticación por magic link y comunicaciones del servicio).

**Datos de uso del servicio**:
- Tratos que crea o acepta (texto del objetivo, frecuencia, duración, recompensa y castigo acordados).
- Check-ins de cumplimiento que registra.
- Disputas que marca sobre check-ins del otro miembro de su dúo.
- Resultado y fecha de cierre de cada trato.

**Datos técnicos** (recabados automáticamente):
- Dirección IP, agente de usuario, fecha y hora del acceso.
- Cookies estrictamente necesarias para mantener su sesión (no cookies de marketing ni de terceros).

**Datos que NO se recaban**:
- Teléfono. KYC. Fotografía obligatoria. Datos bancarios o financieros (dovo no custodia dinero). Datos sensibles en el sentido del artículo 3, fracción VI de la LFPDPPP (origen racial o étnico, salud, opiniones políticas, convicciones religiosas, vida sexual). Si usted captura voluntariamente este tipo de contenido en el texto de un trato, lo hace bajo su exclusiva responsabilidad y consentimiento expreso conforme a los Términos de Servicio.

## 3. Finalidades del tratamiento

### Finalidades primarias (necesarias para prestar el servicio)

a) Crear y mantener su cuenta.
b) Permitir la creación, invitación, aceptación, ejecución y cierre de tratos entre usted y la persona que invite.
c) Mostrarle a usted y al otro miembro de su dúo el estado, los check-ins y el resultado de los tratos compartidos.
d) Calcular y mostrar su score de cumplimiento agregado.
e) Cumplir con obligaciones legales aplicables a dovo.

### Finalidades secundarias (no necesarias; usted puede oponerse)

f) Enviarle comunicaciones del producto (cambios al servicio, recordatorios opcionales de check-in).
g) Generar estadísticas agregadas anonimizadas sobre patrones de cumplimiento de tratos para mejorar el producto, publicar reportes, o compartirlas con socios académicos o comerciales conforme a la cláusula 5 ("Pulse") más abajo.

Si usted no desea que sus datos se traten para las finalidades secundarias f) y g), puede oponerse en cualquier momento desde **Ajustes → Pulse** (para la finalidad g) o respondiendo "BAJA" al correo de comunicaciones (para f).

## 4. Fundamento legal

El tratamiento se realiza con fundamento en su consentimiento expreso al aceptar este aviso al crear cuenta, así como en los artículos 8, 16 y 17 de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento.

## 5. Pulse — estadísticas agregadas anonimizadas

dovo opera una capa estadística llamada **Pulse**. Las estadísticas de Pulse:

a) Nunca incluyen información personal identificable: ni su nombre, ni su correo, ni el texto de su trato, ni los detalles de la recompensa o el castigo.

b) Solo incluyen señales agregadas en cohortes de 100 personas o más (umbral k-anonymity ≥ 100).

c) Pueden ser publicadas en reportes públicos, compartidas con socios académicos (universidades, centros de investigación) sin costo, o eventualmente licenciadas a terceros con fines de investigación o inteligencia sectorial.

d) Por arquitectura técnica, viven en una base de datos lógicamente separada de la base de tratos individuales y no son re-identificables a un usuario.

Usted puede desactivar su contribución futura a Pulse desde **Ajustes → Pulse**. Al hacerlo, sus tratos futuros no se ingieren al dataset. Los datos previamente agregados no son reversibles por arquitectura (ya no están ligados a su persona).

## 6. Transferencias de datos

Sus datos personales se almacenan y procesan en infraestructura proporcionada por los siguientes encargados:

- **Supabase, Inc.** (Estados Unidos / Unión Europea, según región del proyecto) — base de datos PostgreSQL, autenticación y storage.
- **Vercel, Inc.** (Estados Unidos) — hosting de la aplicación web.
- TODO: si se integra Resend para email transactional, agregar Resend (US/EU) como encargado.

Estos encargados están contractualmente obligados a tratar sus datos únicamente conforme a las instrucciones de dovo y a mantener medidas de seguridad razonables. dovo no transfiere sus datos a terceros con fines comerciales sin su consentimiento, salvo en los casos previstos en el artículo 37 de la LFPDPPP (obligaciones legales, requerimientos de autoridad competente).

## 7. Derechos ARCO

Usted tiene derecho en todo momento a:

- **Acceder** a sus datos personales que dovo posea.
- **Rectificar** datos inexactos o incompletos.
- **Cancelar** sus datos cuando considere que no se están tratando conforme a la ley.
- **Oponerse** al tratamiento para finalidades específicas.

Para ejercer estos derechos, envíe una solicitud al correo `privacidad@dovofit.com` indicando: (i) su nombre y correo de la cuenta, (ii) el derecho que ejerce, (iii) la finalidad o tratamiento al que se refiere. dovo responderá en un plazo máximo de 20 días hábiles conforme a la LFPDPPP.

Adicionalmente, dovo ofrece desde la propia aplicación:
- **Edición de datos** desde Ajustes → tu cuenta.
- **Cancelación de cuenta** desde Ajustes → tu cuenta (al cancelar, sus tratos activos se cierran con resultado "sin resolver" y sus datos personales se eliminan en un plazo de 30 días, salvo aquellos que dovo deba conservar por obligación legal o como evidencia anonimizada para Pulse).

## 8. Cookies y tecnologías similares

dovo utiliza únicamente cookies estrictamente necesarias para mantener su sesión activa después del magic link. No se usan cookies de marketing, ni cookies de terceros con fines publicitarios, ni píxeles de redes sociales.

## 9. Medidas de seguridad

dovo aplica medidas razonables de seguridad administrativas, físicas y técnicas para proteger sus datos:

- Conexiones cifradas TLS en todo el tráfico (HTTPS).
- Aislamiento por Row Level Security en la base de datos: usted solo puede leer y modificar sus propios tratos y los del dúo que aceptó.
- Separación arquitectónica entre la base de datos de tratos individuales (`core`) y la base de estadísticas agregadas (`pulse`), con llaves de servicio no relacionables.
- Acceso interno limitado al personal estrictamente necesario.

## 10. Cambios al aviso de privacidad

dovo puede modificar este aviso para reflejar cambios legales o de producto. Cualquier modificación se publicará en `https://dovofit.com/privacidad` con una fecha de actualización visible en la parte superior. Si los cambios son sustantivos, dovo le notificará por correo electrónico con anticipación razonable antes de su entrada en vigor.

## 11. Cumplimiento y reporte

dovo opera bajo las disposiciones de la LFPDPPP y mantiene reportes trimestrales públicos sobre el uso del dataset agregado de Pulse en `https://dovofit.com/pulse-reportes` (TODO: ruta pendiente de crear).

Si usted considera que su derecho a la protección de datos personales ha sido vulnerado, puede acudir ante el Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI) en `https://home.inai.org.mx`.

---

*Borrador 0.1 · Sujeto a revisión por abogado de privacidad · No publicar como definitivo sin esa revisión.*
