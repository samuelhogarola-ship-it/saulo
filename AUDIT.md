# AUDIT

## Estado actual

- `saulofitness.com` actúa como landing pública de marca.
- `/app/` es la PWA del alumno, orientada a uso real del primer producto.
- `/trainer/` existe ya como panel interno mínimo para gestionar alumnos, mensajes, pago recibido, sala de espera, accesos y una rutina semanal.
- El formulario de presupuesto ya no forma parte de la experiencia pública principal.

## Dirección del producto

- Prioridad visual: blanco dominante, morado de marca y negro para contraste premium.
- Prioridad funcional: rutina, mensajes, suscripción, perfil, persistencia, PWA instalable, flujo de pago confirmado con magic link único, sala de espera y operativa básica de entrenador.
- Contrato de acceso alumno ya definido: el entrenador confirma pago, el sistema envía un magic link único a la sala de espera y desde ahí el alumno activa e instala la PWA.
- El acceso del alumno no se entrega como URL pública fija a `/app/`; la instalación nace siempre desde el magic link único y la sala de espera.
- El panel de entrenador ya entra en fase MVP y dispone de login base con sesión persistida, pero todavía no tiene el ciclo completo de Supabase Auth cerrado en entorno real.
- La capa Supabase ya contempla bootstrap operativo de entrenador y ownership de alumnos por `trainer_id`, reduciendo el riesgo de mezclar datos entre entrenadores.
- La puesta en marcha de producto ya contempla también bootstrap del primer alumno con sus entidades mínimas, lo que reduce la dependencia del seed local para demos y primeras entregas reales.
- El siguiente salto operativo ya no pasa por “semillas internas”, sino por plantillas versionadas de alumno reutilizables dentro del repo.

## Decisiones cerradas

- La landing debe ser mínima y orientada a producto.
- La app del alumno debe sentirse como un producto real, no como un dashboard genérico.
- La navegación pública debe permanecer limpia y sin duplicados.

## Riesgos / Alertas

- Evitar reintroducir el formulario de presupuesto en la ruta pública.
- Evitar sumar pantallas nuevas si el mismo bloque puede resolverse con navegación contextual.
- Cualquier cambio de branding debe mantenerse coherente entre landing, app e iconos.

## Próximo foco

- Completar la transición de producto: Supabase real, autenticación real de entrenador, acceso de alumno revocable con sesión persistida en PWA, shell offline y automatización del envío del magic link desde pago confirmado.
