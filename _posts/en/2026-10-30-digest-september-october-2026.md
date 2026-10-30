---
title: "From producing proofs to a crisis of verification"
description: "Digest of September and October 2026 on AI and mathematics. In two months the discussion changed scale, and the question became how to verify, understand and credit results produced by models."
news: "Digest of September and October 2026, from producing proofs to a crisis of verification."
kind: digest
key: resumo-2026-09-10
date: 2026-10-30 09:00:00 -0300
---
{%- capture invite -%}{% include invite-href.html %}{%- endcapture -%}

In just two months, the discussion about artificial intelligence in mathematics changed scale. In early September it was still possible to treat each result as an isolated episode, whether an impressive formalisation, a possible solution to a famous problem or a controversy over authorship. By the end of October there were hundreds of model-generated manuscripts, formal proofs tens of millions of lines long, multi-agent systems solving most of the problems in controlled evaluations, and new structures being built for review, attribution and governance.

The central question is no longer simply **“can AI solve hard mathematical problems?”**. The questions are now broader. **How do we verify results produced at this scale? How do we turn them into mathematical understanding? Who gets credit? Who chooses the problems? Who has access to the models and to computing? And how do we make sure that communities outside the major technology hubs take part as protagonists?**

## Overview of the period

| Date | Event | Status on 30/10/2026 |
|---|---|---|
| 4 September | Claude formalises Fermat’s Last Theorem | Formalisation of a known result, with published code and initial review |
| 8 September | OpenAI announces a solution to Navier–Stokes | Claim published and formalised, but still disputed and without independent consensus |
| 11 September | Publication of *A Severe Misalignment of AI in Mathematics* | Manifesto on understanding, authorship and professional impact |
| 21 to 29 September | AGMAI is created and publishes recommendations | First structured institutional response on responsible release |
| 6 October | OpenAI releases hundreds of mathematical manuscripts | Public collection at different stages of verification |
| 14 October | Third round of First Proof | Controlled evaluation shows strong performance and persistent problems of exposition and citation |
| 20 October | Terence Tao launches a collaborative challenge with AI | Open experiment on Polymath-style mathematics in the age of AI |
| 26 October | OpenAI announces results on Kakeya, ETH and quantum field theory | Extraordinary claims still under human assessment |
| 26 and 27 October | Axiom announces the formalisation of the classification of finite simple groups | Code published, with independent auditing and reproduction still essential |
| 28 October | Mark Kisin posts a preprint on a conjecture of Serre | Human and AI work with extensive use of GPT Astra, not yet independently reviewed |

## September and the initial shock

### 1. Claude formalises Fermat’s Last Theorem

