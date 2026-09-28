# GeometrIA · CBG – Laboratório de IA e Geometria

Site do **GeometrIA**, o laboratório de inteligência artificial e geometria do
[Centro Brasileiro de Geometria (CBG)](https://www.cbg.ime.unicamp.br/), no IMECC–Unicamp.
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
| `tools/form-backend.gs` | Back-end do formulário (Google Apps Script): planilha, PDFs, avisos e triagem com Claude. |
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

## Formulário "Colabore" → Planilha Google + triagem com Claude

O formulário do site é próprio. Com o back-end (`tools/form-backend.gs`) instalado, cada proposta:

1. vira uma linha da aba **Propostas** de uma Planilha Google da equipe; o PDF vai para uma pasta
   privada do Drive, e um e-mail de aviso (com o PDF anexado) chega a `geometria.lab@cbg.unicamp.br`;
2. passa pela triagem com Claude (opcional): proposta padronizada + notas de 1 a 5 em impacto,
   viabilidade, tempo, custo computacional, dados e encaixe → nota de 0 a 100 e aba **Ranking**;
3. é lida pela equipe na ordem do ranking. A proposta padronizada vai para o proponente pelo menu
   **GeometrIA** da planilha, depois de revisada (dá para editar a célula antes de enviar).

Enquanto `endpoint` estiver vazio em `_data/form.yml`, o envio abre um e-mail pré-preenchido para
`contact_email` — e a pessoa precisa anexar o PDF à mão.

### Instalação (~10 min)

1. Com a conta Google que vai guardar as respostas (de preferência a do laboratório), crie uma
   Planilha Google — por exemplo, "GeometrIA — propostas".
2. Na planilha: **Extensões → Apps Script**. Apague o conteúdo de `Código.gs`, cole o arquivo
   `tools/form-backend.gs` inteiro e salve.
3. Escolha a função **`setup`** e clique em **Executar**. Autorize o acesso (Planilhas, Drive, envio de
   e-mail, serviços externos). Em contas pessoais aparece "O Google não verificou este app":
   **Avançado → Acessar** — o app é o seu próprio script.
4. **Implantar → Nova implantação → Tipo: App da Web.** *Executar como:* **Eu**.
   *Quem pode acessar:* **Qualquer pessoa**. Copie o URL que termina em `/exec`.
5. Cole o URL em `endpoint`, no `_data/form.yml`. Commit + push.
6. Teste: abra o URL `/exec` no navegador (deve aparecer `{"ok":true,…}`) e envie uma proposta pelo site.

Contas institucionais (Google Workspace) às vezes não permitem o acesso "Qualquer pessoa". Nesse caso,
peça a liberação ao administrador ou instale o script numa conta Google do laboratório fora do domínio.

### Triagem com Claude (opcional)

1. Crie uma chave de API em <https://console.anthropic.com> — de preferência num workspace com limite de gastos.
2. No Apps Script: **Configurações do projeto (engrenagem) → Propriedades do script → Adicionar propriedade**:
   `ANTHROPIC_API_KEY` = a chave. (Quem pode editar o script consegue ver a chave.)
3. Recarregue a planilha e use **GeometrIA → Ativar triagem automática** (ou execute `enableTriage`).

A triagem usa a API de lotes da Anthropic: a cada 10 minutos, uma rodada envia as propostas novas e
recolhe os resultados prontos — em geral eles aparecem em 10 a 30 minutos, pela metade do preço de uma
chamada comum. O modelo padrão é `claude-opus-5-5`; para gastar menos, defina a propriedade
`CLAUDE_MODEL` = `claude-sonnet-5`.

- Vai para o modelo só o conteúdo da proposta e o PDF. Nome, e-mail, instituição, etapa da carreira
  e vínculo com o CBG ficam apenas na planilha.
- As notas e a justificativa são internas; ao proponente vai só a proposta padronizada.
- Pesos da nota (impacto 30%, viabilidade 25%, tempo 15%; custo computacional, dados e encaixe 10% cada)
  e as instruções do modelo ficam no início do script (`WEIGHTS`, `SYSTEM_PROMPT`).

### No dia a dia

- **Status:** `recebido` → `triando` → `triado` são automáticos; a equipe muda para `em leitura`,
  `aceita`, `recusada` ou `respondida`. Só `triado` e `em leitura` entram no ranking. Propostas sem
  problema descrito ("Começar a usar IA") ficam como `sem problema`, fora da triagem.
- **Enviar a padronizada:** selecione a linha na aba **Propostas** → **GeometrIA → Enviar proposta
  padronizada ao proponente**. Para enviar automaticamente logo após a triagem, defina a propriedade
  `AUTO_SEND_STANDARDIZED` = `true`.
- **Pedido de exclusão (LGPD):** selecione a linha → **GeometrIA → Excluir proposta e PDF**, e apague
  também o e-mail de aviso na caixa do laboratório.
- Não renomeie os cabeçalhos da aba **Propostas** — o script encontra as colunas pelo nome. Reordenar
  colunas ou ordenar as linhas não tem problema.
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
