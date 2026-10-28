# Política de privacidad de WHISP

*Esta traducción se ofrece únicamente a título informativo. En caso de discrepancia, prevalece la versión en inglés.*

**Última actualización:** octubre de 2026

## 1. Sobre esta política

WHISP («What is in that plot?», ¿qué hay en esa parcela?) es desarrollado y mantenido por la **Forest Data Partnership** en el marco de la **Organización de las Naciones Unidas para la Alimentación y la Agricultura (FAO)** a través de la iniciativa **OpenForis**. Como plataforma de la FAO, WHISP se rige por el [Aviso de protección de datos y privacidad](https://www.fao.org/contact-us/data-protection-and-privacy/es/) y la [Política de protección de datos](https://www.fao.org/fileadmin/user_upload/legal/docs/AC2022-06.pdf) de la FAO, y no por un marco jurídico nacional o regional concreto. Esta política añade lo específico de WHISP y explica de forma clara y honesta qué datos recopilamos, cómo los utilizamos y qué control le ofrecemos sobre su información. Si ambos textos difieren en una cuestión de protección de datos, prevalece el aviso de la FAO. Nada de lo dispuesto en esta política constituye una renuncia a los privilegios e inmunidades de la FAO.

- **Sitio web:** [https://whisp.openforis.org](https://whisp.openforis.org)
- **Contacto:** [Open-Foris@fao.org](mailto:Open-Foris@fao.org)
- **Repositorio:** [https://github.com/forestdatapartnership/whisp-app](https://github.com/forestdatapartnership/whisp-app)

## 2. Qué datos recopilamos

### 2.1 Datos de la cuenta

Las cuentas de WHISP se crean mediante el inicio de sesión único (SSO) de la FAO. La primera vez que inicia sesión, el servicio de inicio de sesión de la FAO confirma su identidad y envía a WHISP su nombre, su dirección de correo electrónico y un identificador de cuenta. WHISP nunca recibe su contraseña de SSO, y su cuenta de SSO la gestiona la FAO. Las cuentas creadas antes del SSO, que inician sesión con una contraseña de WHISP («cuentas propias de WHISP»), también conservan una contraseña y, opcionalmente, una organización.

| Dato | Finalidad |
|---|---|
| **Identificador de la cuenta de SSO** | Vincular su cuenta de WHISP con su inicio de sesión de la FAO |
| **Nombre y apellidos** | Identificación de la cuenta |
| **Dirección de correo electrónico** | Identificación de la cuenta, notificaciones, restablecimiento de contraseña en las cuentas propias de WHISP |
| **Contraseña** (cuentas propias de WHISP) | Autenticación (almacenada como hash bcrypt, nunca en texto plano) |
| **Organización** (cuentas propias de WHISP, opcional) | Contexto del perfil de usuario |

### 2.2 Datos técnicos

Al utilizar el servicio WHISP, recopilamos automáticamente:

| Dato | Finalidad | Conservación |
|---|---|---|
| **Dirección IP** | Seguridad, prevención de abusos, limitación de solicitudes | Anonimizada tras el periodo de conservación configurable (por defecto: 90 días) |
| **Agente de usuario** | Depuración, compatibilidad | Política de rotación de registros |
| **Clave de API** | Control de acceso a la API y limitación de solicitudes; se crea automáticamente la primera vez que inicia sesión | Hasta su revocación o la eliminación de la cuenta |

### 2.3 Datos de análisis

Al enviar geometrías para su análisis geoespacial:

| Dato | Finalidad |
|---|---|
| **Geometrías** (GeoJSON, WKT o GeoIDs) | Análisis de riesgo geoespacial mediante Google Earth Engine |
| **Opciones de análisis** (parámetros técnicos) | Configuración de la ejecución del análisis |
| **Metadatos del trabajo de análisis** (marcas de tiempo, estado, tipo de agente, punto de conexión) | Funcionamiento del servicio, auditoría, depuración |

Las geometrías pueden ser sensibles según el contexto (p. ej., el límite de una finca vinculado a una persona). El motor de análisis de WHISP procesa las geometrías **sin ningún contexto que identifique al usuario**; véase el [Anexo sobre la separación de datos de GEE](./gee-data-separation) para conocer la evidencia técnica.

### 2.4 Datos de notificaciones

| Dato | Finalidad |
|---|---|
| **Dirección de correo electrónico** | Notificaciones del servicio |
| **Estado de la suscripción** | Gestión de las preferencias de notificación |

### 2.5 Comentarios

| Dato | Finalidad |
|---|---|
| **Respuestas al formulario de comentarios** (valoración, región, tipo de organización, respuestas de texto libre) | Mejorar WHISP |

Si ha iniciado sesión, sus comentarios se vinculan a su cuenta. No incluya datos personales en sus comentarios.

## 3. Cómo utilizamos sus datos

Utilizamos sus datos personales exclusivamente para:

- **Prestar el servicio**: gestión de la cuenta, autenticación, acceso a la API
- **Ejecutar análisis geoespaciales**: procesar las geometrías que envía a través de Google Earth Engine (no se envía ningún dato personal a GEE)
- **Comunicaciones del servicio**: restablecimiento de contraseña en las cuentas propias de WHISP, notificaciones del servicio
- **Seguridad y prevención de abusos**: limitación de solicitudes, detección de abusos basada en la IP
- **Mejora del servicio**: estadísticas de uso agregadas y no identificativas

**No** utilizamos sus datos para:
- Elaborar perfiles ni tomar decisiones automatizadas
- Publicidad o marketing dirigidos a terceros
- Venderlos o cederlos a terceros

## 4. Conservación de los datos

| Categoría de datos | Periodo de conservación |
|---|---|
| **Datos de la cuenta** (nombre, correo electrónico, identificador de SSO; hash de la contraseña en las cuentas propias de WHISP) | Hasta que elimine su cuenta |
| **Direcciones IP** en los registros de trabajos de análisis | Anonimizadas automáticamente tras el periodo de conservación configurado (por defecto: 90 días) |
| **Metadatos de los trabajos de análisis** | Conservados para el funcionamiento del servicio; las direcciones IP que contienen se anonimizan según el calendario anterior |
| **Claves de API** | Hasta su revocación o la eliminación de la cuenta (eliminación lógica para el registro de auditoría) |
| **Tokens de restablecimiento de contraseña** (cuentas propias de WHISP) | Válidos durante 1 hora; revocados tras su uso |
| **Suscripciones a notificaciones** | Hasta que cancele la suscripción o elimine su cuenta |
| **Comentarios** | Se conservan para mejorar el servicio; se desvinculan de su cuenta si la elimina |
| **Registros de la aplicación** | Sujetos a la política de rotación de registros de la infraestructura |

## 5. Servicios de terceros y transferencias de datos

WHISP interactúa con los siguientes servicios de terceros durante su funcionamiento:

| Servicio | Datos compartidos | Finalidad |
|---|---|---|
| **Google Cloud** | Todos los datos que almacena WHISP (como cuentas, claves de API, registros de trabajos de análisis y comentarios) | Alojamiento de la aplicación y de su base de datos |
| **Google Earth Engine** | Únicamente geometrías y parámetros técnicos de análisis. **No se transmite ningún dato personal** (nombres, correos electrónicos, IP, identificadores de usuario). | Motor de cálculo geoespacial |
| **Asset Registry** | GeoIDs (cuando se envían GeoIDs) y, si inicia sesión con SSO, un token de acceso de SSO de corta duración | Resolución de identificadores geográficos a geometrías |
| **SMTP de Google Gmail** | Dirección de correo del destinatario, contenido del mensaje | Envío de correos de restablecimiento de contraseña en las cuentas propias de WHISP |
| **API de Google Maps** | Interacciones del mapa en el cliente (sujetas a la política de privacidad de Google) | Visualización de mapas en la interfaz |

WHISP se ejecuta en servidores de Google Cloud en Europa. Para la evidencia técnica de la separación de datos entre WHISP y Google Earth Engine, véase el [Anexo sobre la separación de datos de GEE](./gee-data-separation).

## 6. Cookies y almacenamiento local

WHISP utiliza las siguientes cookies:

| Cookie | Tipo | Finalidad | Duración |
|---|---|---|---|
| `token` | Estrictamente necesaria | Sesión de WHISP (JWT) | 30 minutos |
| `refreshToken` | Estrictamente necesaria | Renovación de la sesión de WHISP | 7 días |
| `kc_refresh_token` | Estrictamente necesaria | Mantener su sesión de SSO para las consultas de GeoID y el cierre de sesión en SSO | 30 días |
| `sso_state` | Estrictamente necesaria | Proteger la redirección del inicio de sesión con SSO | 5 minutos |

Estas cookies son:
- **HttpOnly**: no accesibles desde JavaScript en el cliente
- **Secure**: se transmiten únicamente por HTTPS (en producción)
- **SameSite=Strict**: no se envían con solicitudes entre sitios, salvo `sso_state`, que usa SameSite=Lax para que se siga enviando cuando la página de inicio de sesión de la FAO le redirige de vuelta

WHISP también guarda lo siguiente en su navegador. Estos datos no se envían a los servidores de WHISP:

| Elemento | Almacenamiento | Finalidad |
|---|---|---|
| `whisp-theme` | Almacenamiento local | Su elección de tema claro u oscuro |
| `whisp-intro-dismissed` | Almacenamiento local | Recordar que cerró la introducción |
| `whisp-feedback-prompt-dismissed` | Almacenamiento local | Recordar que respondió o cerró la invitación a dejar comentarios |
| `whisp-sync:…` | Almacenamiento de sesión | Pasar los resultados del análisis a la página de resultados; se eliminan una vez leídos |
| `whisp-release-v…` | Almacenamiento de sesión | Guardar en caché el enlace a las notas de la versión actual |
| Base de datos `whisp` | IndexedDB | Mostrar un archivo de resultados que abre desde su equipo; se elimina al volver a la página de envío |

WHISP no utiliza cookies de analítica, seguimiento ni publicidad.

## 7. Sus datos, bajo su control

Creemos que usted debe tener un control real sobre sus datos personales. Esto es lo que ofrece WHISP:

### 7.1 Acceder a sus datos

Puede consultar sus datos personales en cualquier momento en la página **Cuenta** de WHISP. Para recibir una copia de los datos personales que conservamos sobre usted, presente una solicitud formal (véase el apartado 7.6).

### 7.2 Corregir sus datos

Si inicia sesión con SSO, su nombre y su dirección de correo electrónico proceden de su cuenta de la FAO; puede cambiarlos allí mediante **Gestionar cuenta** en la página **Cuenta**. En las cuentas propias de WHISP, puede actualizar su nombre, apellidos y organización en la página **Cuenta**; para cambiar su dirección de correo electrónico, póngase en contacto con nosotros.

### 7.3 Eliminar su cuenta

Puede eliminar de forma permanente su cuenta y todos los datos asociados desde la página **Cuenta**. La eliminación de la cuenta:
- Requiere confirmación y, en las cuentas propias de WHISP, la contraseña
- Elimina permanentemente su perfil de usuario, claves de API, tokens de verificación, tokens de restablecimiento de contraseña y suscripciones a notificaciones
- Anonimiza los registros de trabajos de análisis y los comentarios asociados

Eliminar su cuenta de WHISP no elimina su cuenta de SSO, que gestiona la FAO.

### 7.4 Limitar el tratamiento de datos

Puede reducir los datos que tratamos activamente revocando su clave de API, cancelando la suscripción a las notificaciones o eliminando su cuenta por completo. También puede oponerse al tratamiento de sus datos mediante una solicitud formal (véase el apartado 7.6).

### 7.5 Darse de baja de las notificaciones

Puede cancelar la suscripción a las notificaciones del servicio en cualquier momento desde la página **Cuenta** o poniéndose en contacto con nosotros.

### 7.6 Solicitudes formales e inquietudes

Si le preocupa cómo se tratan sus datos, le animamos a ponerse en contacto directamente con nosotros. Nos tomamos en serio todas las inquietudes relacionadas con la protección de datos y responderemos con prontitud.

También puede presentar una solicitud formal para acceder a sus datos personales (incluida una copia), corregirlos o eliminarlos, o para oponerse a su tratamiento, ante la Unidad de Protección de Datos de la FAO: preséntela en el [portal ServiceNow de la FAO](https://fao.service-now.com/csp) y seleccione **Data Privacy**. Es posible que la FAO necesite verificar primero su identidad, y le explicará si alguna parte de la solicitud no puede atenderse.

## 8. Seguridad de los datos

Aplicamos las siguientes medidas técnicas para proteger sus datos:

- **Inicio de sesión único de la FAO**, de modo que WHISP nunca maneja su contraseña de SSO
- **Hash de contraseñas** con bcrypt (hash unidireccional con sal) en las cuentas propias de WHISP
- **Tokens JWT** almacenados en cookies seguras HttpOnly con SameSite=Strict
- **Restricciones CORS** limitadas a los orígenes permitidos configurados
- **Limitación de solicitudes** en los puntos de conexión de la API y en el envío de comentarios
- **Política de contraseñas robustas** en las cuentas propias de WHISP (mínimo 8 caracteres con mayúscula, minúscula, número y carácter especial)
- **Anonimización automática de datos personales** de las direcciones IP tras el periodo de conservación configurado
- **Separación por diseño** entre los datos de la cuenta de usuario y el procesamiento del análisis geoespacial

Si un incidente de seguridad pone en riesgo significativo sus datos personales, la FAO aplica sus procedimientos de respuesta a incidentes, que pueden incluir informar a los usuarios afectados.

## 9. Menores

WHISP no está dirigido a menores de edad y no recopilamos de forma consciente datos personales de niños.

## 10. Cambios en esta política

Podemos actualizar esta política de privacidad ocasionalmente. Los cambios se reflejarán en la fecha de «Última actualización» que figura al principio de este documento. Los cambios sustanciales se comunicarán a través del servicio.

## 11. Contacto

Si tiene preguntas sobre esta política de privacidad o sobre sus datos personales, escriba a:

[Open-Foris@fao.org](mailto:Open-Foris@fao.org)

Para solicitudes formales de protección de datos, utilice el portal ServiceNow de la FAO como se describe en el apartado 7.6.
