# Política de privacidad de WHISP

*Esta traducción se ofrece únicamente a título informativo. En caso de discrepancia, prevalece la versión en inglés.*

**Última actualización:** marzo de 2026

## 1. Sobre esta política

WHISP («What is in that plot?», ¿qué hay en esa parcela?) es desarrollado y mantenido por la **Forest Data Partnership** en el marco de la **Organización de las Naciones Unidas para la Alimentación y la Agricultura (FAO)** a través de la iniciativa **OpenForis**. Como programa de las Naciones Unidas, WHISP se rige por los principios internos de protección de datos de la FAO y no por un marco jurídico nacional o regional concreto. Esta política explica de forma clara y honesta qué datos recopilamos, cómo los utilizamos y qué control le ofrecemos sobre su información.

- **Sitio web:** [https://whisp.openforis.org](https://whisp.openforis.org)
- **Contacto:** [Open-Foris@fao.org](mailto:Open-Foris@fao.org)
- **Repositorio:** [https://github.com/forestdatapartnership/whisp-app](https://github.com/forestdatapartnership/whisp-app)

## 2. Qué datos recopilamos

### 2.1 Datos de la cuenta

Al registrar una cuenta de WHISP, recopilamos:

| Dato | Finalidad |
|---|---|
| **Nombre y apellidos** | Identificación de la cuenta |
| **Dirección de correo electrónico** | Autenticación, verificación de la cuenta, restablecimiento de contraseña, notificaciones |
| **Contraseña** | Autenticación (almacenada como hash bcrypt, nunca en texto plano) |
| **Organización** (opcional) | Contexto del perfil de usuario |

### 2.2 Datos técnicos

Al utilizar el servicio WHISP, recopilamos automáticamente:

| Dato | Finalidad | Conservación |
|---|---|---|
| **Dirección IP** | Seguridad, prevención de abusos, limitación de solicitudes | Anonimizada tras el periodo de conservación configurable (por defecto: 90 días) |
| **Agente de usuario** | Depuración, compatibilidad | Política de rotación de registros |
| **Clave de API** | Control de acceso a la API y limitación de solicitudes | Hasta su revocación o la eliminación de la cuenta |

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

## 3. Cómo utilizamos sus datos

Utilizamos sus datos personales exclusivamente para:

- **Prestar el servicio**: gestión de la cuenta, autenticación, acceso a la API
- **Ejecutar análisis geoespaciales**: procesar las geometrías que envía a través de Google Earth Engine (no se envía ningún dato personal a GEE)
- **Comunicaciones del servicio**: verificación del correo electrónico, restablecimiento de contraseña, notificaciones del servicio
- **Seguridad y prevención de abusos**: limitación de solicitudes, detección de abusos basada en la IP
- **Mejora del servicio**: estadísticas de uso agregadas y no identificativas

**No** utilizamos sus datos para:
- Elaborar perfiles ni tomar decisiones automatizadas
- Publicidad o marketing dirigidos a terceros
- Venderlos o cederlos a terceros

## 4. Conservación de los datos

| Categoría de datos | Periodo de conservación |
|---|---|
| **Datos de la cuenta** (nombre, correo electrónico, hash de la contraseña) | Hasta que elimine su cuenta |
| **Direcciones IP** en los registros de trabajos de análisis | Anonimizadas automáticamente tras el periodo de conservación configurado (por defecto: 90 días) |
| **Metadatos de los trabajos de análisis** | Conservados para el funcionamiento del servicio; las direcciones IP que contienen se anonimizan según el calendario anterior |
| **Claves de API** | Hasta su revocación o la eliminación de la cuenta (eliminación lógica para el registro de auditoría) |
| **Tokens de verificación de correo / restablecimiento de contraseña** | Válidos durante 1 hora; revocados tras su uso |
| **Suscripciones a notificaciones** | Hasta que cancele la suscripción o elimine su cuenta |
| **Registros de la aplicación** | Sujetos a la política de rotación de registros de la infraestructura |

## 5. Servicios de terceros y transferencias de datos

WHISP interactúa con los siguientes servicios de terceros durante su funcionamiento:

| Servicio | Datos compartidos | Finalidad |
|---|---|---|
| **Google Earth Engine** | Únicamente geometrías y parámetros técnicos de análisis. **No se transmite ningún dato personal** (nombres, correos electrónicos, IP, identificadores de usuario). | Motor de cálculo geoespacial |
| **Asset Registry** | GeoIDs (cuando se envían GeoIDs) | Resolución de identificadores geográficos a geometrías |
| **SMTP de Google Gmail** | Dirección de correo del destinatario, contenido del mensaje | Envío de correos de verificación y restablecimiento de contraseña |
| **API de Google Maps** | Interacciones del mapa en el cliente (sujetas a la política de privacidad de Google) | Visualización de mapas en la interfaz |

Para la evidencia técnica de la separación de datos entre WHISP y Google Earth Engine, véase el [Anexo sobre la separación de datos de GEE](./gee-data-separation).

## 6. Cookies y almacenamiento local

WHISP utiliza las siguientes cookies:

| Cookie | Tipo | Finalidad | Duración |
|---|---|---|---|
| `access_token` | Estrictamente necesaria | Token de autenticación JWT | 30 minutos |
| `refresh_token` | Estrictamente necesaria | Renovación del token JWT | 7 días |

Estas cookies son:
- **HttpOnly**: no accesibles desde JavaScript en el cliente
- **Secure**: se transmiten únicamente por HTTPS (en producción)
- **SameSite=Strict**: no se envían con solicitudes entre sitios

WHISP no utiliza cookies de analítica, seguimiento ni publicidad.

## 7. Sus datos, bajo su control

Creemos que usted debe tener un control real sobre sus datos personales. Esto es lo que ofrece WHISP:

### 7.1 Acceder a sus datos

Puede consultar sus datos personales en cualquier momento en la página **Configuración** de su cuenta de WHISP.

### 7.2 Corregir sus datos

Puede actualizar su nombre, apellidos y organización en la página **Configuración**. Para cambiar su dirección de correo electrónico, póngase en contacto con nosotros.

### 7.3 Eliminar su cuenta

Puede eliminar de forma permanente su cuenta y todos los datos asociados desde la página **Configuración**. La eliminación de la cuenta:
- Requiere confirmar la contraseña
- Elimina permanentemente su perfil de usuario, claves de API, tokens de verificación y tokens de restablecimiento de contraseña
- Anonimiza los registros de trabajos de análisis asociados

### 7.4 Limitar el tratamiento de datos

Puede reducir los datos que tratamos activamente revocando su clave de API, cancelando la suscripción a las notificaciones o eliminando su cuenta por completo.

### 7.5 Darse de baja de las notificaciones

Puede cancelar la suscripción a las notificaciones del servicio en cualquier momento desde la página **Configuración** o poniéndose en contacto con nosotros.

### 7.6 Plantear una inquietud

Si le preocupa cómo se tratan sus datos, le animamos a ponerse en contacto directamente con nosotros. Nos tomamos en serio todas las inquietudes relacionadas con la protección de datos y responderemos con prontitud.

## 8. Seguridad de los datos

Aplicamos las siguientes medidas técnicas para proteger sus datos:

- **Hash de contraseñas** con bcrypt (hash unidireccional con sal)
- **Tokens JWT** almacenados en cookies seguras HttpOnly con SameSite=Strict
- **Restricciones CORS** limitadas a los orígenes permitidos configurados
- **Limitación de solicitudes** en el registro y en los puntos de conexión de la API
- **Política de contraseñas robustas** (mínimo 8 caracteres con mayúscula, minúscula, número y carácter especial)
- **Anonimización automática de datos personales** de las direcciones IP tras el periodo de conservación configurado
- **Separación por diseño** entre los datos de la cuenta de usuario y el procesamiento del análisis geoespacial

## 9. Cambios en esta política

Podemos actualizar esta política de privacidad ocasionalmente. Los cambios se reflejarán en la fecha de «Última actualización» que figura al principio de este documento. Los cambios sustanciales se comunicarán a través del servicio.

## 10. Contacto

Si tiene preguntas sobre esta política de privacidad o sobre sus datos personales, escriba a:

[Open-Foris@fao.org](mailto:Open-Foris@fao.org)
