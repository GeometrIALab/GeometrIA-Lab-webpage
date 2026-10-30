#!/bin/bash
# Gera o site na versão do CBG (_config.yml + _config_cbg.yml) na pasta indicada, já sem o que não é
# usado no WordPress do CBG. Usado pelo build-plugin.sh e pela publicação automática no GitHub
# (.github/workflows/publicar-cbg.yml).
#   tools/wordpress/build-site.sh PASTA
set -euo pipefail
OUT="${1:?uso: build-site.sh PASTA}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
JEKYLL="${JEKYLL:-bundle exec jekyll}"

rm -rf "$OUT"
mkdir -p "$(dirname "$OUT")"
OUT="$(cd "$(dirname "$OUT")" && pwd)/$(basename "$OUT")"
(cd "$ROOT" && $JEKYLL build --safe --quiet --config _config.yml,_config_cbg.yml -d "$OUT")

# Fica de fora o que não é usado no site do CBG, para o pacote ficar pequeno: a página de identidade
# visual (sem link no site) com o kit e as assinaturas para baixar, o anti-robô (o login substitui),
# o mapa do site e o robots.txt (os do WordPress valem para o domínio) e qualquer imagem que nenhuma
# página, CSS ou JS cite.
rm -rf "$OUT/marca" "$OUT/en/brand" "$OUT/assets/js/vendor/altcha" "$OUT/sitemap.xml" "$OUT/robots.txt"
find "$OUT/assets/img" -type f | while read -r img; do
  if ! grep -rqF --include='*.html' --include='*.css' --include='*.js' "$(basename "$img")" "$OUT"; then rm -f "$img"; fi
done
find "$OUT/assets/img" -type d -empty -delete

# Carimbo da versão: data e commit (aparece em Configurações → GeometrIA).
COMMIT="${GITHUB_SHA:-$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo sem-git)}"
COMMIT="${COMMIT:0:7}"
if [ -z "${GITHUB_SHA:-}" ] && [ -n "$(git -C "$ROOT" status --porcelain 2>/dev/null)" ]; then COMMIT="$COMMIT+alterações"; fi
echo "$(date '+%Y-%m-%d %H:%M') · $COMMIT" > "$OUT/.build"
