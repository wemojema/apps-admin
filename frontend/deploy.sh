#!/usr/bin/env bash
set -euo pipefail

source ~/.aws/bash-utils.sh

if [ -z "${1:-}" ]; then
  echo "Usage: ./deploy.sh <AccountAlias>   (e.g. WemojemaAuth)"
  exit 1
fi

STACK_NAME="apps-admin-web"
BACKEND_STACK="apps-admin-api"

assume "${1}"

get_output() {
  aws cloudformation describe-stacks --stack-name "$1" \
    --query "Stacks[0].Outputs[?OutputKey=='$2'].OutputValue" --output text
}

API_URL=$(get_output "$BACKEND_STACK" ApiUrl)
API_HOST=${API_URL#https://}

echo "==> Deploying static infra: ${STACK_NAME} (api origin: ${API_HOST})..."
aws cloudformation deploy \
    --stack-name "$STACK_NAME" \
    --template-file cloud-formation.yml \
    --parameter-overrides ServiceName=apps-admin-web "ApiOriginDomain=${API_HOST}" \
    --no-fail-on-empty-changeset

BUCKET=$(get_output "$STACK_NAME" BucketName)
DIST=$(get_output "$STACK_NAME" DistributionId)
CF_DOMAIN=$(get_output "$STACK_NAME" CloudFrontDomain)

echo "==> Building frontend (same-origin API under /api)..."
cat > .env.production <<EOF
VITE_API_URL=
VITE_AUTH_URL=https://admin.auth.wemojema.com
VITE_CLIENT_ID=admin-web
EOF

npm ci
npm run build

echo "==> Syncing dist/ to s3://${BUCKET}..."
aws s3 sync dist/ "s3://${BUCKET}/" --delete

echo "==> Invalidating CloudFront..."
aws cloudfront create-invalidation --distribution-id "$DIST" --paths "/*" --no-cli-pager >/dev/null

echo "==> Done. Frontend: https://${CF_DOMAIN}  (API same-origin at /api)"
