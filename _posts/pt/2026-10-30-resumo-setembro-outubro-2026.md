---
title: "Da produção de provas à crise da verificação"
description: "Resumo de setembro e outubro de 2026 sobre IA e matemática. Em dois meses, a discussão mudou de escala, e a questão passou a ser como verificar, compreender e dar crédito a resultados produzidos por modelos."
news: "Resumo de setembro e outubro de 2026, da produção de provas à crise da verificação."
kind: digest
key: resumo-2026-09-10
date: 2026-10-30 09:00:00 -0300
---
{%- capture convite -%}{% include invite-href.html %}{%- endcapture -%}

> **Resumo da comunidade MathIA AmLat, atualizado em 30 de outubro de 2026.** Este texto distingue cuidadosamente anúncios, preprints, formalizações verificadas por computador e resultados já assimilados pela comunidade. Uma prova em Lean certifica um enunciado formal. Ela não garante, por si só, que esse enunciado corresponda exatamente à afirmação apresentada em linguagem natural, nem substitui a compreensão e a avaliação humanas.

Em apenas dois meses, a discussão sobre inteligência artificial em matemática mudou de escala. No início de setembro, ainda era possível tratar cada resultado como um episódio isolado, fosse uma formalização impressionante, uma possível solução para um problema famoso ou uma controvérsia sobre autoria. Ao final de outubro, já havia centenas de manuscritos produzidos por modelos, provas formais com dezenas de milhões de linhas, sistemas multiagentes resolvendo a maioria dos problemas de avaliações controladas e novas estruturas sendo criadas para revisão, atribuição e governança.

A pergunta central deixou de ser simplesmente **“a IA consegue resolver problemas matemáticos difíceis?”**. As questões agora são mais amplas. **Como verificar resultados produzidos nessa escala? Como transformá-los em compreensão matemática? Quem recebe crédito? Quem escolhe os problemas? Quem tem acesso aos modelos e à computação? E como garantir que comunidades fora dos grandes centros tecnológicos participem como protagonistas?**

## Visão geral do período

| Data | Evento | Situação em 30/10/2026 |
|---|---|---|
| 4 de setembro | Claude formaliza o Último Teorema de Fermat | Formalização de um resultado conhecido, com código publicado e revisão inicial |
| 8 de setembro | OpenAI anuncia uma solução para Navier–Stokes | Alegação publicada e formalizada, mas ainda contestada e sem consenso independente |
| 11 de setembro | Publicação de *A Severe Misalignment of AI in Mathematics* | Manifesto sobre compreensão, autoria e impacto profissional |
| 21 a 29 de setembro | Criação do AGMAI e publicação de recomendações | Primeira resposta institucional estruturada sobre divulgação responsável |
| 6 de outubro | OpenAI libera centenas de manuscritos matemáticos | Coleção pública em diferentes estágios de verificação |
| 14 de outubro | Terceira rodada do First Proof | Avaliação controlada mostra forte desempenho e problemas persistentes de exposição e citação |
| 20 de outubro | Terence Tao lança um desafio colaborativo com IA | Experimento aberto sobre matemática no estilo Polymath na era da IA |
| 26 de outubro | OpenAI anuncia resultados em Kakeya, ETH e teoria quântica de campos | Alegações extraordinárias ainda em processo de avaliação humana |
| 26 e 27 de outubro | Axiom anuncia a formalização da classificação dos grupos simples finitos | Código publicado, com auditoria e reprodução independentes ainda essenciais |
| 28 de outubro | Mark Kisin publica preprint sobre uma conjectura de Serre | Trabalho de humano e IA com uso extensivo do GPT Astra, ainda sem revisão independente |

## Setembro e o choque inicial

### 1. Claude formaliza o Último Teorema de Fermat

