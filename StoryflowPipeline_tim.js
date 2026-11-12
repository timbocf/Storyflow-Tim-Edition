// @api-1.0
// Storyflow Pipeline 261101
// author wetcircuit
//
// current with Storyflow Editor 261101
// [Export to Pipeline] saves a .txt
// 
// Paste the full instructions in Pipeline
// Preflight Check will attempt to validate
//
//

//MENU A
//
const userSelectionA = requestFromUser(
  "Storyflow Pipeline",
  "Preflight Check",
  function () {
    return [
      this.section(
        "ℹ️ info",
        " Storyflow Editor (html) exports instructions for Pipeline. \n Create a sequence with full-configs and prompts. \n Export the instructions using [Export to Pipeline] or [Copy to Clipboard]. \n Paste the instructions in the textbox below.",
        [],
      ),

      this.section(
        "Storyflow Instructions",
        " Pipeline expects formatted JSON from Storyflow Editor \n [the square brackets and everything inbetween]",
        [this.textField("", "[{ Paste Instructions Here }]", true, 320)],
      ),

      this.section(
        "🌐 Storyflow Editor Online", 
        "The latest version of Storyflow Editor is online at:", 
        [this.textField("https://cutsceneartist.com/DrawThings/","https://cutsceneartist.com/DrawThings/", false, 20)]
)
    ];
  },
);

// User Menu Options
//
let userText = userSelectionA?.[1]?.[0] || "";
// 🟢 CHANGE: Use an array to store all warnings
let warnings = [];
let parsedInstruction;

try {
  parsedInstruction = JSON.parse(userText);
} catch (e) {
  // 🟢 CHANGE: Push JSON error to the array instead of overwriting a string
  warnings.push(" Invalid JSON – please see the Troubleshoot suggestions");
  parsedInstruction = [];
}

const instructions = parsedInstruction || [];

// Validation rules
//
const allowedKeys = {
  note: { type: "string" },
  prompt: { type: "string" },
  config: { type: "object" },
  size: { type: "object" },
  frames: { type: "number" },
  framesDialog: { type: "object" },
  faceZoom: { type: "flag" },
  askZoom: { type: "string" },
  removeBkgd: { type: "flag" },
  canvasClear: { type: "flag" },
  canvasSave: { type: "string", allowedExtensions: ["png"] },
  canvasSaveArea: { type: "string", allowedExtensions: ["png"] },
  canvasLoad: { type: "string", allowedExtensions: ["png", "jpg", "webp"] },
  moveScale: { type: "object" },
  adaptSize: { type: "object" },
  crop: { type: "flag" },
  moodboardClear: { type: "flag" },
  moodboardCanvas: { type: "flag" },
  moodboardLoad: { type: "flag" }, // legacy same as moodboardCanvas
  moodboardAdd: { type: "string", allowedExtensions: ["png", "jpg", "webp"] },
  moodboardRemove: { type: "number" },
  moodboardWeights: { type: "object" },
  maskClear: { type: "flag" },
  maskLoad: { type: "string", allowedExtensions: ["png", "jpg", "webp"] },
  maskGet: { type: "flag" },
  maskBkgd: { type: "flag" },
  maskFG: { type: "flag" },
  maskBody: { type: "flag" },
  maskAsk: { type: "string" },
  depthExtract: { type: "flag" },
  depthCanvas: { type: "flag" },
  depthToCanvas: { type: "flag" },
  inpaintTools: { type: "object" },
  xlMagic: { type: "object" },
  negPrompt: { type: "string" },
  poseExtract: { type: "flag" },
  poseJSON: { type: "object" },
  loop: { type: "object" },
  loopLoad: { type: "string" },
  loopAddMB: { type: "string" },
  loopLoadMask: { type: "string" },
  loopSave: { type: "string", allowedExtensions: ["png"] },
  loopEnd: { type: "flag" },
  end: { type: "flag" },
  concat: { type: "string" },
  approve: { type: "flag" },
  wildcard: { type: "object" },
  sweep: { type: "object" },
  interrogate: { type: "string" },
  enhance: { type: "string" },
  sizex2: { type: "flag" },
  matte: { type: "object" },
  hrf: { type: "object" },
  getPrompt: { type: "flag" },
  prefix: { type: "string" },
  swapCanvas: { type: "flag" },
};

// Validate instruction array
//
function validateInstructionArray(arr) {
  const invalidKeys = [];
  const invalidTypes = [];

  for (const [index, item] of arr.entries()) {
    const key = Object.keys(item)[0];
    const value = item[key];

    if (!(key in allowedKeys)) {
      invalidKeys.push({ index, key });
      continue;
    }

    const rules = allowedKeys[key];

    // Key Type validation
    //
    if (rules.type === "flag") {
      continue;
    }
    if (typeof value !== rules.type) {
      invalidTypes.push({
        index,
        key,
        expected: rules.type,
        actual: typeof value,
      });
    }
    // 👇 FIX: Use the new allowedExtensions property for file path validation
    else if (rules.allowedExtensions) {
      // 1. Get the file extension (case-insensitive)
      const extensionMatch = value.match(/\.(png|jpg|webp)$/i);
      let actualExtension = extensionMatch ? extensionMatch[1].toLowerCase() : null;

      // 2. Check if the extension is in the allowed list
      if (!actualExtension || !rules.allowedExtensions.includes(actualExtension)) {
        invalidTypes.push({
          index,
          key,
          // Create a comma-separated list of expected extensions
          expected: `a file path ending in one of: ${rules.allowedExtensions.map(e => `.${e}`).join(', ')}`,
          actual: value,
        });
      }
    }
  }

  return { invalidKeys, invalidTypes };
}

// Collect model-related strings from config objects
//
function collectModelStringsFromConfig(config) {
  const result = [];

  function search(obj) {
    for (const key of Object.keys(obj)) {
      const value = obj[key];

      if (
        key === "model" ||
        key === "refinerModel" ||
        key === "file" ||
        key === "upscaler"
      ) {
        if (typeof value === "string") {
          result.push(value);
        }
      } else if (typeof value === "object" && value !== null) {
        search(value);
      }
    }
  }

  search(config);
  return result;
}

// Parse the Keys
//
const { invalidKeys, invalidTypes } = validateInstructionArray(instructions);

// Collect model strings
//
const modelStrings = instructions
  .filter((item) => item.config)
  .flatMap((item) => collectModelStringsFromConfig(item.config));

// 🟢 CHANGE: Validate and report ALL errors
//
if (invalidKeys.length > 0) {
  invalidKeys.forEach(({ index, key }) => {
    // 🟢 PUSH all errors to the array
    warnings.push(`Item ${index}: Invalid key "${key}"`);
  });
}

