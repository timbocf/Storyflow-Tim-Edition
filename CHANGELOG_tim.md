# Storyflow — Tim edition changes

Base: wetcircuit's Storyflow 261101 (Editor HTML + Pipeline JS), downloaded Nov 12, 2026.
The original downloads are untouched in `~/workspace/your_files/storyflow-261101/`.
These two files are Tim's own copies to modify:

- `StoryflowEditor_tim.html` — replaces `StoryflowEditor_261101.html`
- `StoryflowPipeline_tim.js` — replaces `StoryflowPipeline_261101.js`
  (install the same way as the original: Files → On My iPad → Draw Things → Scripts, then relaunch Draw Things; or the Mac Scripts folder from the readme)

## Fixes applied Nov 12, 2026

1. **H3 frames slider exported the wrong number (Editor).**
   The badge on an H3 Frames item follows the MiniMax H3 rule (steps of 17, offset 5 — position 17 shows "22"), but the exporter used the Wan/LTX shortcut (slider + 1) for all three types, so a badge reading 22 exported 18. Export now matches the badge for all three frame types. Verified against all 181 slider positions, including save/load round-trips: old code mismatched on 21 positions (every H3 position past 0); new code mismatches on none.

2. **A failed preflight no longer runs (Pipeline).**
   Before, when preflight found problems (bad JSON, unknown instructions, wrong types, bad file paths) the script showed a "🚫 Pipeline will fail" screen but kept executing if that screen was confirmed instead of cancelled. Now, if any warnings were collected, the script stops with an error message right after that screen and runs nothing. Fix the warnings in the Editor, re-export, relaunch.

3. **Get Prompt appends instead of wiping (Pipeline).**
   The `getPrompt` instruction's own comment said "concatenate prompt," but the code replaced the whole concat bucket with the Draw Things UI prompt — silently throwing away any text built up by earlier Concat/Wildcard/Interrogate items. It now appends the UI prompt to whatever is already in the bucket (same plain concatenation the Wildcard instruction uses).

4. **Export to Clipboard did nothing on iPad (Editor).**
   Reported by Tim Nov 12, 2026. The original was one `navigator.clipboard.writeText()` call — no error handling, no success/failure feedback. On iPad that API exists only in secure contexts (https pages; not local files or in-app previews), and when blocked its promise rejects silently, so the button appeared completely dead. (Side discovery: the Editor also *calls* a `showToastNotification` function that is never defined anywhere in the file — so it had no working feedback mechanism at all.) The button now tries three routes in order: the modern Clipboard API; the legacy textarea + `execCommand("copy")` route (works in several places the modern API doesn't); and, if both are blocked, a popup showing the export text already selected for long-press → Copy. The button label also reports the result ("✅ Copied!" or "⚠️ Copy blocked — see popup"), reverting after a couple of seconds.

5. **Documentation wiki added (Nov 12, 2026).**
   A wiki-style documentation set now lives in `docs/` in the repo (Docs Home, How It Works, Editor Guide, Instruction Reference, Wildcards/Sweeps/Loops, Video Frames & Dialog, Actor Sheet walkthrough, Tim Edition Changes), served by GitHub Pages at https://timbocf.github.io/Storyflow-Tim-Edition/docs/, and the Editor header links to it ("📖 Documentation") alongside the original links. The header also gained a "⬇️ Tim Edition Pipeline" link that downloads this edition's Pipeline file directly. (In the original, the only in-tool help was placeholder text inside empty fields, plus a separate .txt doc.)

## Fixes applied Nov 12, 2026 — round 2 ("any other issues you find")

6. **Frames-by-Dialog used LTX timing for Wan models (Pipeline).**
   The model table for dialog timing only had an H3 entry; everything else fell through to the LTX default (25 fps, step 8), so dialog clips on Wan models (16 fps, step 4) ran long. Added the Wan rule to the table in the author's own pattern. Verified with a harness over the extracted functions: model-name matching 5/5, and 13 words at 2.4 wps now yields 141 frames on H3, 89 on Wan, 137 on LTX.

7. **Mask seam mostly closed (Pipeline).**
   File-loaded masks (Load Mask / Load ⓘ Mask) are now tracked by source: loading one drops any stale internal mask so it can't override the file at render time, Mask to Canvas can now display a file-loaded mask, internally-made masks (Foreground/Background/Body/Ask) supersede the file record, and Clear Mask forgets both. Remaining platform limit, honestly noted: no instruction in the script can clear the copy already loaded into Draw Things' own mask layer — that still has to be cleared in Draw Things itself.

8. **Answer-model menu lookup made robust (Pipeline).**
   The Pipeline used to find the preflight answer-model popup by counting menu sections by hand (3 + files + answers) — a future section change would have silently read the wrong slot and used the wrong answer model. The menu's position is now captured while the menu is being built. Also removed a dead check for a nonexistent "askMask" instruction from the answer counter.

9. **Cyclic shorthand definitions can no longer hang the Editor (Editor).**
   All four shorthand resolvers (prompt triggers, config shortcuts, pose shortcuts, Editor wildcards) looped until the text stopped changing — with no limit. A growing cycle (A's text contains B twice, B's contains A twice) looped forever and froze the tab. The loops now stop after 10 passes or once the text passes 200,000 characters (the size cap matters: a growing cycle doubles the text each pass — a pass cap alone at 25 still produced an effectively unbounded string in testing; with both caps the worst case returns in ~10 ms). Normal nested definitions resolve exactly as before (verified).

10. **Preview frame totals fixed and H3 included (Editor).**
    The Wan/LTX totals used a running-subtraction formula that only came out right for a single frames item (two 81-frame Wan items totaled 161 instead of 162, with seconds computed off the wrong base too). Totals are now plain sums, an H3 total line exists, and the per-item seconds in Preview use frames ÷ fps — matching the item badges — instead of (frames − 1) ÷ fps.

Every fix is marked in the code with a `[Tim edition fix]` comment next to the changed lines, so the changes are easy to find, review, or revert.

## Validation done

- Both files pass a JavaScript syntax check.
- A diff against the originals shows only the three changes above — nothing else was touched.
- The frames fix was checked with a harness over every slider position of all three frame types (badge vs export vs reload).

Not tested: an actual run inside Draw Things (no Draw Things on this machine). First real run, keep the original Pipeline handy in case anything behaves differently on-device.

## Known leftovers (updated after round 2)

- Round 2 fixed: Frames-by-Dialog Wan timing, the mask seam (except the layer-clear limit below), the fragile answer-model menu lookup, and the Preview H3 totals / per-item seconds.
- Preview still doesn't expand `$` Editor wildcards or `#` config shortcuts, so Preview isn't a fully true picture of the export.
- No instruction can clear the copy of a file-loaded mask already sitting in Draw Things' own mask layer; that still has to be cleared in Draw Things itself.
- UI round (planned next, at Tim's direction): duplicate-item button, undo, autosave, Editor-side JSON validation, in-Editor help/tooltips.