Em 4 de setembro, a Anthropic anunciou a [primeira prova integral e verificada por computador do Último Teorema de Fermat](https://www.anthropic.com/research/formalizing-fermats-last-theorem). Segundo a empresa, Claude trabalhou de forma amplamente autônoma por 11 dias, produziu cerca de **13 milhões de linhas de Lean** e provou aproximadamente **29.500 teoremas intermediários** utilizados na versão final.

É importante entender corretamente a natureza desse feito. Claude não encontrou uma nova demonstração matemática do teorema. O sistema formalizou, em Lean, uma rota baseada na prova de Wiles e em desenvolvimentos posteriores. A novidade está na **autoformalização em escala**, isto é, na capacidade de transformar uma enorme cadeia de argumentos humanos em um objeto que um verificador de provas pode checar passo a passo.

Esse resultado tornou plausível algo que, pouco tempo atrás, parecia um projeto de muitos anos, formalizar grandes partes da literatura matemática com auxílio de IA. Isso pode facilitar a detecção de lacunas, reduzir parte do trabalho mecânico de verificação e criar uma base mais confiável para novas provas. Ao mesmo tempo, os 13 milhões de linhas mostram que a verificabilidade automática não produz necessariamente uma exposição que um ser humano consiga ler ou compreender.

**Classificação.** Formalização publicada de um teorema conhecido. Não é uma nova prova conceitual do Último Teorema de Fermat.
{: .post-note}

### 2. O anúncio sobre Navier–Stokes e seus desdobramentos

Quatro dias depois, a OpenAI anunciou que um sistema interno havia produzido uma [possível solução do problema de existência e regularidade de Navier–Stokes](https://openai.com/index/navier-stokes-solution/), exibindo uma singularidade em tempo finito para a versão tridimensional incompressível com força externa suave. A empresa informou que cerca de **10 mil agentes** trabalharam simultaneamente. A solução teria sido encontrada em aproximadamente 88 horas, seguida por outras 17 horas de formalização e verificação em Lean. Considerando todos os problemas tentados nessa campanha, foram usados cerca de 300 bilhões de tokens de saída.

O anúncio teve enorme impacto, mas não encerrou o problema. Em outubro, uma [auditoria da correspondência entre o texto e a formalização](https://arxiv.org/abs/2610.08144) argumentou que a prova em Lean não representa de modo semanticamente fiel a demonstração apresentada em linguagem natural. Esse ponto é crucial. O kernel de Lean pode verificar perfeitamente que uma conclusão segue de determinadas definições e hipóteses formais, mas não verifica automaticamente se essas definições expressam exatamente o problema matemático que os autores dizem ter resolvido.

Isso não significa, por si só, que toda a ideia matemática esteja errada. Significa que **“o arquivo compila em Lean” não pode ser usado como sinônimo de “a afirmação anunciada foi definitivamente estabelecida”**. A comunidade ainda precisa auditar a modelagem, a correspondência entre os dois textos, a relevância dos lemas e o conteúdo matemático da construção.

O episódio também levantou discussões sobre prioridade, acesso a trabalhos não publicados, atribuição e a relação entre laboratórios de IA e pesquisadores que usam seus produtos. Assim, Navier–Stokes tornou-se simultaneamente um possível grande avanço e um estudo de caso sobre como resultados desse tipo não devem ser comunicados sem protocolos claros.

**Classificação.** Anúncio verificável, com texto e formalização públicos, mas ainda contestado e sem validação independente consensual.
{: .post-note}

### 3. A reação da comunidade e o valor da compreensão

Em 11 de setembro, um amplo grupo de medalhistas Fields publicou a declaração [*A Severe Misalignment of AI in Mathematics*](https://mathandai.org/). O texto não nega o potencial da IA, mas critica o uso de problemas abertos como simples benchmarks para promover modelos. O argumento central é que o objetivo da matemática não é somente classificar afirmações como verdadeiras ou falsas, mas construir conceitos, métodos, explicações, intuição e uma comunidade capaz de transmitir esse conhecimento.

A declaração alertou que a produção acelerada de soluções pode destruir justamente o ambiente intelectual que torna novos avanços possíveis. Também chamou atenção para questões de citação, autoria e formação. Se modelos entregam resultados sem uma cadeia humana de compreensão, como novas gerações aprenderão a formular perguntas e reconhecer ideias importantes?

Essa reação marcou uma mudança no debate. A divisão deixou de ser simplesmente entre pessoas “a favor” ou “contra” a IA. Passou-se a discutir **quais usos preservam e ampliam a compreensão humana, quais incentivos são prejudiciais e quais instituições precisam ser construídas**.

### 4. O nascimento de uma agenda de governança

Em 21 de setembro, a OpenAI informou que seu modelo interno havia resolvido [mais de cem problemas abertos](https://openai.com/index/advisory-group-on-mathematics-and-ai/) e anunciou a criação de um grupo consultivo independente. Poucos dias depois, o **Advisory Group on Mathematics and Artificial Intelligence (AGMAI)**, sediado no Institute for Advanced Study, começou a publicar suas próprias posições.

As [recomendações de 29 de setembro](https://agmai.org/general-sep29/) foram baseadas em mais de 600 respostas da comunidade. Entre as propostas, destacam-se as seguintes.

- Divulgar rapidamente resultados relevantes em repositórios acadêmicos independentes, com versões e identificadores persistentes.
- Informar o modelo utilizado, os prompts, o número de tentativas, o tempo, o custo computacional e os fracassos relevantes.
- Melhorar citações e exposição antes da publicação.
- Formalizar as provas sempre que possível e documentar claramente o que foi ou não formalizado.
- Explicar como os problemas foram escolhidos e quantos problemas comparáveis foram tentados sem sucesso.
- Financiar grupos de leitura, workshops, escolas e textos expositivos para transformar a produção bruta em compreensão humana.
- Garantir acesso amplo e equitativo aos modelos, evitando uma matemática dividida entre instituições com e sem recursos computacionais.

O AGMAI também pediu que laboratórios deixassem de usar problemas matemáticos avançados como testes privados de modelos proprietários inacessíveis à comunidade. A preocupação não é apenas com a divulgação posterior, mas também com a possibilidade de empresas privadas passarem a escolher, sozinhas, quais partes da matemática receberão uma quantidade extraordinária de computação.

## Outubro, quando a escassez de provas virou escassez de atenção

### 5. A publicação em massa da OpenAI

Em 6 de outubro, a OpenAI abriu uma coleção inicialmente formada por **722 manuscritos, organizados em 372 famílias de resultados**, produzidos por um modelo interno. O [repositório público](https://github.com/openai/math) contém textos, materiais auxiliares e formalizações para parte dos resultados. Após revisões e remoções, o catálogo registrava 719 manuscritos no fim do mês.

O próprio repositório ressalta que os trabalhos estão em **diferentes estágios de verificação**, que nem todos possuem formalização em Lean e que resultados não formalizados podem conter problemas. Portanto, os números não devem ser lidos como “372 novos teoremas definitivamente estabelecidos”. Trata-se de uma grande coleção de alegações e artefatos de pesquisa que a comunidade ainda precisa classificar, reproduzir, corrigir, compreender e relacionar à literatura existente.

A escala, entretanto, muda a natureza do problema. O sistema tradicional de revisão foi construído para um fluxo relativamente limitado de artigos, cada qual associado a autores humanos capazes de defender o texto. Centenas de manuscritos produzidos em poucas semanas criam uma assimetria. **Gerar pode levar horas, enquanto verificar, contextualizar e explicar pode exigir meses de especialistas humanos.**

Em 15 de outubro, a OpenAI anunciou uma contribuição de **US$ 5 milhões à Simons Foundation** para apoiar conferências, workshops e programas dedicados ao exame desses resultados, além de acesso a modelos e computação para pesquisadores apoiados. É um passo relevante, embora permaneça a questão de quem define a agenda e como distribuir esses recursos de forma globalmente justa.

**Classificação.** Coleção pública de resultados alegados, com níveis variados de formalização, correção e compreensão humana.
{: .post-note}

### 6. First Proof e o desempenho em problemas inéditos

A terceira rodada do [First Proof Project](https://1stproof.org/third-batch.html), divulgada em 14 de outubro, oferece uma evidência mais controlada do avanço dos sistemas. Dez problemas reais de pesquisa, já resolvidos por matemáticos mas ainda sem soluções públicas, foram apresentados aos modelos durante 24 horas e sem intervenção humana.

O sistema multiagente **ProofCouncil** resolveu corretamente 9 dos 10 problemas, e uma consulta direta ao **GPT‑6 Astra** resolveu 7. Cada um dos dez problemas foi resolvido por pelo menos um sistema, desconsiderando dificuldades de citação e exposição. Mas os números também mostram os limites atuais.

- Apenas 4 das 10 respostas do GPT‑6 Astra receberam avaliação adequada de citações.
- O ProofCouncil elevou esse número para 7, mas ainda teve avaliações negativas de exposição em parte das respostas.
- O ProofCouncil custou cerca de **US$ 1.888**, contra aproximadamente **US$ 36** para a consulta direta ao Astra.
- O sistema baseado em pesos abertos ficou muito atrás dos modelos de fronteira.

O resultado confirma duas tendências. Primeiro, combinar agentes, modelos, ferramentas e verificadores melhora substancialmente o desempenho. Segundo, o desempenho de ponta pode depender de uma quantidade de computação que universidades, grupos pequenos e países com menos recursos não conseguem sustentar. A desigualdade de acesso não é uma preocupação abstrata para o futuro, pois ela já aparece nos benchmarks.

### 7. Novas infraestruturas para revisão e debate

Outubro também foi o mês em que começaram a surgir instituições voltadas não a produzir mais provas, mas a organizar o que já está sendo produzido. O [ProofForum](https://www.proofforum.org/) foi lançado como um repositório aberto para trabalhos matemáticos produzidos com IA e submetidos a revisão humana, registrando versões e proveniência e separando avaliações automáticas, pareceres humanos assinados e consenso comunitário.

O blog coletivo [Proofs and Prompts](https://proofsandprompts.com/) passou a reunir relatos práticos, críticas, propostas de normas, experiências de estudantes e reflexões sobre autoria, educação e o futuro da profissão. Esses espaços são importantes porque a resposta comunitária não pode se limitar aos canais de comunicação dos próprios laboratórios.

O problema agora é construir uma infraestrutura na qual seja possível responder, para cada trabalho, às perguntas abaixo.

1. Qual é exatamente a afirmação?
2. O texto é matematicamente correto?
3. A formalização corresponde ao texto?
4. O que é realmente novo?
5. Quais ideias já existiam e precisam ser citadas?
6. Quem compreende e assume responsabilidade pelo argumento?
7. Quais versões foram corrigidas ou retiradas?

### 8. Terence Tao propõe um experimento no estilo Polymath

Em 20 de outubro, Terence Tao lançou um [desafio experimental de matemática colaborativa com IA](https://terrytao.wordpress.com/2026/10/20/an-experimental-ai-math-challenge-using-tenth-discriminant-bounds-to-explore-arguments-ruling-out-siegel-zeroes/). A proposta era usar diferentes ferramentas para obter limites explícitos para um hipotético décimo discriminante a partir de argumentos sobre zeros de Landau–Siegel.

O aspecto mais interessante não era apenas otimizar uma constante. O projeto permitiu comparar modelos, estratégias de decomposição, níveis de interação humana e métodos de verificação em um ambiente público. As contribuições deveriam declarar as ferramentas utilizadas, citar as ideias anteriores e priorizar argumentos verificáveis e compreensíveis.

Esse modelo aponta para uma alternativa à produção fechada de milhares de resultados, com **colaborações abertas nas quais seres humanos escolhem a pergunta, acompanham o desenvolvimento das ideias, comparam abordagens e transformam respostas de modelos em conhecimento compartilhado**. É talvez uma das experiências mais próximas de um “Polymath para a era da IA”.

### 9. Três novas alegações extraordinárias da OpenAI

Em 26 de outubro, a OpenAI anunciou [três novos resultados em matemática, ciência da computação e física](https://openai.com/index/building-scientific-understanding-with-academic-communities/).

- Uma prova da conjectura de *local smoothing* em todas as dimensões, que implicaria as conjecturas de Kakeya e de restrição de Stein.
- Uma refutação da Hipótese do Tempo Exponencial (ETH), conjectura central em complexidade computacional.
- Uma construção rigorosa de teorias quânticas de campos em quatro dimensões, incluindo QCD, uma extensão do Modelo Padrão e, como subproblema, a existência da teoria pura de Yang–Mills.

Para os resultados de *local smoothing* e ETH, a empresa publicou textos em linguagem natural e formalizações em Lean. Grupos de especialistas estão sendo formados para verificar, explicar e contextualizar os resultados. No caso de Yang–Mills e QCD, a OpenAI informou que as demonstrações em linguagem natural foram produzidas em setembro e que a formalização de Yang–Mills terminou em 16 de outubro, mas os materiais ainda não haviam sido divulgados publicamente até o fechamento deste resumo.

O AGMAI então publicou uma [recomendação de liberação imediata dos materiais de Yang–Mills](https://agmai.org/), argumentando que a compreensão deve se desenvolver abertamente e com acesso igual. O episódio expõe uma tensão fundamental. Especialistas escolhidos antecipadamente podem melhorar a primeira apresentação, mas também recebem uma vantagem científica sobre o restante da comunidade e podem ser percebidos como validadores involuntários do anúncio empresarial.

**Classificação.** Alegações extraordinárias com diferentes níveis de material público. Todas ainda exigem exame independente e assimilação pela comunidade.
{: .post-note}

### 10. A formalização da “prova enorme”

Também em 26 de outubro, a Axiom anunciou ter concluído a [primeira formalização integral, em Lean, da classificação dos grupos simples finitos](https://axiommath.ai/research/the-enormous-theorem-formalized/). A demonstração original ocupa aproximadamente 15 mil páginas distribuídas em mais de 500 artigos e envolveu cerca de cem matemáticos. Segundo a empresa, dezenas de agentes coordenados produziram cerca de **43,1 milhões de linhas de código em 24 dias**.

O projeto teria identificado 34 desvios relevantes em relação à literatura publicada, a maioria pequena, mas alguns exigindo trabalho matemático real. O caso mais importante envolveu o *Unbalanced Group Theorem*. Colin Defant e Ken Ono publicaram então um [preprint explicando uma rota alternativa](https://hexagonmath.org/2610.00575v1), após a descoberta de contraexemplos a uma afirmação de fechamento utilizada em uma das demonstrações existentes.

Esse episódio ilustra um uso particularmente promissor da IA, que não se limita a atacar conjecturas famosas e ajuda a **preservar, auditar e reorganizar grandes construções matemáticas existentes**. Ainda assim, o tamanho do artefato torna indispensável uma reprodução independente do ambiente, do processo de compilação, das hipóteses e da ligação entre o mapa conceitual da prova e os milhões de linhas formais.

**Classificação.** Formalização e código publicados pela Axiom, com verificação externa e avaliação matemática ainda em andamento.
{: .post-note}

### 11. Um preprint de humano e IA sobre uma conjectura de Serre

Em 28 de outubro, Mark Kisin publicou o preprint [*Serre’s conjecture on the Artin character for a regular local ring*](https://hexagonmath.org/2610.00597v1). O artigo afirma provar, no caso de característica mista, uma conjectura de Serre de 1960, usando deformações equivariantes e resultados recentes sobre a fórmula do condutor torcido.

A declaração de proveniência é especialmente relevante. Kisin informa que o GPT Astra foi usado extensivamente tanto para chegar às demonstrações quanto para produzir uma primeira versão do manuscrito, seguida por trabalho humano substancial de verificação, refinamento e exposição. Diferentemente de um grande lote anônimo produzido por um laboratório, o preprint tem um matemático que declara compreender todas as partes e assume responsabilidade pelo texto.

Esse pode ser um modelo importante de colaboração. A IA participa de forma material da descoberta, mas há autoria humana, transparência sobre o processo e compromisso com a literatura e a comunicação matemática. O trabalho, entretanto, continua sendo um preprint e ainda precisa de revisão independente.

**Classificação.** Preprint de humano e IA, com proveniência declarada e compreensão humana integral, ainda sem revisão independente conclusiva.
{: .post-note}

## O que realmente mudou nesses dois meses?

### 1. A produção deixou de ser o único gargalo

Durante séculos, novas provas foram um recurso escasso. Agora começamos a enfrentar o problema oposto, uma possível abundância de textos matemáticos maior do que a capacidade humana de leitura. A atenção de especialistas, a verificação e a exposição podem se tornar os recursos mais escassos.

### 2. A formalização tornou-se central, mas não suficiente

Lean e outros assistentes de prova serão fundamentais para lidar com essa escala. Eles conseguem verificar cadeias lógicas muito maiores do que qualquer pessoa poderia conferir linha por linha. Mas três tarefas diferentes precisam permanecer separadas.

- Verificar que o código prova um enunciado formal.
- Verificar que o enunciado formal corresponde à afirmação matemática anunciada.
- Compreender por que a prova funciona e quais ideias podem ser reutilizadas.

A primeira pode ser mecanizada. A segunda ainda exige uma cuidadosa auditoria semântica. A terceira é parte essencial da atividade matemática humana.

### 3. Autoria e proveniência tornaram-se parte do conteúdo científico

Não basta publicar um PDF final. Precisamos saber qual modelo foi usado, quais prompts foram fornecidos, quantas tentativas falharam, qual foi a participação humana, quais fontes entraram no contexto e como as versões evoluíram. Sem essa informação, é difícil avaliar novidade, prioridade, reprodutibilidade e possíveis influências de trabalhos ainda não publicados.

### 4. O acesso à computação pode redefinir a geografia da matemática

Os resultados do First Proof e as campanhas com milhares de agentes mostram que mais computação pode produzir um salto real de desempenho. Se apenas algumas empresas e universidades tiverem acesso a esses sistemas, a matemática pode adquirir uma estrutura ainda mais desigual, em que alguns grupos formulam perguntas e recebem respostas de modelos de fronteira, enquanto outros ficam encarregados de verificar gratuitamente resultados escolhidos em outro lugar.

### 5. A comunidade começou a construir respostas institucionais

Declarações, grupos consultivos, repositórios de revisão, blogs coletivos, desafios abertos e financiamento para workshops surgiram em poucas semanas. Isso é positivo, mas ainda inicial. As normas estabelecidas agora poderão determinar quem escolhe as perguntas, quem recebe reconhecimento e quais comunidades terão voz na matemática assistida por IA.

## O que isso significa para a América Latina?

Para a MathIA AmLat, a principal conclusão não deve ser que precisamos apenas acompanhar o que OpenAI, Anthropic, Axiom ou outros laboratórios anunciam. Precisamos criar condições para que matemáticos latino-americanos **formulem perguntas, conduzam experimentos, auditem resultados e participem da construção das normas**. Algumas prioridades concretas seguem abaixo.

1. **Formar grupos de leitura e verificação.** Escolher poucos resultados relevantes, reunir especialistas da área e produzir relatórios claros sobre o que foi verificado, o que permanece incerto e quais ideias parecem novas.
2. **Investir em formalização.** Cursos e grupos de trabalho em Lean podem criar uma capacidade regional duradoura, útil tanto para auditar provas geradas por IA quanto para formalizar matemática produzida localmente.
3. **Defender acesso equitativo.** Universidades, sociedades matemáticas e agências de fomento podem negociar créditos, infraestrutura compartilhada e acordos regionais de computação.
4. **Criar uma agenda própria de problemas.** A região não deve depender apenas das listas escolhidas por laboratórios. Podemos identificar problemas importantes para nossas comunidades e áreas de tradição local, respeitando a prioridade e a vontade dos pesquisadores envolvidos.
5. **Adotar normas de transparência.** Trabalhos assistidos por IA devem declarar ferramentas, versões, prompts relevantes, nível de intervenção humana, métodos de verificação e limitações conhecidas.
6. **Produzir exposição em português e espanhol.** Se a compreensão ficar restrita a textos técnicos em inglês ou a plataformas fechadas, a desigualdade se aprofundará. Tradução, seminários e materiais didáticos são parte da infraestrutura científica.
7. **Discutir ética, autoria e formação.** Precisamos pensar desde já em políticas para estudantes, teses, artigos, pareceres, prioridade de resultados e uso de materiais confidenciais.

## Uma possível agenda para a MathIA AmLat

Como comunidade, poderíamos transformar esse momento em ações regulares.

- Manter um **radar de IA e matemática**, separando claramente resultados publicados, preprints, anúncios verificáveis e rumores.
- Realizar um **seminário mensal de verificação**, dedicado a um único resultado ou ferramenta.
- Criar um **registro latino-americano de projetos e problemas**, no qual pesquisadores possam buscar colaboradores sem necessariamente expor detalhes confidenciais.
- Organizar grupos introdutórios de **Lean, agentes matemáticos e boas práticas de uso de modelos**.
- Elaborar uma recomendação comunitária sobre **divulgação de uso de IA em artigos e teses**.
- Buscar parcerias para oferecer **créditos computacionais e acesso a modelos** a pesquisadores e estudantes da região.
- Promover um encontro sobre **IA, compreensão e futuro da pesquisa matemática na América Latina**.

## Conclusão

Setembro e outubro de 2026 provavelmente serão lembrados como o período em que a matemática entrou de forma inequívoca na era da produção automatizada em grande escala. Mas os acontecimentos também mostraram que produzir uma sequência formalmente verificável não encerra o trabalho matemático.

Ainda precisamos escolher perguntas importantes, reconhecer ideias anteriores, verificar a correspondência entre texto e formalização, encontrar explicações melhores, formar novos pesquisadores e decidir coletivamente quais valores queremos preservar. A IA pode acelerar enormemente a matemática, mas a direção desse movimento não deveria ser escolhida apenas pelos laboratórios que controlam os modelos mais poderosos.

Para a América Latina, este é um momento de risco e de oportunidade. Podemos permanecer como espectadores e revisores tardios de uma agenda definida em outros lugares, ou podemos construir capacidade técnica, redes de colaboração e uma voz própria. A MathIA AmLat existe precisamente para ajudar a tornar a segunda possibilidade real.

A MathIA AmLat é o nosso canal no Zulip, onde matemáticos latino-americanos discutem e acompanham as novidades sobre IA e matemática. Para participar, [peça um convite]({{ convite | strip }}).
{: .post-note}

## Fontes principais

- Anthropic, [Formalizing Fermat’s Last Theorem](https://www.anthropic.com/research/formalizing-fermats-last-theorem)
- OpenAI, [On the Navier–Stokes Millennium Prize Problem](https://openai.com/index/navier-stokes-solution/)
- [Navier–Stokes lost in translation](https://arxiv.org/abs/2610.08144)
- [A Severe Misalignment of AI in Mathematics](https://mathandai.org/)
- AGMAI, [Responsible Release of AI-Generated Mathematics](https://agmai.org/general-sep29/)
- OpenAI, [Sharing AI Progress in Mathematics](https://openai.com/index/sharing-ai-progress-in-mathematics/)
- [Repositório OpenAI Math](https://github.com/openai/math)
- [First Proof, Third Batch](https://1stproof.org/third-batch.html)
- [ProofForum](https://www.proofforum.org/)
- [Proofs and Prompts](https://proofsandprompts.com/)
- Terence Tao, [Experimental AI-math challenge](https://terrytao.wordpress.com/2026/10/20/an-experimental-ai-math-challenge-using-tenth-discriminant-bounds-to-explore-arguments-ruling-out-siegel-zeroes/)
- OpenAI, [Working with academic communities to build scientific understanding](https://openai.com/index/building-scientific-understanding-with-academic-communities/)
- Axiom, [Formalizing the Enormous Theorem](https://axiommath.ai/research/the-enormous-theorem-formalized/)
- Defant e Ono, [The Unbalanced Group Theorem](https://hexagonmath.org/2610.00575v1)
- Kisin, [Serre’s conjecture on the Artin character for a regular local ring](https://hexagonmath.org/2610.00597v1)
