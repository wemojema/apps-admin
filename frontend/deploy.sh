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

echo "==> Deploying static infra: ${STACK_NAME}..."
aws cloudformation deploy \
    --stack-name "$STACK_NAME" \
    --template-file cloud-formation.yml \
    --parameter-overrides ServiceName=apps-admin-web \
    --no-fail-on-empty-changeset

get_output() {
  aws cloudformation describe-stacks --stack-name "$1" \
    --query "Stacks[0].Outputs[?OutputKey=='$2'].OutputValue" --output text
}

BUCKET=$(get_output "$STACK_NAME" BucketName)
DIST=$(get_output "$STACK_NAME" DistributionId)
CF_DOMAIN=$(get_output "$STACK_NAME" CloudFrontDomain)
API_URL=$(get_output "$BACKEND_STACK" ApiUrl)

echo "==> Building frontend (API=${API_URL})..."
cat > .env.production <<EOF
VITE_API_URL=${API_URL}
VITE_AUTH_URL=https://admin.auth.wemojema.com
VITE_CLIENT_ID=admin-web
EOF

npm ci
npm run build

echo "==> Syncing dist/ to s3://${BUCKET}..."
aws s3 sync dist/ "s3://${BUCKET}/" --delete

echo "==> Invalidating CloudFront..."
aws cloudfront create-invalidation --distribution-id "$DIST" --paths "/*" --no-cli-pager >/dev/null

echo "==> Done. Frontend: https://${CF_DOMAIN}"
