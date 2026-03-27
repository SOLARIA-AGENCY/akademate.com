#!/bin/bash
# Update Brevo email templates via API
# Run from server (46.62.222.138) after IP authorization propagates
# Usage: ./update-brevo-templates.sh

BREVO_API="${BREVO_API_KEY:?Set BREVO_API_KEY env var or pass as argument}"

echo "=== Updating Brevo Template #9 (Newsletter Bienvenida) ==="
curl -4 -s -X PUT "https://api.brevo.com/v3/smtp/templates/9" \
  -H "api-key: $BREVO_API" \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "CEP - Bienvenida Newsletter",
    "subject": "Bienvenido a CEP Formacion - Tu futuro profesional comienza aqui",
    "sender": {"name": "CEP Formacion", "email": "info@cepcomunicacion.com"},
    "replyTo": "info@cepcomunicacion.com",
    "isActive": true
  }'

echo ""
echo "=== Updating Template #6 (inactive) ==="
curl -4 -s -X PUT "https://api.brevo.com/v3/smtp/templates/6" \
  -H "api-key: $BREVO_API" \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "CEP - Bienvenida Newsletter (legacy)",
    "isActive": false
  }'

echo ""
echo "=== Done ==="
echo "Note: If IP still unauthorized, wait 1h after authorizing 46.62.222.138 in Brevo Security settings"
