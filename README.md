# GeometrIA · CBG – Laboratório de IA e Geometria

Site do **GeometrIA**, o laboratório de inteligência artificial e geometria do
[Centro Brasileiro de Geometria (CBG)](https://www.cbg.ime.unicamp.br/), no IMECC/UNICAMP.
Bilíngue (português por padrão, inglês em `/en/`), estático, feito para o GitHub Pages
com Jekyll puro — sem plugins nem etapa de build própria.

**Endereço:** https://tomassilva.github.io/GeometrIA-Lab/

---

## Publicar no GitHub Pages

1. Faça commit e push deste repositório para `main`.
2. No GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   branch `main`, pasta `/ (root)`.
3. Em um ou dois minutos o site estará no endereço acima.

Domínio próprio (ex.: `geometria.ime.unicamp.br`): configure o DNS, preencha o campo em
**Settings → Pages → Custom domain**, e em `_config.yml` troque `url` e deixe `baseurl: ""`.

### Pré-visualizar localmente

Requer Ruby 3.x com Bundler. Se `bundle -v` já funciona no seu terminal (por exemplo, porque
você mantém outro site Jekyll), pule o primeiro bloco. No macOS, não use o Ruby do sistema.

```bash
# uma vez só (macOS, com Homebrew) — Ruby 3.3, a versão testada
brew install ruby@3.3
echo "export PATH=\"$(brew --prefix ruby@3.3)/bin:\$PATH\"" >> ~/.zshrc && source ~/.zshrc

# na pasta do repositório
bundle config set --local path vendor/bundle   # gems ficam dentro do projeto, sem sudo
bundle install                                 # ~1 min na primeira vez
bundle exec jekyll serve --livereload
```

Abra **http://127.0.0.1:4000/GeometrIA-Lab/** (o caminho `/GeometrIA-Lab/` é obrigatório;
a versão em inglês fica em `/GeometrIA-Lab/en/`). Edições em `_data/`, páginas, CSS e JS
recarregam sozinhas; mudanças em `_config.yml` exigem parar (Ctrl+C) e rodar de novo.
Porta ocupada? Use `--port 4001`.

---

## Onde fica cada coisa

Quase todo o conteúdo está em `_data/`, com português e inglês lado a lado
(`{ pt: "...", en: "..." }`). Para mudar um texto, edite o YAML — não é preciso mexer no HTML.

| Arquivo | O que contém |
|---|---|
| `_data/publications.yml` | Artigos, preprints e palestras. `featured: true` põe o item na página inicial (use 3). |
| `_data/people.yml` | Membros (ordem de exibição), bio, links e foto (`assets/img/people/`). |
| `_data/news.yml` | Novidades da página inicial. |
| `_data/modes.yml` | Os quatro modos (Aproximar, Prever, Buscar, Auxiliar) + Geometria para IA. |
| `_data/pipeline.yml` | As cinco etapas do ciclo. |
| `_data/principles.yml` | Princípios da página Abordagem. |
| `_data/text/*.yml` | Os demais textos de cada página (início, abordagem, pesquisa, pessoas, colabore, marca). |
| `_data/form.yml` | Endereço (`endpoint`) do back-end do formulário e tamanho máximo do PDF (veja abaixo). |
| `_data/triage.yml` | As quatro etapas de uma proposta e o aviso de que a decisão é do laboratório. |
| `_data/text/example.yml` | O modelo de proposta preenchida (`/colabore/exemplo/`). |
| `tools/form-backend.gs` | Back-end do formulário (Google Apps Script): envia cada proposta, com o PDF, para o e-mail do laboratório. |
| `tools/triagem-manual.md` | Roteiro da triagem à mão no Claude: instruções, critérios da nota e mensagens ao proponente. |
| `_config.yml` | Endereço, e-mail de contato, links institucionais. |
| `assets/img/brand/` | Logotipos, favicons e o kit da marca (`geometria-brand-kit.zip`). |

### Adicionar uma publicação

Copie um bloco em `_data/publications.yml` e ajuste. Os campos `modes` aceitam
`approximate`, `predict`, `search`, `assist` e `geometry-for-ai` — são os filtros da página Pesquisa.
Os nomes dos membros (campo `short` em `people.yml`) aparecem em negrito automaticamente.

### Adicionar uma pessoa

Copie um bloco em `_data/people.yml`. Sem `photo`, o site desenha um monograma com as iniciais.
Com foto, coloque o arquivo em `assets/img/people/` e use `photo: /assets/img/people/nome.jpg`.

---

## Formulário "Colabore" → e-mail do laboratório

O formulário do site é próprio. Com o back-end (`tools/form-backend.gs`, um Google Apps Script)
instalado, cada proposta vira um e-mail para `geometria.lab@cbg.unicamp.br`:

