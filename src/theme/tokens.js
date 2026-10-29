/* ---------------------------------------------------------------
   DESIGN TOKENS — "Selena"
   A calming, high-end digital journal. Organic, never clinical.
   No neon greens, and never pure white as a surface.
   --------------------------------------------------------------- */

export const tokens = {
  alabaster: "#F2EFE6", // app background
  paper: "#EAE5D8", // cards, paper texture base
  ink: "#2A2622", // body text
  inkMuted: "#5E574E", // secondary text
  aegean: "#1F3A5F", // privacy / rest / Inward, Triad Tracker
  forest: "#14211C", // Cycle Calendar background
  sage: "#5B6B4A", // success, checkmarks, Steady
  terracotta: "#A44A33", // high energy / Outward
};

/** Working palette used across components, built only from the tokens.
 *  Text colours are solid tokens so every pair can be contrast-tested. */
export const T = {
  canvas: tokens.alabaster,
  canvasWarm: tokens.paper,
  canvasDeep: "#DFD8C7",
  surface: tokens.paper,
  aegean: tokens.aegean,
  terracotta: tokens.terracotta,
  sage: tokens.sage,
  olive: tokens.sage,
  ink: tokens.ink,
  inkSoft: tokens.inkMuted,
  inkFaint: tokens.inkMuted,
  hair: "rgba(42,38,34,0.14)",
  mental: "#4E5288",
  forest: tokens.forest,
};

/** Text colours used on the dark Aegean screens. Alpha is kept high
 *  enough that each still clears 4.5:1 once composited on Aegean. */
export const DARK_TEXT = {
  text: tokens.alabaster,
  textSoft: "rgba(242,239,230,0.82)",
  textFaint: "rgba(242,239,230,0.74)",
};

/** Per-screen palette. Dark screens invert ink to canvas and go glassy. */
export const tone = (dark) =>
  dark
    ? {
        ...DARK_TEXT,
        hair: "rgba(242,239,230,0.26)",
        surface: "rgba(242,239,230,0.08)",
        surfaceDeep: "rgba(242,239,230,0.16)",
      }
    : {
        text: T.ink,
        textSoft: T.inkSoft,
        textFaint: T.inkFaint,
        hair: T.hair,
        surface: T.surface,
        surfaceDeep: T.canvasDeep,
      };

export const MIN_TOUCH = 44;
