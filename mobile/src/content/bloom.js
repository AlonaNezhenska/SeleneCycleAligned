/* ---------------------------------------------------------------
   THE PEONY — the one flower behind every intensity slider.

   25 frames from flowerbloom.gif, closed bud to full bloom, cropped and
   with the sage background made transparent. The slider shows one frame
   at a time, so the same flower moves as you drag:

     open    positive states (calm, energy, glow…): more is a fuller bloom
     close   difficult symptoms: more intense draws the flower back into
             a tight bud. Contraction, not a dying flower.
   --------------------------------------------------------------- */

export const BLOOM_FRAMES = [
  require("../../assets/images/bloom/bloom-00.png"),
  require("../../assets/images/bloom/bloom-01.png"),
  require("../../assets/images/bloom/bloom-02.png"),
  require("../../assets/images/bloom/bloom-03.png"),
  require("../../assets/images/bloom/bloom-04.png"),
  require("../../assets/images/bloom/bloom-05.png"),
  require("../../assets/images/bloom/bloom-06.png"),
  require("../../assets/images/bloom/bloom-07.png"),
  require("../../assets/images/bloom/bloom-08.png"),
  require("../../assets/images/bloom/bloom-09.png"),
  require("../../assets/images/bloom/bloom-10.png"),
  require("../../assets/images/bloom/bloom-11.png"),
  require("../../assets/images/bloom/bloom-12.png"),
  require("../../assets/images/bloom/bloom-13.png"),
  require("../../assets/images/bloom/bloom-14.png"),
  require("../../assets/images/bloom/bloom-15.png"),
  require("../../assets/images/bloom/bloom-16.png"),
  require("../../assets/images/bloom/bloom-17.png"),
  require("../../assets/images/bloom/bloom-18.png"),
  require("../../assets/images/bloom/bloom-19.png"),
  require("../../assets/images/bloom/bloom-20.png"),
  require("../../assets/images/bloom/bloom-21.png"),
  require("../../assets/images/bloom/bloom-22.png"),
  require("../../assets/images/bloom/bloom-23.png"),
  require("../../assets/images/bloom/bloom-24.png"),
];

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** Which frame to show for an intensity between 1 and 5 (fractions allowed while dragging). */
export const bloomFrame = (level, direction = "open", count = BLOOM_FRAMES.length) => {
  const t = (clamp(level, 1, 5) - 1) / 4;
  return Math.round((direction === "open" ? t : 1 - t) * (count - 1));
};

/** The intensity in words, so the level is never shown by the flower alone. */
export const INTENSITY_WORDS = ["Very mild", "Mild", "Moderate", "Intense", "Very intense"];

export const intensityWord = (level) => INTENSITY_WORDS[clamp(Math.round(level), 1, 5) - 1];
