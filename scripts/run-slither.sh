#!/bin/bash
# scripts/run-slither.sh

DEPLOYED_DIR="deployed"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
OUTPUT_FILE="${DEPLOYED_DIR}/SLITHER_${TIMESTAMP}.json"

mkdir -p "$DEPLOYED_DIR"

echo "Running Slither analysis..."
slither . \
  --filter-paths "node_modules|test" \
  --exclude naming-convention,solc-version \
  --json "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
  echo "Slither report saved: $OUTPUT_FILE"
else
  echo "Slither analysis failed"
  exit 1
fi