if (invalidTypes.length > 0) {
  invalidTypes.forEach(({ index, key, expected, actual }) => {
    // 🟢 PUSH all errors to the array
    // Check if the error is a file path error by looking for the "file path" string in the expected message
    if (expected.includes("file path")) {
        // Use a more specific file path error message
        warnings.push(`Item ${index}: "${key}" - Invalid file path or extension. Expected ${expected.replace('a file path ending in one of: ', '')} but got "${actual}"`);
    } else {
        // This handles standard type mismatches (string, object, number, etc.)
        warnings.push(`Item ${index}: "${key}" - Expected ${expected} but got ${actual}`);
    }
  });
}

function truncateFilePath(fullPath) {
  // Step 1: Split the path by '/' and remove empty strings
  const parts = fullPath.split("/").filter(Boolean);

  // Step 2: Check if there are at least two directory levels (first and second)
  if (parts.length < 2) {
    // Fallback to original path if it doesn't meet expected structure
    return fullPath;
  }

  // Step 3: Extract the relevant parts
  const firstPart = parts[0];
  const secondPart = parts[1];
  const lastPart = parts[parts.length - 1];

  // Step 4: Format the output string as ~<first>/<second>/<last>
  return `~${firstPart}/${secondPart}/${lastPart}`;
}

// collect path strings ... (moodboardLoad fix)
//
const picturesPath = filesystem.pictures.path;
const displayPath = truncateFilePath(picturesPath);
const pathStrings = instructions.flatMap((obj) =>
  Object.entries(obj)
    .filter(([key]) => ["canvasSave", "canvasLoad", "moodboardAdd", "maskLoad", "loopSave", "loopLoad", "loopAddMB"].includes(key))
    .map(([key, value]) => {
      if (key === "canvasSave" || key === "loopSave") {
        return ` 🔻 ${value}`;
      } else {
        return ` 🔺 ${value}`;
      }
    }),
);

// collect items that generate
//
const genIndices = instructions.reduce((acc, instruction, idx) => {
  const [key, value] = Object.entries(instruction)[0] || [];

  if (key === "prompt" || (key === "framesDialog" && value?.generate)) {
    acc.push(idx);
  }

  return acc;
}, []);


// collect items that answer
//
const answerIndices = instructions.reduce((acc, instruction, idx) => {
  const [key, value] = Object.entries(instruction)[0] || [];

  // [Tim edition fix] removed a check for an "askMask" instruction that
  // does not exist (the real instruction is "maskAsk") — harmless, but it
  // made this counter look like it covered something it never could.
  if (key === "enhance" || key === "interrogate" || key === "askZoom") {
    acc.push(idx);
  }

  return acc;
}, []);

// Check which models have been downloaded, and format
//
const loaded = pipeline.areModelsDownloaded(modelStrings);
const annotatedModelStrings = modelStrings.map((modelName, index) => {
  return loaded[index] ? " 🔹 " + modelName : " 🔸 " + modelName;
});

// Preflight Messages
//
let joinedModelString = annotatedModelStrings.join("\n");
let joinedPathString = pathStrings.join("\n");
// 🟢 CHANGE: Join all accumulated warnings for display
const joinedWarningString = warnings.join("\n");

const modelMessage = joinedModelString
  ? joinedModelString +
    "\n\nplease check that all models are available before starting Pipeline \n 🔹 model is downloaded \n 🔸 model is not available locally"
  : " no models found – Pipeline will use the available UI model \n\n ⁉️ Does your Storyflow project need a full config at the start? 🤔";

const pathMessage = joinedPathString
  ? ` ${displayPath}/... \n\n${joinedPathString} \n\nfiles can overwrite (do all sub-folders exist?) \n 🔻 save files \n 🔺  load files`
  : " 👌 no Save/Load instructions found.";

const infoMessage = `number of renders: ${genIndices.length}`;
const answerMessage = `number of answers: ${answerIndices.length}`;
const warningMessage = "Instructions cannot be processed";
const warningInfo =
  " Pipeline expects instructions from Storyflow Editor \n use the [Export to Pipeline] option to save a .txt \n open the .txt and Copy the full contents \n Paste the instructions in the previous menu \n (cancel and relaunch the script)";
const troubleshoot =
  "\n 1. Copy/Paste the entire instructions array \n [{ the square brackets and everything between }]. \n\n 2. Storyflow Editor and Pipeline versions should match. \n - new commands won't be recognized\n\n 3. Save/Load filepaths must be within the Pictures directory. \n\n 4. All Save/Load files must be .png";
const selectModel = [
"interrogate default",
"Qwen 3.5 4B",
"Moondream2/20240520"
];

// PRE-FLIGHT CHECK
//

let userSelectionB;
// [Tim edition fix] The answer-model menu's position in the result array
// is captured while Menu B is being built (below), instead of being
// re-derived afterward by counting sections — the old hand-count silently
// read the wrong slot if a section was ever added or removed.
let answerMenuIndex = -1;

// Check the warnings array length instead of the single string
if (warnings.length === 0) {
  // MENU B Pass Checks
  userSelectionB = requestFromUser(
    "Storyflow Pipeline – Preflight Check",
    "Start Pipeline",
    function () {
      const sectionsB = [
        this.section("📋 project info", infoMessage, []),
        this.section("✅ JSON appears valid", " preflight check passed", []),
        this.section("🤗 MODELS", modelMessage, []),
       ];
if (joinedPathString !== "") {
  sectionsB.push(
        this.section("📁 FILES for Save/Load", pathMessage, []),
  );
 }

if (answerIndices.length > 0) {
      sectionsB.push(
        this.section("🧠 ANSWERS for ask, Enhance, Interrogate", answerMessage, []),
        this.menu(0, selectModel)
      );
       }
 // [Tim edition fix] when the answer menu exists it is the last element
 // built, so its result slot is the last one — record it here.
 answerMenuIndex = sectionsB.length - 1;
 return sectionsB;
    },
  );
} else {
  // MENU B warning
  userSelectionB = requestFromUser(
    "Storyflow Pipeline – Preflight Check",
    "🚫 Pipeline will fail",
    function () {
      return [
        this.section(`⛔ ${warningMessage}`, warningInfo, []),
        this.section("⚠️ WARNINGS FOUND", joinedWarningString, []),
        this.section("🔧 TROUBLESHOOT", troubleshoot, []),
      ];
    },
  );
}

