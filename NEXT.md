# NEXT

CURRENT FOCUS

- PROTECCIÓN ACTIVA: `Saulo Fitness APP` queda congelada hasta nueva orden. No tocar landing, `/app/`, `/trainer/`, PWA, iconos, manifest, service worker ni tests relacionados salvo instrucción explícita.
- Mantener `https://saulofitness.com` como landing pura, limpia y sin rastro operativo de la demo.
- Mantener la demo actual estable para revisión del cliente, sin convertirla en el centro de la arquitectura.
- Priorizar la app real como PWA funcional: instalación, service worker, cache offline básico y experiencia estable en móvil.
- El acceso por enlace único + PIN queda aparcado temporalmente; mantener la base técnica sin activarlo en la experiencia actual.
- Siguiente bloque técnico: robustecer la PWA real antes de reactivar `token + PIN + activación`.
- Retomar desde la auditoría técnica sin cambios: revisar acceso demo/admin, `SESSION_SECRET`, separación de rutas, modularización de `app/app.js`, `trainer/app.js`, `app/demo-store.js` y estrategia PWA/cache.
- No continuar puliendo UX hasta cerrar primero la base técnica de PWA real y seguridad mínima de producción.
- Trabajar siempre desde rama con PR antes de mergear a `main`.
- Mantener `preview-evento-generico.html` como plantilla base para futuras landing de eventos; la landing GIRLS queda fuera de producción.
- Cuando se retome eventos, integrar la landing real sin contaminar `/`, `/app/` ni la demo existente.

WORK PRESERVED FOR LATER

- PR activa: `codex/premium-ux-followup`, con checks verdes y demo/eventos aparcados como base de revisión.
- Trabajo no integrado queda preservado en stashes con mensajes `wip-generic-preview-after-ci-green`, `wip-generic-preview-after-pr3-merge`, `wip-generic-event-preview-before-merge-main`, `wip-next-event-focus-before-pr3-ci-fix` y `wip-event-preview-before-pr3-ci-fix`.
- Al retomar, revisar esas stashes por mensaje antes de aplicar nada; no asumir que todo debe ir a producción real.
