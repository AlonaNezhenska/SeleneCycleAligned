/* ---------------------------------------------------------------
   THE PEONY — the one flower behind every intensity slider.

   25 frames from flowerbloom.gif in one sheet, closed bud to full bloom, cropped and
   with the sage background made transparent. The slider shows one frame
   at a time, so the same flower moves as you drag:

     open    positive states (calm, energy, glow…): more is a fuller bloom
     close   difficult symptoms: more intense draws the flower back into
             a tight bud. Contraction, not a dying flower.
   --------------------------------------------------------------- */

/** All 25 frames packed into one 5×5 sheet (330×208 each), so the whole
 *  bloom loads as a single small image and changing frame is only a shift. */
export const BLOOM_SHEET = require("../../assets/images/bloom-sheet.png");
export const BLOOM_COUNT = 25;
export const BLOOM_COLUMNS = 5;
export const BLOOM_FRAME = { width: 330, height: 208 };

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** Which frame to show for an intensity between 1 and 5 (fractions allowed while dragging). */
export const bloomFrame = (level, direction = "open", count = BLOOM_COUNT) => {
  const t = (clamp(level, 1, 5) - 1) / 4;
  return Math.round((direction === "open" ? t : 1 - t) * (count - 1));
};

/** The intensity in words, so the level is never shown by the flower alone. */
export const INTENSITY_WORDS = ["Very mild", "Mild", "Moderate", "Intense", "Very intense"];

export const intensityWord = (level) => INTENSITY_WORDS[clamp(Math.round(level), 1, 5) - 1];