// [Tim edition fix] Hard stop: if preflight collected any warnings, refuse
// to run. Previously the script showed the "Pipeline will fail" menu but
// kept executing whenever the menu was confirmed instead of cancelled,
// running a job it had just said was invalid.
if (warnings.length > 0) {
  throw new Error(
    "Storyflow Pipeline stopped: preflight found " + warnings.length +
    " problem(s) — see the warnings on the previous screen. Fix them in the Storyflow Editor, re-export, and relaunch the script."
  );
}

// Safely extract the selected model or fall back to a default
let askModel = selectModel[0]; // Default fallback

// [Tim edition fix] use the menu position captured while Menu B was built
// (see answerMenuIndex above) instead of counting sections by hand.
if (answerIndices.length > 0 && userSelectionB && answerMenuIndex >= 0 && userSelectionB[answerMenuIndex] !== undefined) {
  askModel = selectModel[userSelectionB[answerMenuIndex]];
}

//
// STORYFLOW FUNCTIONS
//

class WildcardTracker {
  constructor(configItem) {
    this.wild = configItem.wild;
    this.originalCards = Array.isArray(configItem.cards) ? [...configItem.cards] : [];
    this.currentIndex = 0;
    this.shuffledCards = [];
    this.hasBeenSeen = false;
  }

  _shuffle(array) {
    let currentIndex = array.length;
    while (currentIndex !== 0) {
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  }

  getNextCard(globalLoopCounter) {
    this.hasBeenSeen = true;
    const totalCards = this.originalCards.length;
    if (totalCards === 0) return "";

    switch (this.wild) {
      case "loop": {
        const index = globalLoopCounter % totalCards;
        return this.originalCards[index];
      }
      case "once": {
        const index = Math.min(this.currentIndex, totalCards - 1);
        this.currentIndex++;
        return this.originalCards[index];
      }
      case "shuffle": {
        if (this.shuffledCards.length === 0) {
          this.shuffledCards = this._shuffle([...this.originalCards]);
        }
        return this.shuffledCards.shift();
      }
      case "random": {
        const randomIndex = Math.floor(Math.random() * totalCards);
        return this.originalCards[randomIndex];
      }

      default:
        return this.originalCards[0];
    }
  }
}


function xlMagic(ois, tis, nois) {
  // Predefined array of size objects
  const sizes = [
    { width: 256, height: 192 },
    { width: 512, height: 384 },
    { width: 768, height: 576 },
    { width: 1024, height: 768 },
    { width: 1280, height: 960 },
    { width: 1536, height: 1152 },
    { width: 1792, height: 1344 },
    { width: 2048, height: 1536 }
  ];

  const oisIndex = Math.max(1, Math.min(ois, 8)) - 1;
  const tisIndex = Math.max(1, Math.min(tis, 8)) - 1;
  const noisIndex = Math.max(1, Math.min(nois, 8)) - 1;

    configuration.originalImageWidth = sizes[oisIndex].width;
    configuration.originalImageHeight = sizes[oisIndex].height;

    configuration.targetImageWidth = sizes[tisIndex].width;
    configuration.targetImageHeight = sizes[tisIndex].height;

    configuration.negativeOriginalImageWidth = sizes[noisIndex].width;
    configuration.negativeOriginalImageHeight = sizes[noisIndex].height;

  return;
}

// Central configuration for model-specific frame rules
const MODEL_FRAME_CONFIGS = [
  {
    pattern: /h3/i,
    fps: 24,
    step: 17,
    offset: 5,
  },
  {
    // [Tim edition fix] Wan models previously fell through to the LTX
    // default below (25 fps, step 8), so dialog clips ran long.
    // Wan rule: 16 fps, steps of 4, offset 1.
    pattern: /wan/i,
    fps: 16,
    step: 4,
    offset: 1,
  },
  // Add future models here:
  // {
  //   pattern: /h4/i,
  //   fps: 30,
  //   step: 12,
  //   offset: 2,
  // }
];

// Default configuration if no model pattern matches
const DEFAULT_FRAME_CONFIG = {
  fps: 25,
  step: 8,
  offset: 1,
};

/**
 * Resolves frame parameters for a given model string.
 */
function getFrameConfig(modelString = "") {
  return (
    MODEL_FRAME_CONFIGS.find((config) => config.pattern.test(modelString)) ||
    DEFAULT_FRAME_CONFIG
  );
}

/**
 * Calculates final frame counts based on word count, pacing, and model settings.
 */
function calculateFrames(wordCount, pacing, { fps, step, offset }) {
  const rawFrames = (wordCount / pacing) * fps;
  return Math.ceil(rawFrames / step) * step + offset;
}

function framesDialog(pacing) {
  // 1. Extract words between quotes
  const quoteRegex = /"([^"]+)"/g;
  const matches = [...concat.matchAll(quoteRegex)];

  // 2. Count words
  let wordCount = 0;
  matches.forEach((match) => {
    const tokens = match[1].trim().split(/\s+/);
    wordCount += tokens.length;
  });

  // 3. Resolve parameters & calculate result
  const frameConfig = getFrameConfig(configuration?.model);
  return calculateFrames(wordCount, pacing, frameConfig);
}

/**
 * HUMAN IN THE LOOP
 */
function promptUserToEditConcat(currentText) {
  const result = requestFromUser(
    "Human-in-the-Loop Review",
    "Approve & Continue",
    function () {
      return [
        this.section(
          "Edit Concat String",
          "Review or modify the dynamically generated text before proceeding:",
          []
        ),
        this.section(
          "Live Text",
          "",
          [this.textField(currentText, "Enter updated prompt/text here...", true, 460)]
        )
      ];
    }
  );

  // Return user-edited text if provided, otherwise keep existing concat string
  return (result && result[1] && result[1][0] !== undefined) 
    ? result[1][0] 
    : currentText;
}

function promptUserToSwapCanvasImage() {
  // Prompt user using imageField for thumbnail selection & an override switch
  const result = requestFromUser(
    "Human-in-the-Loop: Swap Canvas Image",
    "Approve & Continue",
    function () {
      return [
        this.section(
          "Swap Canvas Image",
          "leave empty to keep the current Canvas \noption-click or long-tap to switch between Files/Photos",
          [
            this.imageField("select new image...", false)
          ]
        ),
        this.section(
          "⚙️",
          "ignore the image selector, keep the current canvas instead",
          [
            this.switch(false, "ignore swap")
          ]
        )
      ];
    }
  );

  // Extract selected components from response structure
  // result[0][0] -> imageField selection
  // result[1][0] -> switch state (boolean)
  const selected = result && result[0] && result[0][0];
  const ignoreSelection = result && result[1] && result[1][0];

  // If the override switch is ON, or if no image was selected, return null (No Change)
  if (ignoreSelection || !selected) {
    return null;
  }

  // Update Canvas
  canvas.updateCanvasSize(configuration);
  canvas.loadImageSrc(selected);
  __dtSleep(sleep);

  return;
}


