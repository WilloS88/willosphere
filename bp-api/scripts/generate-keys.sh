#!/bin/bash

set -e

echo "🔐 Generuji RSA klíčový pár (2048 bit)..."
echo ""

openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048 2>/dev/null

openssl rsa -pubout -in private.pem -out public.pem 2>/dev/null

echo "✅ Klíče vygenerované: private.pem, public.pem"
echo ""

PRIVATE_KEY=$(awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' private.pem)
PUBLIC_KEY=$(awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' public.pem)

echo "📋 Pro .env soubor (zkopíruj):"
echo ""
echo "JWT_PRIVATE_KEY_PEM=\"${PRIVATE_KEY}\""
echo ""
echo "JWT_PUBLIC_KEY_PEM=\"${PUBLIC_KEY}\""
echo ""

MFA_KEY=$(openssl rand -base64 32)
echo "MFA_SECRET_KEY_BASE64=\"${MFA_KEY}\""
echo ""

echo "🗑️  Nezapomeň smazat .pem soubory po zkopírování do .env!"
echo "   rm private.pem public.pem"
