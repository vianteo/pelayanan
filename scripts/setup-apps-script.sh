#!/usr/bin/env bash
set -euo pipefail

EXPECTED_REPOSITORY='vianteo/pelayanan'
EXPECTED_BRANCH='chatgpt/jadwal-pelayanan-initial'
APP_TITLE='Jadwal Pelayanan - GPdI PNiel Deltamas'
CLASP_TYPE='standalone'

[[ "${CODESPACES:-}" == 'true' ]] || { echo 'Jalankan hanya dari GitHub Codespaces.'; exit 1; }
for command_name in gh node npm git; do command -v "$command_name" >/dev/null || { echo "$command_name belum tersedia. Rebuild container lalu coba kembali."; exit 1; }; done

repo_root="$(git rev-parse --show-toplevel)"
[[ "$(git branch --show-current)" == "$EXPECTED_BRANCH" ]] || { echo "Branch harus $EXPECTED_BRANCH"; exit 1; }
[[ "$(env -u GH_TOKEN -u GITHUB_TOKEN gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null || true)" == "$EXPECTED_REPOSITORY" ]] || {
  env -u GH_TOKEN -u GITHUB_TOKEN gh auth login --web --scopes repo,workflow
}
gh_user() { env -u GH_TOKEN -u GITHUB_TOKEN gh "$@"; }
[[ "$(gh_user repo view --json nameWithOwner --jq .nameWithOwner)" == "$EXPECTED_REPOSITORY" ]] || { echo 'Repository GitHub tidak sesuai.'; exit 1; }
if ! gh_user api --silent "repos/$EXPECTED_REPOSITORY/actions/secrets/public-key"; then
  gh_user auth refresh -h github.com -s repo,workflow
  gh_user api --silent "repos/$EXPECTED_REPOSITORY/actions/secrets/public-key" || { echo 'Akun GitHub tidak memiliki izin Actions secrets.'; exit 1; }
fi

if git status --porcelain | grep -E '(^|/)(\.clasp\.json|\.clasprc\.json|oauth.*\.json|client_secret.*\.json|credentials.*\.json)$' >/dev/null; then
  echo 'Hapus file kredensial dari working tree sebelum melanjutkan.'; exit 1
fi

private_dir="${XDG_STATE_HOME:-$HOME/.local/state}/jadwal-pelayanan-apps-script"
resume_file="$private_dir/.clasp.json"
mkdir -p "$private_dir"; chmod 700 "$private_dir"
tmp_dir="$(mktemp -d)"
cleanup(){ rm -rf "$tmp_dir"; }
trap cleanup EXIT

cd "$repo_root"
npm install --no-audit --no-fund
clasp_binary="$repo_root/node_modules/.bin/clasp"
[[ -x "$clasp_binary" ]] || { echo 'Binary clasp tidak ditemukan.'; exit 1; }
[[ "$(cd "$tmp_dir" && "$clasp_binary" --version)" == '3.3.0' ]] || { echo 'Versi clasp harus tepat 3.3.0.'; exit 1; }

if [[ ! -s "$HOME/.clasprc.json" ]]; then "$clasp_binary" login --no-localhost; fi
node -e "const fs=require('fs');const p=process.argv[1];const j=JSON.parse(fs.readFileSync(p));if(!j.tokens)process.exit(1)" "$HOME/.clasprc.json" || { echo 'Login Google belum valid.'; exit 1; }

if [[ -e "$resume_file" ]]; then
  node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(process.argv[1]));if(!j.scriptId||j.rootDir!=='src')process.exit(1)" "$resume_file" || { echo 'Resume state tidak valid; jangan membuat project baru. Rekonsiliasi melalui Apps Script UI.'; exit 1; }
else
  (cd "$tmp_dir" && "$clasp_binary" create-script --type "$CLASP_TYPE" --title "$APP_TITLE" --rootDir src >/dev/null)
  node -e "const fs=require('fs');const p=process.argv[1];const j=JSON.parse(fs.readFileSync(p));if(!j.scriptId||j.rootDir!=='src')process.exit(1)" "$tmp_dir/.clasp.json"
  install -m 600 "$tmp_dir/.clasp.json" "$resume_file"
fi

gh_user secret set CLASPRC_JSON < "$HOME/.clasprc.json"
gh_user secret set CLASP_JSON < "$resume_file"
secret_names="$(gh_user secret list --json name --jq '.[].name')"
grep -qx 'CLASPRC_JSON' <<<"$secret_names" && echo 'CLASPRC_JSON: configured'
grep -qx 'CLASP_JSON' <<<"$secret_names" && echo 'CLASP_JSON: configured'
rm -f "$resume_file"
rmdir "$private_dir" 2>/dev/null || true
echo 'Setup Apps Script selesai. Hanya nama secret yang telah ditampilkan.'
