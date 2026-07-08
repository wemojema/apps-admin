#!/usr/bin/env bash
set -euo pipefail

source ~/.aws/bash-utils.sh

if [ -z "${1:-}" ]; then
  echo "Usage: ./deploy.sh <AccountAlias>"
  echo "  e.g. ./deploy.sh WemojemaAuth"
  exit 1
fi

PARAMETERS_FILE="${1}.json"
STACK_NAME="apps-admin-api"
REGION="us-east-1"
DEPLOY_PARAMS_TMP=$(mktemp)
trap 'rm -f "$DEPLOY_PARAMS_TMP"' EXIT

assume "${1}"

BUCKET_NAME=$(aws ssm get-parameter --name /infrastructure/S3BucketName | jq -r .Parameter.Value)
GIT_SHA=$(git rev-parse --short HEAD)
ARTIFACT_KEY="apps-admin-api/apps-admin-api-${GIT_SHA}.jar"

echo "==> Building shadow JAR..."
./gradlew shadowJar

ARTIFACT_SHA256=$(openssl dgst -sha256 -binary build/libs/apps-admin-api.jar | base64 -w0)

echo "==> Uploading to s3://${BUCKET_NAME}/${ARTIFACT_KEY}..."
aws s3 cp build/libs/apps-admin-api.jar "s3://${BUCKET_NAME}/${ARTIFACT_KEY}"

STACK_PARAMS=$(jq '.stackParameters' "$PARAMETERS_FILE")
echo "${STACK_PARAMS}
[{\"ParameterKey\":\"ArtifactKey\",\"ParameterValue\":\"${ARTIFACT_KEY}\"},
 {\"ParameterKey\":\"ArtifactSha256\",\"ParameterValue\":\"${ARTIFACT_SHA256}\"}]" \
  | jq -s 'add' > "$DEPLOY_PARAMS_TMP"

echo "==> Deploying CloudFormation stack: ${STACK_NAME}..."
aws cloudformation deploy \
    --stack-name "$STACK_NAME" \
    --template-file cloud-formation.yml \
    --parameter-overrides "file://${DEPLOY_PARAMS_TMP}" \
    --capabilities CAPABILITY_NAMED_IAM \
    --no-fail-on-empty-changeset

echo "==> Done. Stack outputs:"
aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs' \
    --output table
