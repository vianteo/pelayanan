#!/usr/bin/env bash
set -euo pipefail

EXPECTED_REPOSITORY='vianteo/pelayanan'
EXPECTED_BRANCH='main'
PROJECT_ID="${1:-jadwal-pelayanan-pniel}"
DISPLAY_NAME='Jadwal Pelayanan GPdI PNiel Deltamas'

[[ "${CODESPACES:-}" == 'true' ]] || { echo 'Jalankan hanya dari GitHub Codespaces.'; exit 1; }
[[ "$PROJECT_ID" =~ ^[a-z][a-z0-9-]{4,28}[a-z0-9]$ ]] || { echo 'Firebase Project ID tidak valid.'; exit 1; }
for command_name in node npm git gh; do command -v "$command_name" >/dev/null || { echo "$command_name belum tersedia. Rebuild container lalu coba kembali."; exit 1; }; done

repo_root="$(git rev-parse --show-toplevel)"
[[ "$(git branch --show-current)" == "$EXPECTED_BRANCH" ]] || { echo "Branch harus $EXPECTED_BRANCH"; exit 1; }
[[ "$(env -u GH_TOKEN -u GITHUB_TOKEN gh repo view --json nameWithOwner --jq .nameWithOwner)" == "$EXPECTED_REPOSITORY" ]] || { echo 'Repository GitHub tidak sesuai.'; exit 1; }
[[ -z "$(git status --porcelain)" ]] || { echo 'Working tree harus bersih sebelum deployment.'; exit 1; }

cd "$repo_root"
npm ci --no-audit --no-fund
firebase_binary="$repo_root/node_modules/.bin/firebase"
[[ -x "$firebase_binary" ]] || { echo 'Binary Firebase project-local tidak ditemukan.'; exit 1; }
tmp_dir="$(mktemp -d)"; trap 'rm -rf "$tmp_dir"' EXIT
[[ "$(cd "$tmp_dir" && "$firebase_binary" --version)" == '15.27.0' ]] || { echo 'Versi Firebase CLI harus tepat 15.27.0.'; exit 1; }

if ! "$firebase_binary" login:list --json 2>/dev/null | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);process.exit((j.result||j.users||[]).length?0:1)}catch{process.exit(1)}})"; then
  "$firebase_binary" login --no-localhost
fi

if ! "$firebase_binary" projects:list --json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);const id=process.argv[1];const rows=j.result||[];process.exit(rows.some(x=>x.projectId===id)?0:1)})" "$PROJECT_ID"; then
  "$firebase_binary" projects:create "$PROJECT_ID" --display-name "$DISPLAY_NAME"
fi

grep -q 'script.google.com/macros/s/.*/exec' public/config.js || { echo 'URL Apps Script production belum dikonfigurasi.'; exit 1; }
"$firebase_binary" deploy --only hosting --project "$PROJECT_ID"
echo "PWA tersedia di https://$PROJECT_ID.web.app"
