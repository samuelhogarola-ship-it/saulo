# AUDIT

## Estado actual

- `saulofitness.com` actúa como landing pública de marca.
- `/app/` es la demo pública del alumno, orientada a enseñar el producto.
- El formulario de presupuesto ya no forma parte de la experiencia pública principal.

## Dirección del producto

- Prioridad visual: blanco dominante, morado de marca y negro para contraste premium.
- Prioridad funcional inmediata: conservar una demo sólida para enseñar al cliente sin seguir diseñando la arquitectura alrededor de ella.
- Prioridad de producto real: construir la app alumno como PWA con activación por enlace, PIN de acceso, sesión de dispositivo y persistencia real.
- El panel de entrenador queda fuera de esta fase.

## Decisiones cerradas

- La landing debe ser mínima y orientada a producto.
- La demo del alumno debe sentirse como un producto real, no como un dashboard genérico.
- La navegación pública debe permanecer limpia y sin duplicados.

## Riesgos / Alertas

- Evitar reintroducir el formulario de presupuesto en la ruta pública.
- Evitar sumar pantallas nuevas si el mismo bloque puede resolverse con navegación contextual.
- Cualquier cambio de branding debe mantenerse coherente entre landing, demo e iconos.

## Próximo foco

- Persistencia real de `token + PIN + activación`.
- Separar cada vez más la demo pública del producto real.
