#!/bin/bash

# File containing the secrets
SECRETS_FILE=".env.github"

# List of repositories to update secrets
REPOSITORIES=(
  "AryanK1511/fragments"
)

# Update secrets for each repository
for REPO in "${REPOSITORIES[@]}"; do
  echo "Updating secrets in repository: $REPO"

  # Read secrets from the file and update them
  while IFS= read -r LINE; do
    # Skip empty lines and comments
    [[ -z "$LINE" || "$LINE" =~ ^# ]] && continue

    SECRET_NAME=$(echo $LINE | cut -d'=' -f1)
    SECRET_VALUE=$(echo $LINE | cut -d'=' -f2-)

    echo "  Setting secret: $SECRET_NAME"
    gh secret set "$SECRET_NAME" -b"$SECRET_VALUE" --repo "$REPO"
  done < "$SECRETS_FILE"
done

echo "Secrets updated successfully."