function adaptAndResetCanvas(maxWidth, maxHeight) {
    // Get the dimensions of the loaded image via boundingBox


  function resizeAndReset() {
    if (canvas.boundingBox.width <= 0 || canvas.boundingBox.height <= 0) {
      console.error("Invalid or zero-sized bounding box.");
      return;
    }

    // Whichever is smaller: image bounding box or supplied value (per dimension),
    // then set the other dimension to the aspect ratio, rounded to units of 64.
    const imageWidth = canvas.boundingBox.width;
    const imageHeight = canvas.boundingBox.height;
    const cappedWidth = maxWidth > 0 ? Math.min(imageWidth, maxWidth) : imageWidth;
    const cappedHeight = maxHeight > 0 ? Math.min(imageHeight, maxHeight) : imageHeight;
    const ratio = imageHeight / imageWidth;
    const targetWidth = Math.min(cappedWidth, Math.round(cappedHeight / ratio / 64) * 64);
    const targetHeight = Math.min(cappedHeight, Math.round(cappedWidth * ratio / 64) * 64);
    const adjustedWidth = Math.max(64, Math.round(targetWidth / 64) * 64);
    const adjustedHeight = Math.max(64, Math.round(targetHeight / 64) * 64);

    configuration = {
      ...configuration,
      width: adjustedWidth,
      height: adjustedHeight
    };

            // Update the canvas size
            try {
                canvas.updateCanvasSize(configuration);

                // Reset zoom and center the canvas
                canvas.canvasZoom = 1;
                canvas.moveCanvas(0, 0);
            } catch (error) {
                console.error("Error updating the canvas size:", error);
            }
        } 

    // Wait for boundingBox to be ready
      __dtSleep(.2);


    // Run resizing and resetting after verification
    resizeAndReset();
}


// --- Helper Functions (Extracted Logic) ---

/**
 * Resets the canvas zoom and position to the default fallback state.
 * This logic was previously duplicated in faceZoom's catch block and else block.
 */
function fallbackCanvasZoom() {
  canvas.canvasZoom = 1.2;
  canvas.moveCanvas(
    configuration.width * 0.06,
    configuration.height * 0.06,
  );
}

/**
 * Applies the constrained zoom and move logic to the canvas based on a given rect.
 * This logic was previously central to faceZoom().
 *
 * @param {object} rect The rectangle object with { origin: {x, y}, size: {width, height} }
 */
function applyZoomAndMove(rect) {
  // Check if the rect is valid and meets the size criterion for zooming
  if (rect && rect.size && rect.size.height < configuration.height * 0.65) {

    // 1. Determine the final zoom level (myZoom/2 is the target zoom)
    const finalZoom = Math.max(1.5, canvas.canvasZoom / 1.8);

    // 2. Calculate the desired canvas top-left position to center the rect at the *final* zoom
    // Center of the rect in absolute coordinates
    const rectCenterX = rect.origin.x + rect.size.width / 2;
    const rectCenterY = rect.origin.y + rect.size.height / 2;
    
    // Desired top-left coordinate (x_0, y_0) such that the rect is centered
    // This is the absolute coordinate of the canvas's new center point (configuration.width/2, configuration.height/2)
    // Formula: x_0 = (rect_center * finalZoom) - (canvas_width / 2) / finalZoom  <-- Correction based on how most canvas libs work
    
    // Instead of using moveCanvasToRect and then adjusting, let's directly calculate the new canvas move.
    // The canvas's top-left (move coordinates) is the point in the full image that appears
    // at the top-left of the viewport.
    
    // Calculate the movement (x_move, y_move) in original image coordinates
    // that positions the rect's center at the screen's center (configuration.width/2, configuration.height/2)
    const desiredMoveX = rectCenterX - (configuration.width / 2) / finalZoom;
    const desiredMoveY = rectCenterY - (configuration.height / 2) / finalZoom;

    // 3. Constrain the movement to keep the canvas viewable within the bounds 
    const maxMoveX = pipeline.configuration.width - configuration.width / finalZoom;
    const maxMoveY = pipeline.configuration.height - configuration.height / finalZoom;

    // Constrain the final position (tempW, tempH)
    const tempW = Math.min(
      Math.max(0, desiredMoveX),
      Math.max(0, maxMoveX) // MaxMoveX must be at least 0 in case finalZoom is very small
    );

    const tempH = Math.min(
      Math.max(0, desiredMoveY),
      Math.max(0, maxMoveY)
    );

    // 4. Apply the final move and zoom
    canvas.moveCanvas(tempW, tempH);
    canvas.canvasZoom = finalZoom; // Set the calculated zoom
    
  } else {
    // If rect is null, invalid, or too large, perform the reset action
    fallbackCanvasZoom();
  }
}

/**
 * Executes the LLM query, parses the malformed JSON response, and converts
 * normalized coordinates into an absolute Rect object for canvas use.
 *
 * @param {string} query The query string for the LLM.
 * @returns {object|null} The absolute rect object, or null if parsing fails.
 */
function getAbsoluteRectForQuery(query) {
  const getRect = "get rectangle around " + query;
  const answerString = canvas.answer(askModel, getRect);
  // console.log(answerString);

  const normalizedCoords = parseMalformedJson(answerString);

  if (!normalizedCoords || normalizedCoords.length < 4) {
    console.error("Failed to parse valid coordinates from Ask response.");
    return null;
  }

  const canvasWidth = pipeline.configuration.width;
  const canvasHeight = pipeline.configuration.height;

  let startIndex = 0;
  // Check for an optional fifth coordinate (e.g., a confidence score)
  if (normalizedCoords.length === 5) {
    startIndex = 1;
  }

  const x_norm = normalizedCoords[startIndex];
  const y_norm = normalizedCoords[startIndex + 1];
  const x_max_norm = normalizedCoords[startIndex + 2];
  const y_max_norm = normalizedCoords[startIndex + 3];

  // Calculate the absolute pixel coordinates and dimensions
  const x_abs = Math.floor(x_norm * canvasWidth);
  const y_abs = Math.floor(y_norm * canvasHeight);
  const w_abs = Math.floor((x_max_norm - x_norm) * canvasWidth);
  const h_abs = Math.floor((y_max_norm - y_norm) * canvasHeight);

  // Return the rect in the required format: { origin: {x, y}, size: {width, height} }
  return {
    origin: { x: x_abs, y: y_abs },
    size: { width: w_abs, height: h_abs },
  };
}

/**
 * Normalizes coordinates from both old (raw array) and new (JSON bbox_2d) model outputs.
 * 
 * @param {string} answerString - Raw model response.
 * @returns {number[]} Array of 4 normalized floats: [x_norm, y_norm, x_max_norm, y_max_norm]
 */
