# GeometrIA · CBG – Laboratório de IA e Geometria

Site do **GeometrIA**, o laboratório de inteligência artificial e geometria do
[Centro Brasileiro de Geometria (CBG)](https://www.cbg.ime.unicamp.br/), no IMECC/UNICAMP.
Bilíngue (português por padrão, inglês em `/en/`), estático, feito com Jekyll puro.

**No ar em https://www.cbg.ime.unicamp.br/GeometrIALab/**, dentro do site do CBG (WordPress), por
meio de um plugin feito para ele (`tools/wordpress/geometria-lab/`). O repositório é
[GeometrIALab/GeometrIA-Lab-webpage](https://github.com/GeometrIALab/GeometrIA-Lab-webpage), e cada
push na branch `main` vai sozinho para o ar (veja "Publicação automática", abaixo). O formulário de propostas só
abre para quem entrou com a conta do site do CBG e manda cada proposta, com o PDF, para o e-mail do
laboratório por um Google Apps Script (`tools/form-backend.gs`).

Cópias secundárias: https://tomassilva.github.io/GeometrIA-Lab/ (GitHub Pages, se ligado) e
https://www.ime.unicamp.br/~tomas/GeometrIA-Lab/ (testes no IMECC). Nelas o formulário não envia
propostas, porque o script só aceita quem entrou pelo site do CBG.

---

## Atualizar o site (dia a dia)

Toda mudança de conteúdo (texto, publicação, notícia, post, pessoa) segue o mesmo ciclo. A chave do
formulário fica salva no WordPress e não precisa ser mexida.

1. **Edite** os arquivos (veja "Onde fica cada coisa", abaixo). Dá para editar direto no site do
   GitHub, pelo lápis de cada arquivo, sem instalar nada.
2. **Confira** localmente (opcional): `bundle exec jekyll serve` e abra
   http://127.0.0.1:4000/GeometrIA-Lab/ (veja "Pré-visualizar localmente").
3. **Commit e push** na branch `main`. No site do GitHub, o botão "Commit changes" já faz isso.
4. **Pronto.** Em dois ou três minutos, o GitHub gera o site e o WordPress do CBG põe a versão nova no
   ar. O andamento aparece na aba **Actions** do repositório, e a versão no ar em
   **Configurações → GeometrIA**, no WordPress. Para conferir, recarregue
   https://www.cbg.ime.unicamp.br/GeometrIALab/ com Cmd+Shift+R (ou Ctrl+Shift+R).

O plugin só precisa ser enviado de novo ao WordPress quando o código dele muda
(`tools/wordpress/geometria-lab/*.php`). Nesse caso, gere o zip com `tools/wordpress/build-plugin.sh`
e envie em **Plugins → Adicionar novo → Enviar plugin → Substituir o atual pelo enviado**.

O script do Google só precisa de uma nova versão quando o `tools/form-backend.gs` muda (veja
"Formulário", abaixo).

---

## Publicar

### No site do CBG (WordPress), o endereço oficial

O site entra no WordPress do CBG como um **plugin**, instalado pelo painel, sem acesso ao servidor.
O plugin entrega as páginas em **/GeometrIALab/** e serve CSS, fontes e imagens direto da pasta do
site, `<uploads>/geometria-lab/site-…/` (a versão baixada do GitHub; antes da primeira publicação
automática, a cópia que vem no plugin, em `wp-content/plugins/geometria-lab/site/`). As páginas do formulário (`/GeometrIALab/colabore/` e
`/GeometrIALab/en/collaborate/`) só abrem para quem entrou com a conta do site em **/acesso/**; quem
não entrou vai para /acesso/ (com um aviso explicando o motivo) e, depois de entrar, volta ao
formulário. Nome e e-mail vêm da conta, e o e-mail não pode ser trocado no formulário. Não há código
por e-mail nem "Eu não sou um robô": o plugin assina um passe (válido por 12 h) com uma chave que só
ele e o script conhecem, e o script recusa propostas sem passe válido.

O cadastro em /acesso/ é aberto: qualquer pessoa com conta no site do CBG pode enviar propostas.

**Primeira instalação** (já feita; fica aqui para referência)

1. **Script.** Cole o `tools/form-backend.gs` atual no Apps Script (conta geoialab@unicamp.br) e
   salve. No menu ao lado de **▷ Executar**, escolha **`setup`** (o menu começa em `doGet`, que não
   faz nada) e execute. No registro de execução aparece a *chave para o plugin do WordPress* (64
   caracteres); ela também fica em ⚙️ Configurações do projeto → Propriedades do script, como
   `WP_KEY`, e `mostrarChaveWordPress` mostra de novo. Publique: **Implantar → Gerenciar
   implantações → editar → Versão: Nova versão → Implantar**.
2. **Plugin.** Gere o zip com `tools/wordpress/build-plugin.sh`. No painel: **Plugins → Adicionar
   novo → Enviar plugin → Escolher arquivo → Instalar agora → Ativar plugin**.
3. **Chave e endereço.** Em **Configurações → GeometrIA**, cole a chave do passo 1 e, em
   **Endereço do script**, o URL da implantação (termina em `/exec`), e salve. A chave é uma senha
   entre o WordPress e o script: não a coloque no site nem no repositório.
4. **Teste.** Numa janela anônima, abra https://www.cbg.ime.unicamp.br/GeometrIALab/, clique em
   "Proponha um problema", entre com uma conta e envie uma proposta de teste.

Observações:
- O zip tem menos de 1 MB, porque o servidor do CBG recusa arquivos grandes (`upload_max_filesize`).
  Para caber, a versão do CBG não leva a página de identidade visual (que não tem link no site) nem
  o kit da marca e as assinaturas para baixar; o script de build também tira o anti-robô, o mapa do
  site e as imagens que nenhuma página usa. O limite atual aparece em **Mídia → Adicionar novo**.
- O `build-plugin.sh` usa `bundle exec jekyll` (veja "Pré-visualizar localmente" para instalar).
- Não crie uma página do WordPress chamada "GeometrIALab": o plugin responde antes por esse endereço.
  `/geometrialab` (minúsculas) redireciona para `/GeometrIALab/`.
- `_config_cbg.yml` guarda o endereço (`url`, `baseurl: /GeometrIALab`) e liga o modo WordPress
  (`wp_gate: true`), que tira do formulário o código por e-mail e o anti-robô. No script, o
  interruptor correspondente é `WP_LOGIN_REQUIRED = true`.
- Para tirar o site do ar: **Plugins → GeometrIA → Desativar** (as cópias do WP Fastest Cache saem junto). "Excluir" também apaga a chave e as versões baixadas do GitHub.
- A volta ao formulário depois do login funciona com o login do Forminator usado em /acesso/ (o
  plugin troca o destino que o Forminator mandaria) e com o login padrão do WordPress. O formulário
  de login do CBG manda, por conta própria, para `https://cbg.webcontent.website/wp-admin/`, um
  endereço antigo da agência; vale corrigir isso em **Forminator → Formulários → (login) →
  Comportamento → Redirecionar**, para `https://www.cbg.ime.unicamp.br/acesso/` (corrigido no plugin 1.1.1).
- Quem chega ao formulário sem login vai para `/acesso/?geometrialab=1`, e só nesse caso aparece o
  aviso do laboratório. Endereço com parâmetro não entra no cache do WP Fastest Cache, então a cópia
  de /acesso/ que todos recebem nunca leva o aviso (até a 1.1.6 levava; a 1.1.7 apaga essa cópia).
- O site do CBG também responde em `cbg.ime.unicamp.br` (sem www), mas o login vale só em `www`. O plugin
  (1.1.2) manda quem chega sem www para `www.cbg.ime.unicamp.br/GeometrIALab/`; sem isso, a pessoa não voltava
  ao formulário depois do login. Use sempre o endereço com www nos links.

### Publicação automática

A cada push na `main` (ou pelo botão **Run workflow** na aba Actions), o workflow
`.github/workflows/publicar-cbg.yml`:

1. gera o site na versão do CBG (`tools/wordpress/build-site.sh`, o mesmo que o plugin usa);
2. publica o pacote numa release do repositório (`geometria-lab-site.zip` e `build.json`, com o
   SHA-256 do pacote), mantendo só as 10 mais recentes;
3. avisa o WordPress em `https://www.cbg.ime.unicamp.br/wp-json/geometria-lab/v1/publicar`, com uma
   assinatura feita com o segredo `CBG_DEPLOY_SECRET`.

O plugin (a partir da versão 2.0.0, arquivo `publicar.php`) confere a assinatura, baixa o pacote da
release, confere o SHA-256 e só aceita arquivos estáticos (HTML, CSS, JS, imagens e fontes; nada de
PHP). Ele põe a versão nova em `<uploads>/geometria-lab/site-…/`, guarda a anterior e limpa o cache do
WP Fastest Cache. Se o aviso não chegar, o WordPress confere sozinho a release mais recente de hora em
hora. O repositório precisa ser público, porque o WordPress baixa o pacote sem senha.

**Configuração (uma vez só)**

1. Envie o plugin 2.0.0 ou mais novo ao WordPress (veja acima).
2. No WordPress, em **Configurações → GeometrIA → Publicação automática**, clique em **Gerar chave**
   e copie a chave.
3. No GitHub, em **Settings → Secrets and variables → Actions → New repository secret**, crie o segredo
   `CBG_DEPLOY_SECRET` com essa chave.
4. Na aba **Actions**, rode **Publicar no site do CBG → Run workflow** (ou faça um push). Em
   Configurações → GeometrIA, a versão no ar passa a ser a do GitHub.

**Em Configurações → GeometrIA** ficam a versão no ar (com o commit), **Atualizar agora**,
**Voltar para a versão anterior** (que também pausa as atualizações automáticas, até alguém reativar),
**Pausar as atualizações automáticas**, **Testar a conexão com o GitHub** e o registro das últimas
tentativas.

**Se algo falhar**

- O workflow falha em "Publicar a release" com erro 403: em **Settings → Actions → General →
  Workflow permissions**, escolha **Read and write permissions**.
- O workflow falha em "Avisar o WordPress do CBG": o motivo aparece no próprio passo e no registro em
  Configurações → GeometrIA (por exemplo, chave diferente, atualizações pausadas ou o servidor sem
  acesso ao GitHub). A verificação de hora em hora tenta de novo; **Atualizar agora** força na hora.
- O navegador pode mostrar a página antiga por até cinco minutos; Cmd+Shift+R recarrega de verdade.

### No GitHub Pages

1. Faça commit e push deste repositório para `main`.
2. No GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   branch `main`, pasta `/ (root)`.
3. Em um ou dois minutos o site estará em https://tomassilva.github.io/GeometrIA-Lab/. O endereço vem
   do nome da conta no GitHub (TomasSilva). Repositório privado só publica com GitHub Pro.

Domínio próprio (ex.: `geometria.ime.unicamp.br`): configure o DNS, preencha o campo em
**Settings → Pages → Custom domain**, e em `_config.yml` troque `url` e deixe `baseurl: ""`.

### Versão de testes no servidor do IMECC

Endereço: **https://www.ime.unicamp.br/~tomas/GeometrIA-Lab/**. O `_config_imecc.yml` troca só o
endereço (e liga o redirecionamento para https e o `noindex`, para os buscadores não indexarem a
versão de testes); o resto vem do `_config.yml`.

```bash
# na pasta do repositório: gera o site para esse endereço em _site_imecc/
bundle exec jekyll build --config _config.yml,_config_imecc.yml -d _site_imecc

# copia para public_html/GeometrIA-Lab no servidor do IMECC (pede a senha do IMECC)
chmod -R a+rX _site_imecc
rsync -av --delete _site_imecc/ tomas@ssh.ime.unicamp.br:public_html/GeometrIA-Lab/
```

- O IMECC publica a pasta `public_html` da sua conta em `www.ime.unicamp.br/~tomas`; `GeometrIA-Lab`
  é uma subpasta dela. O `index.html` de `~tomas/`, que redireciona para o site pessoal, não é afetado.
- O `chmod` deixa os arquivos legíveis pelo servidor; sem isso, o Apache pode responder "Forbidden".
- Sem rsync, dá para usar um programa de SFTP (Cyberduck, FileZilla) em `ssh.ime.unicamp.br` e copiar o
  conteúdo de `_site_imecc/` para `public_html/GeometrIA-Lab/`.
- O servidor também responde em `http://`; o site redireciona para `https://`, porque o anti-robô do
  formulário só funciona com https.
- O formulário usa o mesmo script do Apps Script. A página 404 do site não é usada lá: o servidor
  mostra a dele.

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
| `_data/news.yml` | Novidades da página inicial (junto com os posts do blog, do mais novo ao mais antigo). |
| `_posts/pt/`, `_posts/en/` | Posts do blog (veja "Escrever um post", abaixo). Textos da página do blog em `_data/text/blog.yml`. |
| `_data/modes.yml` | Os quatro modos (Aproximar, Prever, Buscar, Auxiliar) + Geometria para IA. |
| `_data/pipeline.yml` | As cinco etapas do ciclo. |
| `_data/principles.yml` | Princípios da página Abordagem. |
| `_data/text/*.yml` | Os demais textos de cada página (início, abordagem, pesquisa, pessoas, colabore, marca). Os avisos de campo obrigatório do formulário ficam em `collaborate.yml`, em `form.errors`. |
| `_data/form.yml` | Endereço (`endpoint`) do back-end do formulário e tamanho máximo do PDF (veja abaixo). |
| `_data/triage.yml` | As quatro etapas de uma proposta e a nota sobre a decisão do laboratório (a nota aparece só na Abordagem). |
| `_data/text/example.yml` | O modelo de proposta preenchida (`/colabore/exemplo/`). |
| `tools/form-backend.gs` | Back-end do formulário (Google Apps Script): confere o login, envia cada proposta, com o PDF, para o e-mail do laboratório. |
| `tools/triagem-manual.md` | Roteiro da triagem à mão no Claude: instruções, critérios da nota e mensagens ao proponente. |
| `_config.yml` | Endereço, e-mail de contato, links institucionais. |
| `assets/img/brand/` | Logotipos, favicons e o kit da marca (`geometria-brand-kit.zip`). Não vão para a versão do CBG (só o favicon). |
| `_config_cbg.yml` | Endereço da versão do CBG e o modo WordPress (`wp_gate`). |
| `tools/wordpress/geometria-lab/` | O plugin do WordPress (`geometria-lab.php`). |
| `tools/wordpress/build-plugin.sh` | Gera o site para o CBG e empacota o plugin em `tools/wordpress/dist/geometria-lab.zip` (fora do Git). |
| `tools/wordpress/build-site.sh` | Gera só o site na versão do CBG (usado pelo plugin e pela publicação automática). |
| `.github/workflows/publicar-cbg.yml` | Publicação automática no site do CBG a cada push (veja "Publicação automática"). |
| `tools/wordpress/geometria-lab/publicar.php` | A parte do plugin que recebe o aviso do GitHub, baixa e põe no ar cada versão. |

**Estilo dos textos.** Tom profissional, cordial e humano, em frases completas. O texto do site não usa
travessões (—) nem dois-pontos; as exceções são o nome oficial com meia-risca ("CBG – Laboratório de IA
e Geometria"), nomes como Calabi–Yau, os títulos originais dos artigos e os identificadores `arXiv:`.

### Adicionar uma publicação

Copie um bloco em `_data/publications.yml` e ajuste. Os campos `modes` aceitam
`approximate`, `predict`, `search`, `assist` e `geometry-for-ai` — são os filtros da página Pesquisa.
Os nomes dos membros (campo `short` em `people.yml`) aparecem em negrito automaticamente.

### Escrever um post

O blog fica em `/blog/` (e `/en/blog/`), com os resumos mensais sobre IA e matemática (`kind: digest`)
e as notícias do laboratório (`kind: news`). Cada post é um arquivo Markdown em `_posts/pt/` e, se
houver tradução, outro em `_posts/en/`. O nome do arquivo dá a data e o endereço:
`_posts/pt/2026-11-30-resumo-de-novembro.md` vira `/blog/resumo-de-novembro/`.

```markdown
---
title: "Resumo de novembro de 2026"
description: "Uma ou duas frases, que aparecem na lista do blog, no topo do post e nas buscas."
news: "Frase curta para as Últimas notícias da página inicial (opcional; sem ela, vai o título)."
kind: digest
key: resumo-2026-11
---

Texto em Markdown. Use ## para os subtítulos, - para listas e [texto](https://...) para links.
```

- `key` liga o post à tradução: use a mesma nos dois idiomas, e o botão PT/EN leva de um ao outro.
  Sem tradução, o botão leva à página do blog no outro idioma.
- Opcional: `author: "Nome"` e botões no topo, como no post da pesquisa
  (`actions`, cada um com `label`, `url` e `lang`, e `actions_note` para uma linha abaixo deles).
- Posts com data futura só aparecem quando o site é gerado nessa data ou depois.
- Para publicar, siga "Atualizar o site": gere o plugin, envie no WordPress e faça commit e push.

### Adicionar uma pessoa

Copie um bloco em `_data/people.yml`. Sem `photo`, o site desenha um monograma com as iniciais.
Com foto, coloque o arquivo em `assets/img/people/` e use `photo: /assets/img/people/nome.jpg`.

---

## Formulário "Colabore" → e-mail do laboratório

O formulário do site é próprio. Com o back-end (`tools/form-backend.gs`, um Google Apps Script)
instalado na conta `geoialab@unicamp.br` (Google Workspace da Unicamp), cada proposta vira um e-mail
para essa mesma caixa:

- **Assunto:** `[GeometrIA][CBG] GIA-2026-0007 — título`. O `[CBG]` marca as propostas de membros do
  CBG, que têm prioridade na padronização (como diz o site).
- **Corpo:** um resumo (ID, data, pedidos como o convite para o Zulip, situação do PDF); o bloco
  **PROPONENTE**, com os dados pessoais; e o bloco **PROPOSTA**, só com o projeto — pronto para colar
  no Claude.
- **Anexo:** o PDF, já conferido (tem de ser um PDF de verdade, com até 10 MB).
- **Responder** ao e-mail responde direto ao proponente.

O script manda para o endereço principal da conta, não para o alias `geometria.lab@cbg.unicamp.br`
(que entrega na mesma caixa): rodando na mesma conta, a cópia que volta pelo alias é descartada pelo
Gmail como duplicata e fica só em **Enviados**. Para quem escreve de fora, o alias funciona
normalmente — por isso ele continua sendo o contato público do site.

Até 2 de outubro de 2026 o script ficava na conta `geometrialab@gmail.com`; a implantação antiga
pode ser arquivada depois que a nova estiver no ar.

**Trocar o script de conta** (ou de implantação): instale o script na conta nova (veja
"Instalação"), rode `setup`, publique, e cole a chave nova e o URL `/exec` novo em **Configurações →
GeometrIA**, no WordPress. Não é preciso gerar o plugin de novo. Depois, atualize `endpoint` no
`_data/form.yml`, para o site gerado e as cópias também usarem o endereço novo.

Nada fica guardado fora do e-mail: não há planilha nem pasta de arquivos. A triagem (proposta
padronizada + nota) é feita à mão, no Claude — o roteiro, as instruções e as mensagens-modelo estão em
[`tools/triagem-manual.md`](tools/triagem-manual.md).

Se o e-mail não puder ser enviado, o site mostra um erro com o endereço do laboratório. Enquanto
`endpoint` estiver vazio em `_data/form.yml`, o envio abre um e-mail pré-preenchido para
`contact_email` — e a pessoa precisa anexar o PDF à mão.

### Login no site do CBG

Com `WP_LOGIN_REQUIRED = true` (o padrão), o script só aceita propostas que trazem o passe assinado
pelo plugin: `<validade>.<HMAC-SHA256(WP_KEY, "wp|e-mail|validade")>`, válido por 12 h. Ele confere a
assinatura, o prazo e se o e-mail do passe é o da proposta. Sem passe válido, responde `login`, e o
site pede para recarregar a página e entrar de novo. O pedido de código por e-mail fica desligado.
No e-mail ao laboratório aparece "E-mail confirmado: sim (conta do site do CBG, com login)".

A chave `WP_KEY` (propriedade do script) é criada pelo `setup` e tem de ser a mesma em
**Configurações → GeometrIA**, no WordPress. Para trocá-la, apague a propriedade, rode `setup` de novo
e cole a nova chave no WordPress.

### Fora do site do CBG: e-mail confirmado e anti-robô

*Vale só para as cópias fora do site do CBG, com `WP_LOGIN_REQUIRED = false` no script.*

Só entra proposta de quem confirmou o e-mail. Logo abaixo do campo de e-mail fica o bloco
**"Confirme seu e-mail"**:

1. A pessoa marca **"Eu não sou um robô"** e clica em **"Enviar código"**. (Se clicar sem marcar, a
   verificação roda sozinha.)
2. O script manda um código de **6 dígitos** para o endereço, de `geoialab@unicamp.br`, com o
   código no assunto. O código vale **15 minutos**, uma vez só, com **5 tentativas**.
3. Ao digitar o sexto dígito, o site confere o código e mostra **"E-mail confirmado"**. A confirmação
   vale 6 horas e vai junto com a proposta; "Enviar outra proposta" aproveita a mesma.
4. Sem a confirmação, "Enviar proposta" não sai. No e-mail ao laboratório aparece
   "E-mail confirmado: sim".

Limites e custos:

- No máximo 3 códigos por endereço e 30 no total, por hora, e o botão só reenvia depois de 45 s.
- Cota de e-mails: uma conta do Google Workspace envia até 1.500 e-mails por dia pelo Apps Script
  (uma conta comum do Gmail, 100). Neste modo cada
  proposta usa 3 (o código, o aviso ao laboratório e a confirmação ao proponente); no site do CBG, 2.
  Quando restam 20 e-mails na cota do dia, o script para de mandar códigos e confirmações.
- O código pode cair no spam ou atrasar alguns minutos em servidores de universidade; o site avisa.

O anti-robô é o [ALTCHA](https://altcha.org): código aberto (licença MIT), gratuito, sem conta, sem
cookies e sem serviços de terceiros. O site pede um desafio ao script (`/exec?altcha=1`) e o navegador
resolve uma pequena prova de trabalho (menos de 1 s num computador comum). O script confere a solução,
a assinatura e o prazo (30 min), e aceita cada solução uma única vez. Com a confirmação de e-mail
ligada, ele protege o pedido de código — ninguém usa o formulário para disparar e-mails a terceiros.

- O widget fica em `assets/js/vendor/altcha/` (versão e licença no `README.txt` da pasta), servido
  pelo próprio site.
- Interruptores, **sempre em par** (site ↔ script): `verify_email` ↔ `VERIFY_EMAIL` e `altcha` ↔
  `ALTCHA_REQUIRED`, no `_data/form.yml` e no início do script. Com o script exigindo algo que o site
  não pede, todas as propostas são recusadas.
- Ao mudar essas partes, publique **antes** a versão nova do script (`version` 2026-09-28d ou mais
  nova) e só depois o site: o site pede desafios e códigos ao script, e um script antigo não sabe
  responder.
- A chave secreta que assina os desafios e as confirmações é criada sozinha, na propriedade do script
  `HMAC_KEY`. Apagá-la invalida os desafios e as confirmações em aberto; uma nova é criada no pedido
  seguinte.

### Instalação (~5 min)

1. Com a conta `geoialab@unicamp.br`, abra <https://script.google.com> → **Novo projeto** e dê
   um nome, por exemplo "GeometrIA — formulário".
2. Apague o conteúdo de `Código.gs`, cole o arquivo `tools/form-backend.gs` inteiro e salve.
3. No menu ao lado de **▷ Executar**, escolha a função **`setup`** (não a `doGet`, que vem
   selecionada) e clique em **Executar**. Autorize o envio de e-mail — é a única
   permissão. Copie a chave para o plugin que aparece no registro (veja "No site do CBG"). Em contas pessoais aparece "O Google não verificou este app": **Avançado → Acessar** —
   o app é o seu próprio script.
4. **Implantar → Nova implantação → Tipo: App da Web.** *Executar como:* **Eu**.
   *Quem pode acessar:* **Qualquer pessoa**. Copie o URL que termina em `/exec`.
5. Cole o URL em **Configurações → GeometrIA → Endereço do script**, no WordPress, e em `endpoint`,
   no `_data/form.yml`. Commit + push.
6. Teste: abra o URL `/exec` numa **janela anônima** — deve aparecer `{"ok":true,…,"version":"…"}`.
   Numa janela comum, logada em mais de uma conta Google, o Google costuma mostrar "Não foi possível
   abrir o arquivo", mesmo com tudo certo. Depois, envie uma proposta pelo site. Para testar só o
   e-mail, execute `testSubmission` no editor.

Para mandar as propostas a outro endereço, mude `LAB_EMAIL` no início do script e publique uma nova
versão.

Contas institucionais (Google Workspace, como a da Unicamp) às vezes não permitem o acesso "Qualquer
pessoa": no passo 4 só aparece "Qualquer pessoa em unicamp.br", e o site não consegue enviar. Nesse
caso, peça a liberação à DGTIC ou instale o script numa conta Google comum (por exemplo
`geometrialab@gmail.com`), mantendo `LAB_EMAIL = 'geoialab@unicamp.br'`: as propostas continuam
indo para a caixa da Unicamp.

### No dia a dia

- Cada proposta tem um ID (`GIA-2026-0007`), que o proponente também vê na tela ao enviar.
- **Confirmação ao proponente:** logo depois do aviso ao laboratório, o script manda ao proponente
  um "Recebemos sua proposta GIA-…", no idioma da página, com o título, a situação do PDF e os
  próximos passos (`SEND_RECEIPT`, no início do script; `testReceipt` manda um exemplo PT e EN para
  o laboratório). Só vai para e-mail confirmado e nunca derruba o envio. Um filtro do Gmail com
  "Enviar modelo" **não** serve para isso: o e-mail da proposta sai da própria conta do laboratório,
  e a resposta automática do Gmail volta para ela, não para o proponente (testado em 13/10/2026).
- Limites: 5 envios por hora por e-mail e 60 no total; o reenvio da mesma proposta é ignorado.
- Proteções: login no site do CBG (passe assinado), um campo-armadilha escondido e um tempo mínimo
  de preenchimento. Nas cópias fora do CBG, código por e-mail e ALTCHA no lugar do login.
- PDF: até 10 MB. Para mudar, altere juntos `MAX_PDF_MB` no script e `max_pdf_mb` no `_data/form.yml`.
- **Pedido de exclusão (LGPD):** apague o e-mail da proposta (também da lixeira) e as conversas do
  Claude em que ela foi usada.
- Ao atualizar o script: salve, rode `setup` e publique em **Implantar → Gerenciar implantações →
  editar → Versão: Nova versão**. Sem a nova versão, o URL `/exec` continua rodando o código antigo;
  o `version` que aparece ao abri-lo mostra qual está no ar. O URL não muda.
- Se o URL `/exec`, numa janela anônima, mostrar "Page Not Found" ("o arquivo não existe"), a
  implantação foi arquivada ou não está com **Quem pode acessar: Qualquer pessoa**. Nesse caso, o
  formulário do site mostra um erro com o e-mail do laboratório — ele nunca confirma um envio que o
  script não recebeu.

---

## Custos

Nada é pago, e nada vence ou precisa ser renovado.

| Peça | Observação |
|---|---|
| Plugin do WordPress | Código próprio, sem licença, assinatura ou plugin de terceiros. |
| Hospedagem | O servidor e o WordPress que o CBG já tem. |
| Google Apps Script e e-mail | Grátis, na conta institucional da Unicamp. Limite de 1.500 e-mails por dia (2 por proposta, o aviso ao laboratório e a confirmação ao proponente); os PDFs ocupam o espaço da caixa. |
| Fontes, ALTCHA, Jekyll, Ruby | Código aberto (SIL OFL, MIT etc.). |
| GitHub | Repositório privado grátis. O GitHub Pages com repositório privado exigiria o plano Pro, mas não é necessário. |

O único custo do processo é o uso do Claude na triagem manual, que o próprio site menciona.

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

Tudo documentado na página `/marca/` do site (sem link no menu nem no rodapé, e fora da versão do CBG
por causa do tamanho do plugin). Ela aparece na pré-visualização local e nas cópias, por exemplo
http://127.0.0.1:4000/GeometrIA-Lab/marca/.

A animação da página inicial (`assets/js/flow.js`) é uma descida de gradiente real da energia
de Willmore restrita aos toros de revolução, W(c) = π²c²/√(c²−1), que converge para o
toro de Clifford (c = √2, W = 2π²). Ela respeita `prefers-reduced-motion`.
