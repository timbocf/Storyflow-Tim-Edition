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

Every fix is marked in the code with a `[Tim edition fix]` comment next to the changed lines, so the changes are easy to find, review, or revert.

## Validation done

- Both files pass a JavaScript syntax check.
- A diff against the originals shows only the three changes above — nothing else was touched.
- The frames fix was checked with a harness over every slider position of all three frame types (badge vs export vs reload).

Not tested: an actual run inside Draw Things (no Draw Things on this machine). First real run, keep the original Pipeline handy in case anything behaves differently on-device.

## Known leftovers (not yet fixed — candidates for the next round)

- The Editor's Preview panel still leaves H3 frames out of its running-time totals, and its per-item seconds for H3 use (frames − 1) ÷ 24 while the item badge uses frames ÷ 24.
- Preview doesn't expand `$` Editor wildcards or `#` config shortcuts, so Preview isn't a fully true picture of the export.
- Mask seam: masks loaded from file don't set the Pipeline's internal mask variable (Mask to Canvas / rendering only see internally-set masks), and Clear Mask doesn't clear a file-loaded mask layer.
- Frames-by-Dialog uses LTX timing (25 fps, step 8) for any model whose name doesn't contain "H3" — including Wan models (16 fps, step 4), so dialog timing runs long on Wan.
- The answer-model popup is located by counting menu sections; fragile if sections are ever added or removed.
