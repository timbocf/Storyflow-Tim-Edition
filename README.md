# Storyflow — Tim Edition

My personal fork of **Storyflow 261101** by **wetcircuit (Cutscene Artist)** — a two-part automation tool for [Draw Things](https://drawthings.ai/):

- **The Editor** (this repo's `index.html`) — a web page where you build an ordered list of instructions (prompts, configs, canvas ops, loops, wildcards…).
- **The Pipeline** (`StoryflowPipeline_tim.js`) — a Draw Things script that runs the exported instruction list inside Draw Things.

The original is distributed from [cutsceneartist.com/DrawThings](https://cutsceneartist.com/DrawThings/). All credit for the original tool goes to wetcircuit; this edition just fixes a few bugs I ran into. Every change is marked in the code with a `[Tim edition fix]` comment, and the full list is in [CHANGELOG_tim.md](CHANGELOG_tim.md).

## Use the Editor online

**GitHub Pages:** https://timbocf.github.io/Storyflow-Tim-Edition/

Running it from that Pages address (https) also means the **Export to Clipboard** button can use the browser's full clipboard support on iPad — one of the bugs below was that it silently failed from local files.

## Install the Pipeline in Draw Things

- **iPad:** save `StoryflowPipeline_tim.js` to Files → On My iPad → Draw Things → Scripts, then relaunch Draw Things. It appears in the Scripts list.
- **Mac:** save it to `~/Library/Containers/com.liuliu.draw-things/Data/Documents/Scripts/`, then relaunch Draw Things.

Keep the Editor and Pipeline versions together — this Pipeline matches this Editor.

## What this edition fixes (so far)

1. **H3 frames slider exported the wrong frame count** (Editor) — the export now matches the number the slider badge shows (MiniMax H3 rule: steps of 17, offset 5).
2. **A failed preflight no longer runs** (Pipeline) — if the preflight check collects any warnings, the script stops instead of executing a job it just declared invalid.
3. **Get Prompt appends instead of wiping** (Pipeline) — it now adds Draw Things' current UI prompt to the concat text being built, instead of replacing it.
4. **Export to Clipboard works on iPad** (Editor) — layered copy routes (modern Clipboard API → legacy copy → manual-copy popup) plus actual success/failure feedback on the button.

Details, validation notes, and known remaining issues are in [CHANGELOG_tim.md](CHANGELOG_tim.md).
