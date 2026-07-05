# Saulo Fitness APP · Supabase Magic Link Delivery Handoff

## Summary

- Webhook URL: `https://your-project.supabase.co/functions/v1/magic-link-delivery`
- Sender name: `Coach Saulo`
- Signature header: `x-saulo-signature`
- Bearer auth: disabled
- HMAC signature: disabled

## Delivery purpose

A Supabase Edge Function will receive a JSON POST whenever a trainer marks payment as received and the app prepares a unique waiting-room link for the student.

## HTTP request

- Method: `POST`
- Path: `/webhook/magic-link`

## Headers

```json
{
  "Content-Type": "application/json"
}
```

## Payload example

```json
{
  "event": "student_magic_link_ready",
  "sentAt": "2026-07-05T13:55:34.588Z",
  "senderName": "Coach Saulo",
  "appName": "Saulo Fitness APP",
  "student": {
    "id": "student-sample-001",
    "name": "Lucía Ortega",
    "plan": "Definición",
    "contactEmail": "lucia@saulofitness.app",
    "contactPhone": "+34600000001"
  },
  "access": {
    "waitingRoomUrl": "https://saulofitness.com/acceso/waiting-room-sample-123",
    "waitingRoomPath": "/acceso/waiting-room-sample-123",
    "accessUrl": "https://saulofitness.com/app/?access=student-access-sample-123",
    "accessPath": "/app/?access=student-access-sample-123"
  },
  "message": "Hola Lucía Ortega, tu acceso a Saulo Fitness APP ya está listo. Abre este enlace único y de un solo uso para entrar en tu sala de espera y activar la app en tu móvil: https://saulofitness.com/acceso/waiting-room-sample-123 Cuando la abras, tu sesión quedará activa y podrás añadirla a la pantalla de inicio como PWA.",
  "mailtoUrl": "mailto:lucia%40saulofitness.app",
  "whatsappUrl": "https://wa.me/34600000001?text=Hola%20Luc%C3%ADa%20Ortega%2C%20tu%20acceso%20a%20Saulo%20Fitness%20APP%20ya%20est%C3%A1%20listo.%20Abre%20este%20enlace%20%C3%BAnico%20y%20de%20un%20solo%20uso%20para%20entrar%20en%20tu%20sala%20de%20espera%20y%20activar%20la%20app%20en%20tu%20m%C3%B3vil%3A%20https%3A%2F%2Fsaulofitness.com%2Facceso%2Fwaiting-room-sample-123%20Cuando%20la%20abras%2C%20tu%20sesi%C3%B3n%20quedar%C3%A1%20activa%20y%20podr%C3%A1s%20a%C3%B1adirla%20a%20la%20pantalla%20de%20inicio%20como%20PWA."
}
```

## Expected 2xx response

When the Supabase delivery endpoint accepts the delivery, it should return a `2xx` response and, if possible, include the confirmed channel and its own delivery identifier so the trainer panel can persist the real state.

```json
{
  "ok": true,
  "channel": "whatsapp",
  "deliveryId": "supabase-delivery-001"
}
```

## Manual cURL test

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/magic-link-delivery' -H 'Content-Type: application/json' --data-raw '{"event":"student_magic_link_ready","sentAt":"2026-07-05T13:55:34.588Z","senderName":"Coach Saulo","appName":"Saulo Fitness APP","student":{"id":"student-sample-001","name":"Lucía Ortega","plan":"Definición","contactEmail":"lucia@saulofitness.app","contactPhone":"+34600000001"},"access":{"waitingRoomUrl":"https://saulofitness.com/acceso/waiting-room-sample-123","waitingRoomPath":"/acceso/waiting-room-sample-123","accessUrl":"https://saulofitness.com/app/?access=student-access-sample-123","accessPath":"/app/?access=student-access-sample-123"},"message":"Hola Lucía Ortega, tu acceso a Saulo Fitness APP ya está listo. Abre este enlace único y de un solo uso para entrar en tu sala de espera y activar la app en tu móvil: https://saulofitness.com/acceso/waiting-room-sample-123 Cuando la abras, tu sesión quedará activa y podrás añadirla a la pantalla de inicio como PWA.","mailtoUrl":"mailto:lucia%40saulofitness.app","whatsappUrl":"https://wa.me/34600000001?text=Hola%20Luc%C3%ADa%20Ortega%2C%20tu%20acceso%20a%20Saulo%20Fitness%20APP%20ya%20est%C3%A1%20listo.%20Abre%20este%20enlace%20%C3%BAnico%20y%20de%20un%20solo%20uso%20para%20entrar%20en%20tu%20sala%20de%20espera%20y%20activar%20la%20app%20en%20tu%20m%C3%B3vil%3A%20https%3A%2F%2Fsaulofitness.com%2Facceso%2Fwaiting-room-sample-123%20Cuando%20la%20abras%2C%20tu%20sesi%C3%B3n%20quedar%C3%A1%20activa%20y%20podr%C3%A1s%20a%C3%B1adirla%20a%20la%20pantalla%20de%20inicio%20como%20PWA."}'
```

## Expected behavior

- Accept the POST request and return a `2xx` response when delivery is accepted.
- If possible, return `channel` with the real delivery channel used, for example `email` or `whatsapp`.
- If possible, return `deliveryId` with the Supabase-side or downstream delivery identifier for traceability.
- Use the `message`, `mailtoUrl`, `whatsappUrl`, and `access.waitingRoomUrl` fields to deliver the student access.
- Do not expose the final `/app/` access flow directly to the student outside the waiting-room link.