- **Assunto:** `[GeometrIA][CBG] GIA-2026-0007 — título`. O `[CBG]` marca as propostas de membros do
  CBG, que têm prioridade na padronização (como diz o site).
- **Corpo:** um resumo (ID, data, pedidos como o convite para o Zulip, situação do PDF); o bloco
  **PROPONENTE**, com os dados pessoais; e o bloco **PROPOSTA**, só com o projeto — pronto para colar
  no Claude.
- **Anexo:** o PDF, já conferido (tem de ser um PDF de verdade, com até 10 MB).
- **Responder** ao e-mail responde direto ao proponente.

Nada fica guardado fora do e-mail: não há planilha nem pasta de arquivos. A triagem (proposta
padronizada + nota) é feita à mão, no Claude — o roteiro, as instruções e as mensagens-modelo estão em
[`tools/triagem-manual.md`](tools/triagem-manual.md).

Se o e-mail não puder ser enviado, o site mostra um erro com o endereço do laboratório. Enquanto
`endpoint` estiver vazio em `_data/form.yml`, o envio abre um e-mail pré-preenchido para
`contact_email` — e a pessoa precisa anexar o PDF à mão.

### Instalação (~5 min)

1. Com a conta Google que vai enviar os e-mails (de preferência a do laboratório), abra
   <https://script.google.com> → **Novo projeto** e dê um nome, por exemplo "GeometrIA — formulário".
2. Apague o conteúdo de `Código.gs`, cole o arquivo `tools/form-backend.gs` inteiro e salve.
3. Escolha a função **`setup`** e clique em **Executar**. Autorize o envio de e-mail — é a única
   permissão. Em contas pessoais aparece "O Google não verificou este app": **Avançado → Acessar** —
   o app é o seu próprio script.
4. **Implantar → Nova implantação → Tipo: App da Web.** *Executar como:* **Eu**.
   *Quem pode acessar:* **Qualquer pessoa**. Copie o URL que termina em `/exec`.
5. Cole o URL em `endpoint`, no `_data/form.yml`. Commit + push.
6. Teste: abra o URL `/exec` no navegador (deve aparecer `{"ok":true,…}`) e envie uma proposta pelo
   site. Para testar só o e-mail, execute `testSubmission` no editor.

Para mandar as propostas a outro endereço: **Configurações do projeto (engrenagem) → Propriedades do
script → `LAB_EMAIL`**.

Contas institucionais (Google Workspace) às vezes não permitem o acesso "Qualquer pessoa". Nesse caso,
peça a liberação ao administrador ou instale o script numa conta Google fora do domínio — as propostas
continuam indo para `LAB_EMAIL`.

### No dia a dia

- Cada proposta tem um ID (`GIA-2026-0007`), que o proponente também vê na tela ao enviar.
- Limites: 5 envios por hora por e-mail e 60 no total; o reenvio da mesma proposta é ignorado.
- PDF: até 10 MB. Para mudar, altere juntos `MAX_PDF_MB` no script e `max_pdf_mb` no `_data/form.yml`.
- **Pedido de exclusão (LGPD):** apague o e-mail da proposta (também da lixeira) e as conversas do
  Claude em que ela foi usada.
- Ao atualizar o script: **Implantar → Gerenciar implantações → editar → Versão: Nova versão**.
  Assim o URL `/exec` continua o mesmo.

---

## Identidade visual

- **Nome:** *Geometria* já termina em *IA* — o nome só acende as duas últimas letras.
- **Símbolo:** um plano de Fano desenhado como ∇ — 7 pontos, 7 retas; octônions e G₂;
  a conexão ∇ da geometria e o gradiente ∇ do aprendizado; uma pequena rede neural.
- **Cores:** tinta `#0E2A47` (estrutura) e sinal `#79BC9C → #A7CC6E → #D2DE24` (aprendizado) — a paleta
  do logotipo do CBG.
- **Co-marca:** o GeometrIA aparece sempre junto do CBG — no cabeçalho, na página inicial e no rodapé do
  site, e nas assinaturas `cobrand-horizontal-*` do kit.
- **Fontes:** Red Hat Display e Inter (as mesmas do CBG) + JetBrains Mono. Auto-hospedadas, SIL OFL.

Tudo documentado na página [/marca/](https://tomassilva.github.io/GeometrIA-Lab/marca/).

A animação da página inicial (`assets/js/flow.js`) é uma descida de gradiente real da energia
de Willmore restrita aos toros de revolução, W(c) = π²c²/√(c²−1), que converge para o
toro de Clifford (c = √2, W = 2π²). Ela respeita `prefers-reduced-motion`.
