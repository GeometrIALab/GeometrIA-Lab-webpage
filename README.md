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
instalado na conta `geometrialab@gmail.com`, cada proposta vira um e-mail para essa mesma caixa:

- **Assunto:** `[GeometrIA][CBG] GIA-2026-0007 — título`. O `[CBG]` marca as propostas de membros do
  CBG, que têm prioridade na padronização (como diz o site).
- **Corpo:** um resumo (ID, data, pedidos como o convite para o Zulip, situação do PDF); o bloco
  **PROPONENTE**, com os dados pessoais; e o bloco **PROPOSTA**, só com o projeto — pronto para colar
  no Claude.
- **Anexo:** o PDF, já conferido (tem de ser um PDF de verdade, com até 10 MB).
- **Responder** ao e-mail responde direto ao proponente.

O script manda direto para o Gmail, não para o alias `geometria.lab@cbg.unicamp.br` (que encaminha
para ele): rodando na mesma conta, a cópia que volta pelo alias é descartada pelo Gmail como
duplicata e fica só em **Enviados**. Para quem escreve de fora, o alias funciona normalmente — por
isso ele continua sendo o contato público do site.

Nada fica guardado fora do e-mail: não há planilha nem pasta de arquivos. A triagem (proposta
padronizada + nota) é feita à mão, no Claude — o roteiro, as instruções e as mensagens-modelo estão em
[`tools/triagem-manual.md`](tools/triagem-manual.md).

Se o e-mail não puder ser enviado, o site mostra um erro com o endereço do laboratório. Enquanto
`endpoint` estiver vazio em `_data/form.yml`, o envio abre um e-mail pré-preenchido para
`contact_email` — e a pessoa precisa anexar o PDF à mão.

### E-mail confirmado e anti-robô

Só entra proposta de quem confirmou o e-mail. Logo abaixo do campo de e-mail fica o bloco
**"Confirme seu e-mail"**:

1. A pessoa marca **"Eu não sou um robô"** e clica em **"Enviar código"**. (Se clicar sem marcar, a
   verificação roda sozinha.)
2. O script manda um código de **6 dígitos** para o endereço, de `geometrialab@gmail.com`, com o
   código no assunto. O código vale **15 minutos**, uma vez só, com **5 tentativas**.
3. Ao digitar o sexto dígito, o site confere o código e mostra **"E-mail confirmado"**. A confirmação
   vale 6 horas e vai junto com a proposta; "Enviar outra proposta" aproveita a mesma.
4. Sem a confirmação, "Enviar proposta" não sai. No e-mail ao laboratório aparece
   "E-mail confirmado: sim".

Limites e custos:

- No máximo 3 códigos por endereço e 30 no total, por hora, e o botão só reenvia depois de 45 s.
- Cota do Gmail: uma conta comum envia até 100 e-mails por dia pelo Apps Script. Cada proposta usa
  2 (o código e o aviso ao laboratório), o que dá umas 50 propostas por dia. Quando restam 20 e-mails
  na cota do dia, o script para de mandar códigos, para não faltar e-mail para as propostas.
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

1. Com a conta `geometrialab@gmail.com`, abra <https://script.google.com> → **Novo projeto** e dê
   um nome, por exemplo "GeometrIA — formulário".
2. Apague o conteúdo de `Código.gs`, cole o arquivo `tools/form-backend.gs` inteiro e salve.
3. Escolha a função **`setup`** e clique em **Executar**. Autorize o envio de e-mail — é a única
   permissão. Em contas pessoais aparece "O Google não verificou este app": **Avançado → Acessar** —
   o app é o seu próprio script.
4. **Implantar → Nova implantação → Tipo: App da Web.** *Executar como:* **Eu**.
   *Quem pode acessar:* **Qualquer pessoa**. Copie o URL que termina em `/exec`.
5. Cole o URL em `endpoint`, no `_data/form.yml`. Commit + push.
6. Teste: abra o URL `/exec` numa **janela anônima** — deve aparecer `{"ok":true,…,"version":"…"}`.
   Numa janela comum, logada em mais de uma conta Google, o Google costuma mostrar "Não foi possível
   abrir o arquivo", mesmo com tudo certo. Depois, envie uma proposta pelo site. Para testar só o
   e-mail, execute `testSubmission` no editor.

Para mandar as propostas a outro endereço, mude `LAB_EMAIL` no início do script e publique uma nova
versão.

Contas institucionais (Google Workspace) às vezes não permitem o acesso "Qualquer pessoa". Nesse caso,
peça a liberação ao administrador ou instale o script numa conta Google fora do domínio — as propostas
continuam indo para `LAB_EMAIL`.

### No dia a dia

- Cada proposta tem um ID (`GIA-2026-0007`), que o proponente também vê na tela ao enviar.
- Limites: 5 envios por hora por e-mail e 60 no total; o reenvio da mesma proposta é ignorado.
- Proteções contra robôs: e-mail confirmado por código, o ALTCHA, um campo-armadilha escondido e um
  tempo mínimo de preenchimento.
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
