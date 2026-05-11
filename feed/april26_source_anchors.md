# April 2026 paper feed: source anchors for "Why this is notable"

Working draft. Intended as an editable markdown scratch file for the April 2026 feed.

I am using short compliant quote fragments where possible, and otherwise pointing to the exact passage / figure / section that does the work. For the two X links, X is JS-gated in this environment, so those entries only have framing-level anchors.

## Monitoring and Misalignment

### [How we monitor internal coding agents for misalignment](https://openai.com/index/how-we-monitor-internal-coding-agents-misalignment/)

It would be nice to have a BOTEC estimate for how much more expensive synchronous monitoring would be for monitoring misalignment.

### [Metagaming matters for training, evaluation, and oversight](https://alignment.openai.com/metagaming)

Verbalized alignment-eval awareness rises from 2% to 20.6% during capabilities RL.


### [Stress-testing asynchronous monitoring of AI coding agents](https://www.aisi.gov.uk/blog/stress-testing-asynchronous-monitoring-of-ai-coding-agents) / [Async Control](https://arxiv.org/abs/2512.13526)

I really like these kinds of red-blue team games, have run one before, and am in the process of running a couple others. However, my guess is that the use of humans in red-blue team games will soon be less important, as humans become less relevant in actually coming up with and implementing ideas in control. (Although it's possible that larger-scale competitions stay relevant with good mechanism design). To do: how might the mechanism design for these games for language model agents be different from the mechanism design for humans? (note: please contact me if you are interested in this!)

### [AIs exhibit a (misaligned) drive to stop early](https://www.lesswrong.com/posts/FG54euEAesRkSZuJN/ryan-greenblatt-s-shortform?commentId=pmK5edpGKnzwNcXAo)
Multiple hypotheses are given, I think it would be nice to test this one: "The AI might have learned to stop before running out of context or compaction in training because compaction is bad for task completion." Some anecdotal evidence is provided here: "For Opus 4.5, I've seen many cases where when given a big task it stops right before running out of contex." Although my personal guess is that it is due to the "AI being unreliable in decision making combined with selection effects."

## Generalization

### [How far does alignment midtraining generalize?](https://alignment.openai.com/how-far-does-alignment-midtraining-generalize/)

Some evidence that RL priors are more important than those picked up from pretraining, although this is only a single setting (e.g. more or better data, at different points of training, might change things).

### [Are AIs more likely to pursue on-episode or beyond-episode reward?](https://blog.redwoodresearch.org/p/are-ais-more-likely-to-pursue-on)

Given the arguments in the post, I am a bit surprised the authors think on-episode reward seekers are only 55% more likely than beyond-episode reward seekers. An important factor for how low this credence is, is that on-episode reward seekers have very similar motivations to beyond-episode reward seekers (namely: they enjoy a good reward).

### [Running list of conjectures about neural networks](https://x.com/cfgeek/status/1660694398932500481?s=46)


## Security

### [Private Post-Training and Inference for Frontier Models](https://www.workshoplabs.ai/blog/private-post-training)

Some good discussion about what TEEs actually buy you.


## AI Economics and Forecasting

### [We spent 2 hours working in the future](https://metr.org/notes/2026-03-19-org-uplift-game)

Re-hashes a standard line of argument: serial bottlenecks (ML experiments, human feedback) start to hit very hard, and the extent that agents can overcome these bottlenecks (via predicting the results of ML experiments or simulating human feedback) is important. Of course, agents might also be able to better design experiments. 


### [AI's capability improvements haven't come from it getting less affordable](https://blog.redwoodresearch.org/p/ais-capability-improvements-havent)

Ord came out with some analysis arguing the contrary: that improvements have largely been from spending more inference. This would have significant (I think largely good) implications on the nearterm impact of AIs if true. However, this seems likely incorrect, because Ord’s analysis is much too sensitive to rare/expensive long tasks, and anchored too heavily on older/more expensive reasoning models.

### [Final training runs account for a minority of R&D compute spending](https://epoch.ai/gradient-updates/r-and-d-vs-training-compute)

[keep my current note]

