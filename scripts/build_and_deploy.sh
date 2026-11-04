#!/usr/bin/env bash
# ==============================================================================
# Manual Build & Deploy Script for Study Guide Website
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${ROOT_DIR}"

echo "🚀 [1/4] Ensuring Git configuration for large payloads..."
git config http.postBuffer 524288000

echo "🔨 [2/4] Building static site with Zensical..."
if command -v zensical &> /dev/null; then
    zensical build --config-file zensical.yml
elif [ -f "${HOME}/.local/bin/zensical" ]; then
    "${HOME}/.local/bin/zensical" build --config-file zensical.yml
else
    echo "❌ Error: zensical executable not found in PATH or ~/.local/bin/zensical"
    exit 1
fi

# Ensure .nojekyll exists in site/ so GitHub Pages doesn't invoke Jekyll
touch site/.nojekyll

COMMIT_MSG="${1:-Update study site content and build artifacts}"

echo "📦 [3/4] Staging and committing changes..."
git add -A
if git diff-index --quiet HEAD --; then
    echo "  No changes to commit in source tree."
else
    git commit -m "${COMMIT_MSG}"
fi

echo "🌐 [4/4] Pushing changes to remote and deploying to gh-pages..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if git remote get-url origin &> /dev/null; then
    git push origin "${CURRENT_BRANCH}"
    echo "  Deploying 'site' folder to gh-pages branch..."
    git subtree push --prefix site origin gh-pages
    echo "✅ Successfully built and deployed to GitHub Pages!"
else
    echo "⚠️ Remote 'origin' is not configured yet. Site built locally in './site/'."
    echo "  Run 'gh repo create' or 'git remote add origin <url>' to enable remote push."
fi