function parseMalformedJson(answerString) {
  if (!answerString || typeof answerString !== "string") return [];

  // --- Approach 1: Try parsing structured JSON (New Model) ---
  try {
    // Clean potential Markdown block tags (```json ... ```)
    const cleanedString = answerString.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanedString);

    if (Array.isArray(parsed) && parsed.length > 0) {
      // Find the first entry with a valid bbox_2d property
      const target = parsed.find(item => item && Array.isArray(item.bbox_2d) && item.bbox_2d.length === 4);

      if (target) {
        let [ymin, xmin, ymax, xmax] = target.bbox_2d;

        // Convert [0, 1000] integer scale to [0.0, 1.0] normalized floats if needed
        if (ymax > 1 || xmax > 1) {
          ymin /= 1000;
          xmin /= 1000;
          ymax /= 1000;
          xmax /= 1000;
        }

        // Return in x_norm, y_norm, x_max_norm, y_max_norm order expected by getAbsoluteRectForQuery
        return [xmin, ymin, xmax, ymax];
      }
    }
  } catch (e) {
    // Fall back silently to regex extraction if JSON parsing fails
  }

  // --- Approach 2: Regex extraction (Legacy Model Fallback) ---
  const matches = answerString.match(/-?\d+(?:\.\d+)?/g);
  if (!matches) return [];

  const numbers = matches.map(Number);

  // If the legacy model also uses 0-1000 scale integers, convert them to 0-1
  if (numbers.some(n => Math.abs(n) > 1.0)) {
    return numbers.map(n => n / 1000);
  }

  return numbers;
}

/**
 * faceZoom function using the shared applyZoomAndMove logic.
 */
function faceZoom() {
  try {
    const faces = canvas.detectFaces();
    // Pass the first face rect to the shared zoom/move logic
    applyZoomAndMove(faces[0]);
  } catch (error) {
    // If detection fails, use the shared reset logic
    fallbackCanvasZoom();
  }
  return;
}

/**
 * maskAsk function using the shared getAbsoluteRectForQuery logic.
 */
function maskAsk(query) {
  const rect = getAbsoluteRectForQuery(query);

  if (!rect) {
    return canvas.createMask(
      pipeline.configuration.width,
      pipeline.configuration.height,
      0.0
    ); // Return an empty mask on failure
  }

  // 1. Get the current canvas dimensions for createMask
  const canvasWidth = pipeline.configuration.width;
  const canvasHeight = pipeline.configuration.height;

  // 2. Create a new, blank (solid black/0.0) mask to start
  const newMask = canvas.createMask(canvasWidth, canvasHeight, 0.0);

  // 3. Fill the calculated rectangle region with solid white (1.0)
  newMask.fillRectangle(
    rect.origin.x,
    rect.origin.y,
    rect.size.width,
    rect.size.height,
    1.0
  );

  return newMask;
}

/**
 * askZoom: Performs the query for a rect and then zooms the canvas to that rect.
 */
function askZoom(query) {
  const rect = getAbsoluteRectForQuery(query);
  // Reuses the core canvas manipulation logic
  applyZoomAndMove(rect);
  return;
}

function setBodyparts(value) {
      let bodyparts = [];
      if (value.upper) bodyparts.push(BodyMaskType.UPPER_BODY);
      if (value.lower) bodyparts.push(BodyMaskType.LOWER_BODY);
      if (value.clothes) bodyparts.push(BodyMaskType.CLOTHING);
      if (value.neck) bodyparts.push(BodyMaskType.NECK);
      const newMask = canvas.bodyMask(bodyparts, value.extra);
      return newMask;
}

function crop() {
      canvas.updateCanvasSize(configuration);
      const bank = canvas.saveImageSrc((visibleRegionOnly = true));
      // canvas.clear();
      canvas.loadImageSrc(bank);
      return;
}

function sizex2() {
      canvas.updateCanvasSize(configuration);
      const bank = canvas.saveImageSrc((visibleRegionOnly = true));
      configuration.width = configuration.width * 2;
      configuration.height = configuration.height * 2;
      canvas.updateCanvasSize(configuration);
      canvas.loadImageSrc(bank);
      return;
}

function colorfill(value) {
  // Normalize string (optional: handles lowercase/whitespace)
const solidColors = {
  black: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAD0lEQVR4AQEEAPv/AAAAAAAEAAFlScNgAAAAAElFTkSuQmCC",
  white: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAD0lEQVR4AQEEAPv/AP///wX+Av5JZm4rAAAAAElFTkSuQmCC",
  grey:  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAD0lEQVR4AQEEAPv/AH9/fwL+AX41ZMjJAAAAAElFTkSuQmCC",
  green: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAD0lEQVR4AQEEAPv/AAD/AAICAQBBFd1CAAAAAElFTkSuQmCC",
  magenta: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAD0lEQVR4AQEEAPv/AP8A/wQAAf/2bp8NAAAAAElFTkSuQmCC",
  blue: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAD0lEQVR4AQEEAPv/AAAA/wEDAQB8wnTbAAAAAElFTkSuQmCC",
  yellow: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAD0lEQVR4AQEEAPv/AP//AAT/Af9mVsegAAAAAElFTkSuQmCC",
  cyan: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAD0lEQVR4AQEEAPv/AAD//wMBAf8ciSx/AAAAAElFTkSuQmCC",
  red: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAD0lEQVR4AQEEAPv/AP8AAAMBAQCNHeWCAAAAAElFTkSuQmCC"
};
  
  const key = String(value).trim().toLowerCase();
  const src = solidColors[key];
  
  if (src) {
    canvas.loadImageSrc(src);
  }
}

function generatePath(value, i) {
  // Step 1: Split directory and filename
  const lastSlashIndex = value.lastIndexOf('/');
  let dirPath;
  let fileName;

  if (lastSlashIndex === -1) {
    dirPath = '';
    fileName = value;
  } else {
    dirPath = value.substring(0, lastSlashIndex + 1);
    fileName = value.substring(lastSlashIndex + 1);
  }

  // Step 2: Split filename into base name and extension
  const lastDotIndex = fileName.lastIndexOf('.');
  let baseName;
  let extension;

  if (lastDotIndex === -1) {
    baseName = fileName;
    extension = '';
  } else {
    baseName = fileName.substring(0, lastDotIndex);
    extension = fileName.substring(lastDotIndex + 1);
  }

const maxDigits = String(i).length;
const paddedIncrement = String(i).padStart(3, '0');

  // Step 4: Build new filename
  let newFileName;
  if (extension) {
    newFileName = `${baseName}_${paddedIncrement}.${extension}`;
  } else {
    newFileName = `${baseName}_${paddedIncrement}`;
  }

  // Step 5: Combine and return full path
  return dirPath + newFileName;
}

