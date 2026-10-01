#!/bin/bash
# Gera tools/wordpress/dist/geometria-lab.zip, o plugin pronto para enviar ao WordPress do CBG
# (Plugins → Adicionar novo → Enviar plugin). Rode da raiz do repositório ou de qualquer lugar:
#   tools/wordpress/build-plugin.sh
# O site é gerado com _config.yml + _config_cbg.yml (endereço /GeometrIALab e modo WordPress).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DIST="$ROOT/tools/wordpress/dist"
PLUGIN="$DIST/geometria-lab"
JEKYLL="${JEKYLL:-bundle exec jekyll}"

rm -rf "$PLUGIN" "$DIST/geometria-lab.zip"
mkdir -p "$DIST"
cp -R "$ROOT/tools/wordpress/geometria-lab" "$PLUGIN"
(cd "$ROOT" && $JEKYLL build --safe --quiet --config _config.yml,_config_cbg.yml -d "$PLUGIN/site")

# Fica de fora o que não é usado no site do CBG, para o zip caber no limite de envio do WordPress:
# a página de identidade visual (sem link no site) com o kit e as assinaturas para baixar, o
# anti-robô (o login substitui), o mapa do site e o robots.txt (os do WordPress valem para o domínio)
# e qualquer imagem que nenhuma página, CSS ou JS cite.
SITE="$PLUGIN/site"
rm -rf "$SITE/marca" "$SITE/en/brand" "$SITE/assets/js/vendor/altcha" "$SITE/sitemap.xml" "$SITE/robots.txt"
find "$SITE/assets/img" -type f | while read -r img; do
  if ! grep -rqF --include='*.html' --include='*.css' --include='*.js' "$(basename "$img")" "$SITE"; then rm -f "$img"; fi
done
find "$SITE/assets/img" -type d -empty -delete

# As páginas passam pelo plugin (que exige login no formulário); na pasta do plugin, o servidor
# só entrega CSS, fontes e imagens.
cat > "$PLUGIN/site/.htaccess" << 'HT'
<FilesMatch "\.(html|xml|txt)$">
  <IfModule mod_authz_core.c>
    Require all denied
  </IfModule>
  <IfModule !mod_authz_core.c>
    Order allow,deny
    Deny from all
  </IfModule>
</FilesMatch>
HT
COMMIT="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo sem-git)"
if [ -n "$(git -C "$ROOT" status --porcelain 2>/dev/null)" ]; then COMMIT="$COMMIT+alterações"; fi
echo "$(date '+%Y-%m-%d %H:%M') · $COMMIT" > "$PLUGIN/site/.build"

(cd "$DIST" && zip -qrX geometria-lab.zip geometria-lab)
echo "Pronto: $DIST/geometria-lab.zip ($(du -h "$DIST/geometria-lab.zip" | cut -f1))"
