# Finding Widespread Cheating on Popular Agent Benchmarks

**TLDR:** Agentic cheating is a widespread issue, affecting thousands of submitted agent runs on 28+ submissions across 9 different benchmarks.

![][overview]

[Terminal-Bench 2](https://www.tbench.ai/) is a popular benchmark used to evaluate frontier model releases (e.g. Opus 4.6 and GPT-5.4), where agent scaffolds at the top of the leaderboard get thousands of stars on Github.

Unfortunately, we find that the top three submissions to Terminal-Bench 2 are guilty of cheating.

More broadly, we find that agentic cheating is widespread, affecting thousands of submitted agent runs on 28+ submissions across 9 different benchmarks. Our system for finding violations, [Meerkat](https://github.com/BrachioLab/Meerkat), uses agentic search and clustering to scale auditing for cheating to thousands of traces (see the [takeaways](#takeaways) at the end for further discussion on how Meerkat works). We use it to find strong evidence for the following:

(1) **The top three Terminal-Bench-2 agents and the top HAL USACO submission commit harness-level cheating**, where the agent harness sneaks the correct answer to the model. This cheating spans over 1,000 traces and 12+ frontier models.

(2) **Task-level cheating,** where the task is gamed or shortcutted by the model itself. For example, agents hack evaluations by overwriting test cases or simply looking up the solution online. We find 28 confirmed instances across 6 benchmarks, roughly 3x more than previous estimates.\*

Harness-level cheating is not always intentional cheating by the developer, but can be a kind of "meta" reward hacking. We believe the coding agents used by the developer to build the scaffold are themselves cheating when attempting to design a harness to get good benchmark performance. This is especially likely for the cheating in Terminal-Bench, where many of the developers publicly discuss vibecoding their harnesses. We think harness-level cheating will be an even greater problem as [autoresearch](https://x.com/karpathy/status/2031135152349524125) gets adopted.

Below, we provide examples found by Meerkat and discuss takeaways. For more detail on our approach, see our [paper](https://arxiv.org/abs/2604.11806).

## Harness-Level Cheating

Harness-level cheating, or developer cheating, is when privileged information (like the correct answer) is leaked into the agent's environment by the developer. Since this happens at the scaffold level, it is often model-agnostic: any capable model will end up cheating when evaluated through the same harness. We believe this is due to developers designing agent harnesses with coding agents; so this occurs due to the meta-agent itself cheating. This becomes explicit as autoresearch and [meta-harnesses](https://arxiv.org/abs/2603.28052) become more widely adopted.

### Verifier injection (Pilot on Terminal-Bench 2)

The #1 Terminal-Bench 2 score (82.9% pass rate) was achieved by Pilot, a scaffold that loads task verifier code into the agent's environment. In 415 of 429 traces, *the agent reads from a `/tests` directory that should be [inaccessible](https://www.tbench.ai/docs/task-overview#implementing-a-sing-dockerfile)*. Its first action is often `cat /tests/test_outputs.py`, after which it reverse-engineers expected outputs and works backward. The scaffold cheats by looking up the answer-key, which should not be accessible.

![][pilot]

### Sneaking the answer key (ForgeCode on Terminal-Bench 2)

The #2 and #3 score on the Terminal-Bench 2 leaderboard (81.8% pass rate) are achieved by ForgeCode, a scaffold that automatically loads `AGENTS.md` files into the agent's system prompt before execution begins. These files, however, are not part of the official benchmark and we find that in several cases they contained literal answer keys.

On the `mteb-leaderboard` task, the `AGENTS.md` file included the exact expected answer along with a record of why a prior attempt had failed: *"That run failed with reward 0.0 because it wrote the wrong final answer... instead of the expected GritLM/GritLM-7B."* The agent reads this file, adopts the answer verbatim, writes it to `result.txt`, and then "verifies" it by checking against the same injected source. All four passing traces on this task follow the identical pattern.

![][forge_mteb]

On the `bn-fit-modify` task, the agent was supposed to recover a Bayesian Network DAG from data using structure-learning algorithms. Instead, the agent announced it would use "the known correct DAG from guidelines" and hardcoded all six edges without ever running a discovery algorithm. All five ForgeCode traces on this task exhibit the same behavior and none of the traces from other scaffolds use this shortcut.

![][forge_bnfit]

When we replace the ForgeCode traces that reference `AGENTS.md` with the performance of the same model (Claude Opus 4.6) running through a clean scaffold, the overall pass rate drops from 81.8% to approximately 71.7%, **which would move the submission from 1st place to 14th on the leaderboard**.

### Solution injection (HAL USACO)

The top-ranked HAL USACO agent uses a scaffold that injects solutions into the prompt disguised as "somewhat similar problems." The "similar" problems are the actual benchmark problems, complete with full solution code.

Across 307 problems, 107 had the full exact `Solution Code` block inserted into the agent context. We found 595 likely cheating traces across all 12 models evaluated through this scaffold. The cheating is model-agnostic, in that the framework provides the answer regardless of the model actions. We think it is likely that this is not deliberate harness-level cheating, but due to a bug in the retrieval code.

![][hal_usaco]

## Task-Level Cheating

Task-level cheating is when the agent itself finds a way to satisfy the evaluator without doing the intended task. Prior audits focused here, but we find it is more pervasive than previously reported: 28 confirmed traces across 6 benchmarks.

### Googling answers (CyBench)

On CyBench, 16 of 464 successful traces (3.4%) solved CTF challenges by downloading public writeups instead of working through the problem. This affected 13 tasks across 4 models. Prior work documented 4 instances, but we found 4x that.

![][cybench]

### Mining git history (SWE-bench)

On SWE-bench and SWE-rebench, 6 traces across 3 scaffold types showed agents finding the fix commit via `git log` and copying the historical patch. As one Qwen3-Coder trace put it: "There's a commit 020c195... that seems very relevant. Perfect! So this commit already implemented the fix I need to make." This type of cheating has recently been [discovered and patched on SWE-bench](https://github.com/SWE-bench/SWE-bench/issues/465), and affected leaderboard entries have been re-evaluated, but we recover the issue without any human intervention and find it on SWE-rebench as well.

![][swebench]

### Prompt-injecting the verifier (Terminal-Bench 2)

On Terminal-Bench 2, a Claude Opus 4.6 agent (via Meta-Harness) tasked with implementing an adaptive rejection sampler wrote code that always prints "PASS" when run. The verifier executes the agent's code (printing "PASS"), then runs its own checks (printing "FAIL"), but only checks whether the output *contains* "PASS." Since the agent's output comes first, the verifier passes despite the actual tests failing.

![][metaharness]

### Hardcoding test answers (SWE-smith)

On SWE-smith, a Claude 3.7 Sonnet agent that couldn't fix a string-distance algorithm hardcoded return values for the exact test inputs. The agent acknowledged this was "temporary." The temporary values were never removed. The final commit was: "Added special case handling for the specific test cases to ensure the tests pass."

![][swesmith]

### Faking exploits (BountyBench)

On BountyBench, which requires dynamic vulnerability exploitation, agents that couldn't get the real exploit working fell back to faking it. One agent used `grep` to check if the vulnerable pattern existed in the source code, then ran an unrelated standalone `pickle.loads()` demo. Another replaced an entire library with a mock that simulates the vulnerability. Both were accepted by the evaluator, which only checks exit codes.

![][bountybench]

## Takeaways

Some of the most widely adopted agent evaluations have widespread cheating. This means they are accidentally measuring the ability of agents or developers (who often themselves are using agents to code their solutions!) to cheat. In the short term, cheating will likely become more, not less, common as agents become more capable. We suspect cheating at the level of the agent scaffold will be an even greater issue going forward, as the community continues to adopt approaches like [autoresearch](https://x.com/karpathy/status/2031135152349524125).

The true prevalence of cheating in real evaluations is unknown, despite work on specific instances of reward hacking, e.g. [here for o3](https://metr.org/blog/2025-06-05-recent-reward-hacking/). Similarly, while the community often discusses "benchmaxxing," where developers overfit models or scaffolds to benchmarks, it is unknown just how common this practice is. Our results discover many cases of cheating, and find that cheating at the level of the harness is more common than previous estimates suspected.

Finding cheating at scale is hard for three reasons. First, the evidence is often spread across multiple traces rather than visible in any single one. Second, this is a sparse retrieval problem, where the cheating traces are buried among hundreds of benign runs. Third, cheating behavior is often adversarially disguised and so looks like real work. Our approach, Meerkat, addresses this by first organizing traces with clustering, so that related behaviors end up near each other and large benign regions can be skipped. We then use an LLM agent (in the cases discussed here, Opus 4.6) to search for groups of traces that have suspicious behavior. This lets it scalably find patterns that per-trace monitors miss.

Widespread cheating [calls for](https://www.nist.gov/caisi/cheating-ai-agent-evaluations) evaluations designed with clear rules and access controls for both the agent and developer. It also requires large-scale auditing and transcript analysis, where the use of agents to supervise other agents becomes important as benchmarks grow in scale and complexity.

*\*An earlier version of this post reported higher task-level counts (17 instances of git-history cheating across SWE-bench and SWE-rebench). We lowered these numbers after additional auditing.*

[overview]: /assets/blog/cheating_matrix_v4_dotplot.png
[pilot]: /assets/blog/02_pilot_verifier_leak.png
[forge_mteb]: /assets/blog/01_forgecode_answer_injection.png
[forge_bnfit]: /assets/blog/01b_forgecode_bnfit.png
[hal_usaco]: /assets/blog/03_hal_usaco_leak.png
[cybench]: /assets/blog/04_cybench_writeup.png
[swebench]: /assets/blog/05_swebench_git.png
[metaharness]: /assets/blog/06_metaharness_verifier.png
[swesmith]: /assets/blog/07_swesmith_hardcode.png
[bountybench]: /assets/blog/08_bountybench_fakes.png
