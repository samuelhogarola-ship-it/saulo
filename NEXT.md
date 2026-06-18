# NEXT

CURRENT FOCUS

- PROTECCIÓN ACTIVA: `Saulo Fitness APP` queda congelada hasta nueva orden. No tocar landing, `/app/`, `/trainer/`, PWA, iconos, manifest, service worker ni tests relacionados salvo instrucción explícita.
- Mantener `https://saulofitness.com` como landing pura, limpia y sin rastro operativo de la demo.
- Mantener la demo actual estable para revisión del cliente, sin convertirla en el centro de la arquitectura.
- Priorizar la app real como PWA funcional: instalación, service worker, cache offline básico y experiencia estable en móvil.
- El acceso por enlace único + PIN queda aparcado temporalmente; mantener la base técnica sin activarlo en la experiencia actual.
- Siguiente bloque técnico: robustecer la PWA real antes de reactivar `token + PIN + activación`.
- Trabajar siempre desde rama con PR antes de mergear a `main`.
- Partir de `preview-evento-girl-power.html` como referencia visual aprobada para la futura landing publica de eventos.
- Cuando se retome eventos, integrar la landing real sin contaminar `/`, `/app/` ni la demo existente.
