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

## UI round — Nov 12, 2026 ("then we can tackle UI fixes")

11. **Duplicate item button (Editor).** Every item now has a ⧉ button next to ❌ that copies the item — with its current values — directly below itself. File-embed items also copy the picked file's contents (which even a project reload can't do).

12. **Undo (Editor).** Structural changes — add, delete, duplicate, drag/touch reorder, Load Project, New Project — now snapshot the whole project first. The ↩️ Undo button (action bar) or Ctrl/Cmd+Z steps back through up to 30 snapshots. Typing inside a field keeps that field's own native undo; Ctrl+Z only steps in outside text fields.

13. **Autosave (Editor).** The project (items + all four shortcut libraries + name) is saved to the browser's local storage ~0.7 s after any change, and restored on page load when there's something worth restoring (more than a fresh project's lone empty Note). Closing the tab mid-edit no longer loses the project. New Project replaces the autosave as soon as it changes anything, as expected.

14. **JSON validation in the Editor (Editor).** Config and Pose items are validated as you work — after # shortcut expansion — and so is every form-builder item's JSON. Bad items get a red outline and a ⚠ invalid JSON flag in the list, Preview names the offending item numbers, and both export buttons refuse to export until it's fixed (previously a bad Config exported malformed JSON that only failed later, inside Draw Things' preflight).

15. **One-line help on every item (Editor).** Each item now shows a short plain-language line under its type label saying what it does (all 55 tray types). The original's only in-item help was placeholder text inside empty fields.

16. **Preview tells the truth (Editor).** Preview now shows Config and Pose items with their # shortcuts expanded, and prompt-family items with $ Editor wildcards shown as their first option (the real export still rolls randomly — Preview stays deterministic instead of re-rolling on every keystroke).

Validated with a real DOM test (jsdom): 21/21 checks — boot, help coverage for all 55 types, duplicate/delete/undo chains, validation flagging + export block + unflagging, Preview resolution, autosave write + restore — plus all three sample projects load and export cleanly (each ending in {"end": true}).

17. **Export to Clipboard — second hardening (Nov 12, 2026, after Tim reported it still failing on his iPad).** The first fix awaited the Clipboard API first and only then fell back; on iPad Safari, copy permission is tied to the tap, and that wait could let it lapse — the API failed late and nothing visibly happened. The routes are reordered: the synchronous select-and-copy now runs first, inside the tap; the Clipboard API is second (and is now attempted whenever it exists and the context isn't a definite non-secure one — some webviews leave `isSecureContext` undefined); the manual popup is last and now has its own "📋 Select & Copy" button (a fresh tap = a fresh copy gesture) and an editable text box, since some iPad Safari versions won't offer the Copy callout on a readonly field. The deployed Pages build was also function-tested in a browser (button correctly reported "✅ Copied!"), so this targets the iPad-specific path specifically. DOM harness: all three routes verified (sync success; API success; API rejection → popup; popup button success).

18. **Frames-by-Dialog now counts curly quotes too (Pipeline, Nov 12, 2026).** The dialogue extractor only matched straight quotes (`"..."`); curly quotes (`“...”`) — which iPad/iPhone keyboards type by default — counted as zero words, so clips came out far too short for their dialogue (Tim's two-scene run budgeted ~13 counted words). The pattern now matches both quote styles; verified by harness: curly-quoted dialogue yields identical frame counts to the same text straight-quoted, mixed text counts both, and apostrophes inside curly quotes (don’t, you’re) don't break the match.

24. **UI redesign round (Editor, Nov 13, 2026) — fixes 19–24.** A full differentiation/usability pass over the Editor (Pipeline and export format untouched; DOM harness 34/34 checks plus all 3 sample projects exporting cleanly):
    - **19. Identity + plain-language renames + sticky action bar.** Header carries a "Tim Edition 1.0 · based on Storyflow 261101 by wetcircuit" badge in Tim-edition teal, the page title and favicon are the Tim Edition's own (her PWA manifest link removed), and a credit footer sits at the page bottom. Buttons renamed to say what they do: "Download for Draw Things", "Copy for Draw Things", "Open a Saved Project", "Save Project File"; tray buttons renamed likewise ("Add Text (Concat)", "Length from Dialogue 💬", "Frames: Wan/LTX/H3", "Canvas to Moodboard", …) and two item labels ("concat — add text", "frames by dialog — auto length 💬"). Display only — instruction keys and exports are unchanged. The action bar is now sticky, so export stays reachable while scrolling.
    - **20. Renders counter + no-renders guard + New Project confirm.** A live "🎬 Renders: N" counter sits in the action bar, using the Pipeline's own counting rule (Prompt items + dialogue items with Generate on). When the count is zero, a plain-language banner explains the project will report "number of renders: 0" and offers a one-tap "＋ Add a Prompt". New Project now asks for confirmation when the list holds real work (autosave + undo still apply).
    - **21. Quick-add templates.** "＋ 🎬 Video Scene" inserts Add Text + Frames by Dialog + Prompt as one block — the correct per-scene structure that previously had to be known; "＋ 🖼️ Still Image" inserts a lone Prompt.
    - **22. Loop brackets, family colors, collapse, move buttons.** Items inside a Loop are indented under it; an End Loop with no Loop (or a Loop never closed) is flagged on the item and named in Preview. Every item carries a color band by family (prompt blue, video purple, mask green, file orange, loop red, canvas teal, moodboard gold, config grey). Each item gains ⬆/⬇ move buttons (an alternative to dragging on the iPad) and a ▾ collapse toggle that folds it to its header row.
    - **23. Tray search + library drawer + count badges.** A "find an instruction…" box filters the tray buttons by name. The four library panels now open as a right-side drawer instead of a centered popup, and their tab buttons show live counts (e.g. "Prompt Triggers (3)").
    - **24. Tray dock: left by default, switchable to bottom.** At Tim's direction, the instruction tray ("node list") now docks as a permanent full-height column on the LEFT instead of the fixed bottom bar; ◀ Left / ▼ Bottom buttons in the tray header switch it, the choice persists across visits, and the tray's collapse toggle folds the column to a slim rail.

25. **Quick-add Load Image + image picker on load items (Editor, Nov 13, 2026).** Tim's actual need was loading an existing picture (his live in the iOS Photos app), not generating one. Quick Add gains "＋ 📥 Load Image" (adds a Load Image item) alongside Still Image (which still adds a Prompt — a lone Prompt is how Draw Things creates a still). Load Image, Load Mask, and Add to Moodboard items gain a "🖼️ Pick…" button: it opens the system photo/file picker, fills the item's path with the picked file's name, and shows a thumbnail so you can confirm the right picture. Honest limit, stated in the items' help text: a browser picker can't copy the file anywhere — the image must be a PNG in Draw Things' Pictures folder under that name at run time (on iPad: import the photo in Draw Things, then Save it with a name; Photos-app pictures have no file path of their own).

26. **Missing Pictures file now fails in plain words (Pipeline + Editor, Nov 13, 2026).** Tim ran a project whose Add to Moodboard named IMG_2129.png (a name filled in by the Editor's Pick… button, from Photos); the file wasn't in Draw Things' Pictures folder, so the run died with Draw Things' native "Cannot access file at …/Documents/Pictures/IMG_2129.png" exception and a stack trace. Two changes: (a) the Pipeline's three single-file loads — Load Image, Load Mask, Add to Moodboard — now catch that failure and stop with a plain-words error naming the instruction and file, explaining the file itself must be in the Pictures folder (a picked name alone isn't enough) and giving the fix (import onto the canvas in Draw Things, run a one-item Save Full Image project under the same name); Draw Things' original message is kept at the end. (b) In the Editor, using Pick… now reveals a visible warning on the item saying the same thing up front, instead of the caveat living only in the item's help line.

27. **Picked photos now bake into the project — the picker actually works end-to-end (Editor + Pipeline, Nov 13, 2026).** Tim asked whether the picker could be fixed "so it works right." It can, by changing what travels: a browser can never copy a Photos picture into Draw Things' Pictures folder (iOS sandboxing), but the project text is pasted into Draw Things anyway — so the photo now rides inside it. Key enabler found in her own code: the Pipeline's Color Fill loads its swatches via `canvas.loadImageSrc("data:image/png;base64,…")`, proving Draw Things loads image data directly, no file involved. Editor: Pick… on Load Image / Add to Moodboard now also downscales the photo (≤1280px long side, JPEG q0.85) and stores it on the item (`dataset.embedData`, carried through project save/load, the file-open loader, undo snapshots, and autosave as an `embed` field); export sends the data as the instruction value; Preview labels it `📷 embedded photo "name"` instead of dumping it; typing a file name by hand clears embed mode and restores the Pictures-file warning. Pipeline: Load Image detects a `data:image/` value and calls `canvas.loadImageSrc(value)`; Add to Moodboard tries `addToMoodboardFromSrc([dataUri])` and falls back to a canvas bounce (bank canvas → load embedded → add from canvas src → restore bank) built only from proven calls; Preflight's file list labels embedded values instead of printing them. Load Mask deliberately stays file-based (masks are produced inside Draw Things). Also folded in: the canvasLoad help line no longer claims the load "scales to render size" — it now says the image lands at its own size at 0,0 and names the Adapt Size / Move & Scale follow-ups. Trade-offs, stated plainly: embedded photos are capped at 1280px (ample for frames/references, not a full-res archive), each adds roughly a few hundred KB to the pasted project text, and a project with several embedded photos may exceed the browser's autosave quota (autosave silently skips; the project-file save still works). Validated: Pipeline syntax + extracted-helper tests (detection, direct moodboard route, bounce fallback with canvas restore) 6/6; Editor jsdom harness 15/15 (embed on pick, export value, Preview labeling, save/restore round-trip, typing clears, moodboard embeds, mask stays name-only); picker regression suite and all 3 sample projects still green.

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
- UI round DONE (fixes 11–16 above): duplicate-item button, undo, autosave, Editor-side JSON validation, in-Editor help, truthful Preview. Remaining known items: the mask-layer clear limit above; naming collisions (# used twice, "wildcard" used twice); GetConfigPro never examined.