On 4 September, Anthropic announced the [first complete computer-verified proof of Fermat’s Last Theorem](https://www.anthropic.com/research/formalizing-fermats-last-theorem). According to the company, Claude worked largely autonomously for 11 days, produced about **13 million lines of Lean** and proved roughly **29,500 intermediate theorems** used in the final version.

It is important to understand the nature of this achievement correctly. Claude did not find a new mathematical proof of the theorem. The system formalised, in Lean, a route based on Wiles’s proof and later developments. The novelty lies in **autoformalisation at scale**, that is, in the ability to turn an enormous chain of human arguments into an object that a proof checker can verify step by step.

This result made plausible something that, until recently, looked like a project of many years, formalising large parts of the mathematical literature with the help of AI. It may make it easier to detect gaps, reduce part of the mechanical work of verification and create a more reliable foundation for new proofs. At the same time, the 13 million lines show that automatic verifiability does not necessarily produce an exposition that a human being can read or understand.

**Classification.** Published formalisation of a known theorem. It is not a new conceptual proof of Fermat’s Last Theorem.
{: .post-note}

### 2. The Navier–Stokes announcement and its aftermath

Four days later, OpenAI announced that an internal system had produced a [possible solution to the Navier–Stokes existence and smoothness problem](https://openai.com/index/navier-stokes-solution/), exhibiting a finite-time singularity for the three-dimensional incompressible equations with a smooth external force. The company said that about **10,000 agents** worked simultaneously. The solution was reportedly found in about 88 hours, followed by another 17 hours of formalisation and verification in Lean. Across all the problems attempted in that campaign, about 300 billion output tokens were used.

The announcement had an enormous impact, but it did not close the problem. In October, an [audit of the correspondence between the text and the formalisation](https://arxiv.org/abs/2610.08144) argued that the Lean proof is not a semantically faithful representation of the proof given in natural language. This point is crucial. The Lean kernel can verify perfectly that a conclusion follows from certain formal definitions and hypotheses, but it does not automatically check whether those definitions express exactly the mathematical problem the authors say they have solved.

This does not by itself mean that the whole mathematical idea is wrong. It means that **“the file compiles in Lean” cannot be used as a synonym for “the announced claim has been definitively established”**. The community still needs to audit the modelling, the correspondence between the two texts, the relevance of the lemmas and the mathematical content of the construction.

The episode also raised questions about priority, access to unpublished work, attribution and the relationship between AI labs and the researchers who use their products. Navier–Stokes thus became at once a possible major breakthrough and a case study in how results of this kind should not be communicated without clear protocols.

**Classification.** Verifiable announcement, with public text and formalisation, but still disputed and without consensual independent validation.
{: .post-note}

### 3. The community’s reaction and the value of understanding

On 11 September, a broad group of Fields medallists published the statement [*A Severe Misalignment of AI in Mathematics*](https://mathandai.org/). The text does not deny the potential of AI, but it criticises the use of open problems as mere benchmarks to promote models. Its central argument is that the goal of mathematics is not only to sort statements into true and false, but to build concepts, methods, explanations, intuition and a community able to pass this knowledge on.

The statement warned that the accelerated production of solutions may destroy the very intellectual environment that makes new advances possible. It also drew attention to questions of citation, authorship and training. If models deliver results without a human chain of understanding, how will new generations learn to formulate questions and recognise important ideas?

This reaction marked a shift in the debate. The divide was no longer simply between people “for” or “against” AI. The discussion turned to **which uses preserve and extend human understanding, which incentives are harmful and which institutions need to be built**.

### 4. The birth of a governance agenda

On 21 September, OpenAI reported that its internal model had solved [more than a hundred open problems](https://openai.com/index/advisory-group-on-mathematics-and-ai/) and announced the creation of an independent advisory group. A few days later, the **Advisory Group on Mathematics and Artificial Intelligence (AGMAI)**, based at the Institute for Advanced Study, began publishing its own positions.

The [recommendations of 29 September](https://agmai.org/general-sep29/) were based on more than 600 responses from the community. The main proposals were the following.

- Release relevant results quickly in independent academic repositories, with versions and persistent identifiers.
- Report the model used, the prompts, the number of attempts, the time, the computational cost and the relevant failures.
- Improve citations and exposition before publication.
- Formalise proofs whenever possible and document clearly what was and was not formalised.
- Explain how the problems were chosen and how many comparable problems were attempted without success.
- Fund reading groups, workshops, schools and expository texts to turn raw output into human understanding.
- Ensure broad and equitable access to the models, avoiding a mathematics divided between institutions with and without computing resources.

AGMAI also asked labs to stop using advanced mathematical problems as private tests of proprietary models that the community cannot access. The concern is not only with how results are released afterwards, but also with the possibility that private companies will decide on their own which parts of mathematics receive an extraordinary amount of computing.

## October, when the scarcity of proofs became a scarcity of attention

### 5. OpenAI’s mass release

On 6 October, OpenAI opened a collection initially made up of **722 manuscripts, organised into 372 families of results**, produced by an internal model. The [public repository](https://github.com/openai/math) contains texts, supporting material and formalisations for part of the results. After revisions and removals, the catalogue listed 719 manuscripts at the end of the month.

The repository itself stresses that the works are at **different stages of verification**, that not all of them have a Lean formalisation and that unformalised results may contain problems. The numbers should therefore not be read as “372 new theorems definitively established”. This is a large collection of claims and research artefacts that the community still has to classify, reproduce, correct, understand and relate to the existing literature.

Scale, however, changes the nature of the problem. The traditional review system was built for a relatively limited flow of papers, each tied to human authors able to defend the text. Hundreds of manuscripts produced in a few weeks create an asymmetry. **Generating may take hours, while verifying, contextualising and explaining may take specialists months.**

On 15 October, OpenAI announced a **US$ 5 million contribution to the Simons Foundation** to support conferences, workshops and programmes devoted to examining these results, as well as access to models and computing for supported researchers. It is a meaningful step, although the question remains of who sets the agenda and how to distribute these resources in a globally fair way.

**Classification.** Public collection of claimed results, with varying levels of formalisation, correctness and human understanding.
{: .post-note}

### 6. First Proof and performance on unseen problems

The third round of the [First Proof Project](https://1stproof.org/third-batch.html), released on 14 October, offers more controlled evidence of how far the systems have come. Ten real research problems, already solved by mathematicians but without public solutions, were given to the models for 24 hours with no human intervention.

The multi-agent system **ProofCouncil** correctly solved 9 of the 10 problems, and a direct query to **GPT‑6 Astra** solved 7. Each of the ten problems was solved by at least one system, setting aside difficulties with citation and exposition. But the numbers also show the current limits.

- Only 4 of the 10 GPT‑6 Astra answers received an adequate assessment of their citations.
- ProofCouncil raised this number to 7, but still received negative assessments of exposition on some answers.
- ProofCouncil cost about **US$ 1,888**, against roughly **US$ 36** for the direct query to Astra.
- The open-weights system lagged far behind the frontier models.

The result confirms two trends. First, combining agents, models, tools and verifiers substantially improves performance. Second, top performance may depend on an amount of computing that universities, small groups and less-resourced countries cannot sustain. Unequal access is not an abstract concern for the future, since it already shows up in the benchmarks.

### 7. New infrastructure for review and debate

October was also the month in which institutions began to appear whose aim is not to produce more proofs, but to organise what is already being produced. [ProofForum](https://www.proofforum.org/) was launched as an open repository for mathematical work produced with AI and submitted to human review, recording versions and provenance and separating automated assessments, signed human reports and community consensus.

The collective blog [Proofs and Prompts](https://proofsandprompts.com/) began gathering practical accounts, critiques, proposed norms, students’ experiences and reflections on authorship, education and the future of the profession. These spaces matter because the community’s response cannot be confined to the labs’ own communication channels.

The task now is to build an infrastructure in which, for each piece of work, it is possible to answer the questions below.

1. What exactly is the claim?
2. Is the text mathematically correct?
3. Does the formalisation match the text?
4. What is genuinely new?
5. Which ideas already existed and need to be cited?
6. Who understands the argument and takes responsibility for it?
7. Which versions were corrected or withdrawn?

### 8. Terence Tao proposes a Polymath-style experiment

On 20 October, Terence Tao launched an [experimental challenge in collaborative mathematics with AI](https://terrytao.wordpress.com/2026/10/20/an-experimental-ai-math-challenge-using-tenth-discriminant-bounds-to-explore-arguments-ruling-out-siegel-zeroes/). The idea was to use different tools to obtain explicit bounds for a hypothetical tenth discriminant from arguments about Landau–Siegel zeros.

The most interesting aspect was not just optimising a constant. The project made it possible to compare models, decomposition strategies, levels of human interaction and verification methods in a public setting. Contributions were expected to declare the tools used, cite earlier ideas and favour arguments that are verifiable and understandable.

This model points to an alternative to the closed production of thousands of results, with **open collaborations in which human beings choose the question, follow the development of the ideas, compare approaches and turn model outputs into shared knowledge**. It is perhaps one of the experiments closest to a “Polymath for the age of AI”.

### 9. Three new extraordinary claims from OpenAI

On 26 October, OpenAI announced [three new results in mathematics, computer science and physics](https://openai.com/index/building-scientific-understanding-with-academic-communities/).

- A proof of the *local smoothing* conjecture in all dimensions, which would imply the Kakeya and Stein restriction conjectures.
- A refutation of the Exponential Time Hypothesis (ETH), a central conjecture in computational complexity.
- A rigorous construction of four-dimensional quantum field theories, including QCD, an extension of the Standard Model and, as a subproblem, the existence of pure Yang–Mills theory.

For the *local smoothing* and ETH results, the company published natural-language texts and Lean formalisations. Groups of experts are being formed to verify, explain and contextualise the results. For Yang–Mills and QCD, OpenAI said that the natural-language proofs were produced in September and that the Yang–Mills formalisation was completed on 16 October, but the materials had not been made public by the time this digest was finished.

AGMAI then published a [recommendation for the immediate release of the Yang–Mills materials](https://agmai.org/), arguing that understanding should develop openly and with equal access. The episode exposes a fundamental tension. Experts chosen in advance can improve the first presentation, but they also gain a scientific advantage over the rest of the community and may be seen as unwitting validators of a corporate announcement.

**Classification.** Extraordinary claims with different levels of public material. All of them still require independent examination and absorption by the community.
{: .post-note}

### 10. Formalising the “enormous proof”

Also on 26 October, Axiom announced that it had completed the [first complete formalisation, in Lean, of the classification of finite simple groups](https://axiommath.ai/research/the-enormous-theorem-formalized/). The original proof runs to about 15,000 pages spread over more than 500 papers and involved around a hundred mathematicians. According to the company, dozens of coordinated agents produced about **43.1 million lines of code in 24 days**.

The project reportedly identified 34 relevant deviations from the published literature, most of them small, but some requiring real mathematical work. The most important case involved the *Unbalanced Group Theorem*. Colin Defant and Ken Ono then posted a [preprint explaining an alternative route](https://hexagonmath.org/2610.00575v1), after counterexamples were found to a closure claim used in one of the existing proofs.

This episode illustrates a particularly promising use of AI, which goes beyond attacking famous conjectures and helps to **preserve, audit and reorganise large existing mathematical constructions**. Even so, the size of the artefact makes independent reproduction indispensable, covering the environment, the compilation process, the hypotheses and the link between the conceptual map of the proof and the millions of formal lines.

**Classification.** Formalisation and code published by Axiom, with external verification and mathematical assessment still under way.
{: .post-note}

### 11. A human and AI preprint on a conjecture of Serre

On 28 October, Mark Kisin posted the preprint [*Serre’s conjecture on the Artin character for a regular local ring*](https://hexagonmath.org/2610.00597v1). The paper claims to prove, in the mixed characteristic case, a 1960 conjecture of Serre, using equivariant deformations and recent results on the twisted conductor formula.

The provenance statement is especially relevant. Kisin reports that GPT Astra was used extensively both to arrive at the proofs and to produce a first draft of the manuscript, followed by substantial human work of verification, refinement and exposition. Unlike a large anonymous batch produced by a lab, the preprint has a mathematician who states that he understands every part and takes responsibility for the text.

This may be an important model of collaboration. AI takes a material part in the discovery, but there is human authorship, transparency about the process and a commitment to the literature and to mathematical communication. The work, however, is still a preprint and still needs independent review.

**Classification.** Human and AI preprint, with declared provenance and full human understanding, not yet conclusively reviewed by independent experts.
{: .post-note}

## What really changed in these two months?

### 1. Production is no longer the only bottleneck

For centuries, new proofs were a scarce resource. Now we are beginning to face the opposite problem, a possible abundance of mathematical texts greater than the human capacity to read them. Expert attention, verification and exposition may become the scarcest resources.

### 2. Formalisation has become central, but it is not enough

Lean and other proof assistants will be essential for dealing with this scale. They can verify logical chains far longer than anyone could check line by line. But three different tasks must remain separate.

- Verifying that the code proves a formal statement.
- Verifying that the formal statement corresponds to the announced mathematical claim.
- Understanding why the proof works and which ideas can be reused.

The first can be mechanised. The second still requires careful semantic auditing. The third is an essential part of human mathematical activity.

### 3. Authorship and provenance have become part of the scientific content

Publishing a final PDF is not enough. We need to know which model was used, which prompts were given, how many attempts failed, what the human contribution was, which sources entered the context and how the versions evolved. Without this information, it is hard to assess novelty, priority, reproducibility and possible influences from unpublished work.

### 4. Access to computing may redraw the geography of mathematics

The First Proof results and the campaigns with thousands of agents show that more computing can produce a real leap in performance. If only a few companies and universities have access to these systems, mathematics may take on an even more unequal structure, in which some groups formulate questions and receive answers from frontier models, while others are left to verify, for free, results chosen elsewhere.

### 5. The community has begun to build institutional responses

Statements, advisory groups, review repositories, collective blogs, open challenges and funding for workshops appeared within a few weeks. This is positive, but still at an early stage. The norms set now may determine who chooses the questions, who receives recognition and which communities have a voice in AI-assisted mathematics.

## What does this mean for Latin America?

For MathIA AmLat, the main conclusion should not be that we merely need to follow what OpenAI, Anthropic, Axiom or other labs announce. We need to create the conditions for Latin American mathematicians to **formulate questions, run experiments, audit results and take part in shaping the norms**. Some concrete priorities follow.

1. **Form reading and verification groups.** Choose a few relevant results, bring together specialists in the area and produce clear reports on what was verified, what remains uncertain and which ideas seem new.
2. **Invest in formalisation.** Courses and working groups in Lean can build lasting regional capacity, useful both for auditing AI-generated proofs and for formalising mathematics produced locally.
3. **Advocate for equitable access.** Universities, mathematical societies and funding agencies can negotiate credits, shared infrastructure and regional computing agreements.
4. **Build our own agenda of problems.** The region should not depend only on lists chosen by labs. We can identify problems that matter to our communities and to areas of local tradition, respecting the priority and wishes of the researchers involved.
5. **Adopt transparency norms.** AI-assisted work should declare tools, versions, relevant prompts, the level of human intervention, verification methods and known limitations.
6. **Produce exposition in Portuguese and Spanish.** If understanding remains confined to technical texts in English or to closed platforms, inequality will deepen. Translation, seminars and teaching materials are part of the scientific infrastructure.
7. **Discuss ethics, authorship and training.** We need to start thinking now about policies for students, theses, papers, referee reports, priority of results and the use of confidential material.

## A possible agenda for MathIA AmLat

As a community, we could turn this moment into regular actions.

- Keep an **AI and mathematics radar**, clearly separating published results, preprints, verifiable announcements and rumours.
- Hold a **monthly verification seminar**, devoted to a single result or tool.
- Create a **Latin American register of projects and problems**, where researchers can look for collaborators without necessarily disclosing confidential details.
- Organise introductory groups on **Lean, mathematical agents and good practice in using models**.
- Draft a community recommendation on **disclosing the use of AI in papers and theses**.
- Seek partnerships to offer **computing credits and access to models** to researchers and students in the region.
- Hold a meeting on **AI, understanding and the future of mathematical research in Latin America**.

## Conclusion

September and October 2026 will probably be remembered as the period in which mathematics unmistakably entered the era of large-scale automated production. But these events also showed that producing a formally verifiable sequence does not end mathematical work.

We still need to choose important questions, acknowledge earlier ideas, check the correspondence between text and formalisation, find better explanations, train new researchers and decide together which values we want to preserve. AI can accelerate mathematics enormously, but the direction of this movement should not be chosen only by the labs that control the most powerful models.

For Latin America, this is a moment of both risk and opportunity. We can remain spectators and late reviewers of an agenda set elsewhere, or we can build technical capacity, collaborative networks and a voice of our own. MathIA AmLat exists precisely to help make the second possibility real.

MathIA AmLat is our channel on Zulip, where Latin American mathematicians discuss and follow news on AI and mathematics. To join, [ask for an invitation]({{ invite | strip }}).
{: .post-note}

## Main sources

- Anthropic, [Formalizing Fermat’s Last Theorem](https://www.anthropic.com/research/formalizing-fermats-last-theorem)
- OpenAI, [On the Navier–Stokes Millennium Prize Problem](https://openai.com/index/navier-stokes-solution/)
- [Navier–Stokes lost in translation](https://arxiv.org/abs/2610.08144)
- [A Severe Misalignment of AI in Mathematics](https://mathandai.org/)
- AGMAI, [Responsible Release of AI-Generated Mathematics](https://agmai.org/general-sep29/)
- OpenAI, [Sharing AI Progress in Mathematics](https://openai.com/index/sharing-ai-progress-in-mathematics/)
- [OpenAI Math repository](https://github.com/openai/math)
- [First Proof, Third Batch](https://1stproof.org/third-batch.html)
- [ProofForum](https://www.proofforum.org/)
- [Proofs and Prompts](https://proofsandprompts.com/)
- Terence Tao, [Experimental AI-math challenge](https://terrytao.wordpress.com/2026/10/20/an-experimental-ai-math-challenge-using-tenth-discriminant-bounds-to-explore-arguments-ruling-out-siegel-zeroes/)
- OpenAI, [Working with academic communities to build scientific understanding](https://openai.com/index/building-scientific-understanding-with-academic-communities/)
- Axiom, [Formalizing the Enormous Theorem](https://axiommath.ai/research/the-enormous-theorem-formalized/)
- Defant and Ono, [The Unbalanced Group Theorem](https://hexagonmath.org/2610.00575v1)
- Kisin, [Serre’s conjecture on the Artin character for a regular local ring](https://hexagonmath.org/2610.00597v1)