function extractNumber(filePath) {
    // 1. Get the actual filename string (e.g., "0_this_woman_...")
    const lastSlashIndex = filePath.lastIndexOf('/');
    const filename = filePath.substring(lastSlashIndex + 1);
    
    // 2. Regex to find digits at the START of the FILENAME, before the first underscore.
    // The '^' now correctly anchors to the start of the filename string.
    const match = filename.match(/^(\d+)_/); 
    
    if (match && match[1]) {
        return parseInt(match[1], 10);
    }
    
    // Fallback: This will return 0 for files like ".DS_Store" or "manual_photo.png"
    return 0; 
}

function getDirectoryByIndex(relativeDirectory, index) {
    try {
        const validExtensions = ['.png', '.jpg', '.jpeg', '.webp']; 
        const allEntries = filesystem.pictures.readEntries(relativeDirectory);

        let entries = [];
        if (allEntries && Array.isArray(allEntries)) {
            entries = allEntries.filter(filePath => {
                // 1. Data Integrity Check (Must be a string)
                if (typeof filePath !== 'string' || filePath.length === 0) {
                    return false;
                }

                // 2. Exclude .DS_Store file specifically
                if (filePath.endsWith('/.DS_Store')) {
                    return false;
                }
                
                // 3. File Extension Check
                const fileNameLower = filePath.toLowerCase();
                return validExtensions.some(ext => fileNameLower.endsWith(ext));
            });
        }

        if (entries.length === 0) {
            console.warn(`No valid image files found in directory: ${relativeDirectory}`);
            return;
        }

// --- Updated Sorting Logic with Alphabetical Tie-Breaker ---
entries.sort((a, b) => {
    const numA = extractNumber(a);
    const numB = extractNumber(b);
    
    // 1. Primary Sort: Numerical
    if (numA !== numB) {
        return numA - numB;
    }
    
    // 2. Secondary Sort (Tie-breaker): Alphabetical
    // If numbers are equal (e.g., both are 0, or both are 10), sort alphabetically.
    return a.toLowerCase().localeCompare(b.toLowerCase());
});
// --------------------------------------------------------

        const count = entries.length;
        // Calculation for positive-only modulo/looping index:
        const loopedIndex = ((index % count) + count) % count; 

        // The returned value is the full file path string, e.g., "/Users/.../G_kini_001.png"
        return entries[loopedIndex];

    } catch (error) {
        console.error(`Error processing directory: ${error.message}`);
        throw error;
    }
}

//
// WILDCARD REGISTRY INITIALIZATION
//
const wildcardRegistry = {};
instructions.forEach((item, index) => {
  if (item) {
    if (item.wildcard) {
      const wildcardWild = String(item.wildcard.wild || "").toLowerCase();
      if (wildcardWild !== "menu" && wildcardWild !== "combobox") {
        wildcardRegistry[index] = new WildcardTracker(item.wildcard);
      }
    } else if (item.sweep) {
      // Sweeps use the exact same WildcardTracker logic!
      const sweepWild = String(item.sweep.wild || "").toLowerCase();
      if (sweepWild !== "menu" && sweepWild !== "combobox") {
        wildcardRegistry[index] = new WildcardTracker(item.sweep);
      }
    }
  }
});

function generate() {
  canvas.updateCanvasSize(configuration);

  const pipelineParams = {
    configuration: configuration,
    prompt: concat,
    negativePrompt: negativePrompt,
  };

  if (mask !== null) {
    pipelineParams.mask = mask;
  }

  pipeline.run(pipelineParams);
}

function buildMenuSelector(label, list) {
  return [
    this.section(label, "Menu adds to concat text.", [
      this.menu(0, list)
    ])
  ];
}

function pickCardFromMenu(options, paramName) {
  if (!Array.isArray(options) || options.length === 0) {
    console.warn("Menu has no options; skipping.");
    return "";
  }
  const stringOptions = options.map(String);
  const sectionTitle = paramName ? `Choose from the list — ${paramName}` : "Choose from the list";
  const result = requestFromUser(`Select Menu`, "Continue", function() {
    return buildMenuSelector.call(this, sectionTitle, stringOptions);
  });
  const cardIndex = result && result[0] && result[0][0];
  if (cardIndex !== undefined && options[cardIndex]) {
    return options[cardIndex];
  }
  return options[0];
}

function buildComboBoxSelector(label, list) {
  return [
    this.section(label, "ComboBox adds to concat text.", [
      this.comboBox("", list)
    ])
  ];
}

function pickCardFromComboBox(options, paramName) {
  if (!Array.isArray(options) || options.length === 0) {
    console.warn("ComboBox has no options; skipping.");
    return "";
  }
  const stringOptions = options.map(String);
  const sectionTitle = paramName ? `Choose from the list or Enter Text — ${paramName}` : "Choose from the list or Enter Text";
  const result = requestFromUser(`Select ComboBox`, "Continue", function() {
    return buildComboBoxSelector.call(this, sectionTitle, stringOptions);
  });
  const chosen = result && result[0] && result[0][0];
  if (chosen !== undefined) {
    return chosen;
  }
  return options[0];
}

//
// SUPERLOOPER
//

let configuration = pipeline.configuration;
let negativePrompt = pipeline.prompts.negativePrompt;
let Pvalue;
let mask = null;
// [Tim edition fix] Source of the most recent file-loaded mask (maskLoad /
// loopLoadMask). Those instructions load into Draw Things' mask layer and
// never produced a mask object, so the two mask channels drifted apart:
// a stale internal mask could override a freshly loaded file mask at
// render time, and maskGet could not see file-loaded masks at all.
// Tracking the source lets the mask instructions keep one coherent state.
let maskFileSrc = null;
let _loopMarker = -1;
let _loopCounter = 0;
let _maxLoops = 0;
let _startCount = 0;
let sleep = 0.1;
let concat = "";

// Process each instruction in the array
//
for (let i = 0; i < instructions.length; i++) {
  let instruction = instructions[i];
  // Extract key and value from current instruction object
  const key = Object.keys(instruction)[0];
  const value = instruction[key];

  // Execute command based on key type
  switch (key) {
    case "note":
      // do nothing
      break;

    case "prompt":
      // Prompt triggers canvas update and generate
      concat = concat + value,
      generate();
      concat = "";
      break;

    case "concat":
      // concatenate prompt
      concat = concat + value;
      break;

    case "prefix":
      // prefix concat
      concat = value + concat;
      break;

    case "interrogate": {
      // adds to concat
      const answer = canvas.answer(askModel, value);
      concat = concat + answer;
      break;
    }

    case "enhance": {
      // overwrites concat by combining the instruction value with previous concat
      const fullQuery = value + concat;
      const answer = canvas.answer(askModel, fullQuery);
      concat = answer;
      break;
    }

    case "approve":
      // Pause pipeline and request user approval for concat
      concat = promptUserToEditConcat(concat);
      break;

    case "swapCanvas":
      // Pause pipeline and request user approval for concat
      promptUserToSwapCanvasImage();
      break;

    case "wildcard": {
      // Fetch card from the specific instance tied to this instruction array index
      // menu/combobox are live user selections — launch the popup directly from the options list
      const wild = String(value.wild || "").toLowerCase();
      const options = Array.isArray(value.cards) ? value.cards : (Array.isArray(value.options) ? value.options : []);
      if (wild === "menu") {
        concat = concat + pickCardFromMenu(options);
      } else if (wild === "combobox") {
        concat = concat + pickCardFromComboBox(options);
      } else if (wildcardRegistry[i]) {
        const pickedCard = wildcardRegistry[i].getNextCard(_loopCounter);
        concat = concat + pickedCard;
      }
      break;
    }

    case "negPrompt":
      // sets negative prompt. does not render
      negativePrompt = value;
      break;

    case "getPrompt":
      // append the prompt currently in Draw Things' UI prompt box to concat
      // [Tim edition fix: was `concat = pipeline.prompts.prompt`, which wiped
      // everything already built up in concat instead of adding to it]
      concat = concat + (pipeline.prompts.prompt || "");
      break;

    case "config":
      // edits the values, but does NOT update the config
      Object.assign(configuration, value);
      break;

    case "size":
      // edits the values, updates the config
      Object.assign(configuration, value);
      canvas.updateCanvasSize(configuration);
      break;

    case "hrf":
      // edits the values, but does NOT update the config
      Object.assign(configuration, value);
      break;


    case "sizex2":
      // crops canvas image, double size, replace image
      sizex2();
      __dtSleep(sleep);
      break;

    case "sweep": {
      // check registered tracker for this sweep index
      // menu/combobox are live user selections — launch the popup directly from the options list
      try {
        const wild = String(value.wild || "").toLowerCase();
        const options = Array.isArray(value.cards) ? value.cards : (Array.isArray(value.options) ? value.options : []);
        let pickedValue;
        if (wild === "menu") {
          pickedValue = pickCardFromMenu(options, value.paramName);
        } else if (wild === "combobox") {
          pickedValue = pickCardFromComboBox(options, value.paramName);

        } else if (wildcardRegistry[i]) {
          pickedValue = wildcardRegistry[i].getNextCard(_loopCounter);
        }
        const parameterToTarget = value.paramName; // e.g., "cfgScale" or "steps"

        // Attempt to parse stringified objects/arrays (like LoRAs)
        if (typeof pickedValue === "string") {
          try {
            pickedValue = JSON.parse(pickedValue);
          } catch (e) {
            // Keep as string if it's a primitive value (e.g., text, model names)
          }
        }

        if (parameterToTarget) {
          configuration[parameterToTarget] = pickedValue;
        } else {
          console.warn(`Sweep at item ${i} is missing its "paramName" key.`);
        }
      } catch (error) {
        console.warn(`Sweep at item ${i} failed: ${error.message}`);
      }
      break;
    }

    case "frames":
      // edits the numFrames
      configuration.numFrames = value;
      break;

    case "framesDialog": {
      // edits the numFrames based on dialog in Concat
      try {
        const wps = framesDialog(value.wps);
        configuration.numFrames = wps + value.padding;
        if (value.generate) {
           generate();
           concat = "";
        }
      } catch (error) {
        console.warn(`framesDialog at item ${i} failed: ${error.message}`);
      }
      break;
    }

    case "faceZoom":
      // attempt face detection and zoom logic
      faceZoom();
      break;

    case "askZoom":
      //  zoom based on a rect created by answer() logic
      askZoom(value);
      break;

    case "removeBkgd":
      // remove background logic
      canvas.loadMaskFromSrc(canvas.backgroundMask.src);
      __dtSleep(sleep);
      break;

    case "matte":
      // fill canvas with 1px image, crop
      colorfill(value.color);
      __dtSleep(sleep);
      crop();
      break;

    case "canvasClear":
      // Clear canvas logic
      canvas.clear();
      __dtSleep(sleep);
      break;

    case "canvasSave":
      // Save canvas to .png
      Pvalue = picturesPath + "/" + value;
      canvas.saveImage(Pvalue, (visibleRegionOnly = false));
      __dtSleep(sleep);
      break;

    case "canvasSaveArea":
      // Save canvas to .png
      Pvalue = picturesPath + "/" + value;
      canvas.saveImage(Pvalue, (visibleRegionOnly = true));
      __dtSleep(sleep);
      break;

    case "canvasLoad":
      // update config before Loading canvas png
      canvas.updateCanvasSize(configuration);
      Pvalue = picturesPath + "/" + value;
      canvas.loadImage(Pvalue);
      __dtSleep(sleep);
      break;

    case "moveScale": {
      // set moveCanvas and canvasZoom
      try {
        canvas.moveCanvas(value.position_X, value.position_Y);
        canvas.canvasZoom = value.canvas_scale;
      } catch (error) {
        console.warn(`moveScale at item ${i} failed: ${error.message}`);
      }
      break;
    }

    case "adaptSize":
      // trim canvas logic
      // value.maxHeight, value.maxWidth
      adaptAndResetCanvas(value.maxWidth, value.maxHeight);
      __dtSleep(sleep);
      break;

    case "crop":
      // crop to visible canvas
      crop();
      __dtSleep(sleep);
      break;

    case "moodboardClear":
      // Clear moodboard logic
      canvas.clearMoodboard();
      __dtSleep(sleep);
      break;

    case "moodboardCanvas":
      // send canvas to moodboard
      canvas.addToMoodboardFromSrc(
        canvas.saveImageSrc((visibleRegionOnly = true)),
      );
      __dtSleep(sleep);
      break;

    case "moodboardLoad":
      // legacy function from beta 1, updated to MoodboardCanvas
      canvas.addToMoodboardFromSrc(
        canvas.saveImageSrc((visibleRegionOnly = true)),
      );
      canvas.clear();
      break;

    case "moodboardAdd":
      // add to moodboard from file
      Pvalue = "file://" + picturesPath + "/" + value;
      canvas.addToMoodboardFromSrc([Pvalue]);
      __dtSleep(0.2);
      break;

    case "moodboardRemove":
      // remove moodboard at index
      canvas.removeFromMoodboardAt(value);
      __dtSleep(sleep);
      break;

     case "moodboardWeights": {
      // set each moodboard at index, error catch when index is empty
      for (let i = 0; i <= 11; i++) {
        const key = 'index_' + i;
        if (key in value) {
          try {
            canvas.setMoodboardImageWeight(value[key], i);
          } catch (e) {
            //console.warn(`Moodboard index ${i} not available; skipping weight: ${e.message}`);
          }
        }
      }
      break;
    }

    case "maskClear":
      // reset mask to null logic
      // [Tim edition fix] also forget any file-loaded mask source, so a
      // later maskGet can't resurrect it. (Clearing the copy already loaded
      // into Draw Things' own mask layer is Draw Things' side of the wall —
      // no instruction in this script can reach it.)
      mask = null;
      maskFileSrc = null;
      break;

    case "maskLoad":
      // load mask from path logic
      Pvalue = "file://" + picturesPath + "/" + value;
      canvas.loadMaskFromSrc(Pvalue);
      // [Tim edition fix] the loaded file is now the mask: drop any stale
      // internal mask so generate() can't override the file at render time,
      // and remember the source so maskGet can find it.
      mask = null;
      maskFileSrc = Pvalue;
      __dtSleep(0.2);
      break;

    case "maskGet":
      // copy mask layer to canvas logic
      // [Tim edition fix] fall back to the file-loaded mask source when
      // there is no internal mask object.
      if (mask !== null) {
        canvas.loadImageSrc(mask.src);
      } else if (maskFileSrc !== null) {
        canvas.loadImageSrc(maskFileSrc);
      }
      break;

    case "maskBkgd":
      // set mask to background logic
      mask = canvas.backgroundMask;
      maskFileSrc = null; // [Tim edition fix] internal mask supersedes any file mask
      break;

    case "maskFG":
      // set mask to foreground logic
      mask = canvas.foregroundMask;
      maskFileSrc = null; // [Tim edition fix] internal mask supersedes any file mask
      break;

    case "maskBody": {
      // set mask to foreground logic
      try {
        mask = setBodyparts(value);
        maskFileSrc = null; // [Tim edition fix] internal mask supersedes any file mask
      } catch (error) {
        console.warn(`maskBody at item ${i} failed: ${error.message}`);
        mask = null; // Fall back to no mask so downstream mask ops don't crash
        maskFileSrc = null; // [Tim edition fix] a failed body mask means no mask at all
      }
      break;
    }

    case "maskAsk":
      // create a mask based on Answer() logic
      mask = maskAsk(value);
      maskFileSrc = null; // [Tim edition fix] internal mask supersedes any file mask
      break;

    case "depthExtract":
      // extract depth from canvas logic
      canvas.extractDepthMapFromSrc(
        canvas.saveImageSrc((visibleRegionOnly = true)),
      );
      __dtSleep(sleep);
      break;

    case "depthCanvas":
      // load depth from Canvas logic
      canvas.loadDepthMapFromSrc(canvas.saveImageSrc(visibleRegionOnly = true));
      break;

    case "depthToCanvas":
      // load depth from Canvas logic
      canvas.loadImageSrc(canvas.saveDepthMapSrc());
      break;

    case "inpaintTools":
      // edits the values, but does NOT update the config
      Object.assign(configuration, value);
      break;

    case "xlMagic": {
      // XL Magic latents
      // value.original, value.target, value.negative
      try {
        xlMagic(value.original, value.target, value.negative);
      } catch (error) {
        console.warn(`xlMagic at item ${i} failed: ${error.message}`);
      }
      break;
    }

    case "poseExtract":
      // extract pose from canvas logic
      canvas.loadPoseFromSrc(canvas.saveImageSrc(visibleRegionOnly = true));
      __dtSleep(sleep);
      break;

    case "poseJSON": {
      // add pose from JSON logic
      try {
        canvas.loadPoseFromJson(value);
      } catch (error) {
        console.warn(`poseJSON at item ${i} failed: ${error.message}`);
      }
      break;
    }

    case "loop": {
      // value.loop is the total number of loops (e.g., 5)
      // value.start is an optional starting frame number/index for the incrementals
      try {
        if (_loopMarker === -1) {
          // Only initialize on the first pass
          _loopMarker = i;
          _loopCounter = 0;
          _maxLoops = value.loop || 1; // Default to 1 if not specified
          _startCount = value.start;
          // Initial setup for loopLoad/loopSave can go here if needed
        }
      } catch (error) {
        console.warn(`Loop at item ${i} failed: ${error.message}`);
        // Reset markers so downstream loop ops don't run with stale state
        _loopMarker = -1;
        _loopCounter = 0;
      }
      break;
    }

    case "loopLoad":
      // Incremental load logic
      // Note: Assumes directory contains files indexed from 0 or 'value.start'
      Pvalue = getDirectoryByIndex(value, _loopCounter);
      canvas.loadImage(Pvalue);
      __dtSleep(sleep);
      break;

    case "loopAddMB":
      // add to moodboard incrementally from directory
      Pvalue = "file://" + getDirectoryByIndex(value, _loopCounter);
      canvas.addToMoodboardFromSrc([Pvalue]);
      __dtSleep(0.2);
      break;

    case "loopLoadMask":
      // add to mask layer incrementally from directory
      Pvalue = "file://" + getDirectoryByIndex(value, _loopCounter);
      canvas.loadMaskFromSrc(Pvalue);
      // [Tim edition fix] same bookkeeping as maskLoad: the file mask
      // supersedes any internal mask, and maskGet can find it.
      mask = null;
      maskFileSrc = Pvalue;
      __dtSleep(0.2);
      break;

    case "loopSave":
      // Incremental save logic
      Pvalue = generatePath(value, _loopCounter + _startCount);
      Pvalue = picturesPath + "/" + Pvalue;
      canvas.saveImage(Pvalue, (visibleRegionOnly = false));
      __dtSleep(sleep);
      break;

    case "loopEnd":
      _loopCounter++; // Increment the counter
      if (_loopCounter < _maxLoops) {
        // Loop not depleted, jump back to the 'loop' instruction
        i = _loopMarker - 1; // Subtract 1 because 'i++' in the for loop will increment it back to _loopMarker
      } else {
        // Loop finished, reset markers to allow for future loops
        _loopMarker = -1;
        _loopCounter = 0;
        _maxLoops = 0;
      }
      break;

    case "end":
      // PLACEHOLDER: End process logic
      console.log("ENDING PIPELINE");
      break;

    default:
      console.warn("Unknown instruction type:", key);
  }
}