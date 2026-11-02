import { T, tokens, DARK_TEXT, MIN_TOUCH } from "../shared";

export { T, tokens, DARK_TEXT, MIN_TOUCH };

/** Font family names as registered by @expo-google-fonts. */
export const F = {
  serif: "PlayfairDisplay_400Regular",
  serifItalic: "PlayfairDisplay_400Regular_Italic",
  serifSemi: "PlayfairDisplay_600SemiBold",
  sans: "Inter_400Regular",
  sansMed: "Inter_500Medium",
  sansSemi: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
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

export const IMG = {
  hero: require("../../assets/images/hero-moon-woman.png"),
  forest: require("../../assets/images/forest-sunbeam.jpg"),
  meditate: require("../../assets/images/meditating-woman.png"),
  vault: require("../../assets/images/vault-frame.png"),
  grain: require("../../assets/images/paper-grain.png"),
  orbBody: require("../../assets/images/orbs/orb-body.jpg"),
  orbMind: require("../../assets/images/orbs/orb-mind.jpg"),
  orbFuel: require("../../assets/images/orbs/orb-fuel.jpg"),
  backgrounds: {
    home: require("../../assets/images/backgrounds/home-pink.png"),
    tracker: require("../../assets/images/backgrounds/tracker-moss.jpg"),
    cycle: require("../../assets/images/backgrounds/cycle-water.jpg"),
  },
  vibes: {
    Inward: require("../../assets/images/vibes/inward-marble.jpg"),
    Steady: require("../../assets/images/vibes/steady-pink.jpg"),
    Outward: require("../../assets/images/vibes/outward-spiral.jpg"),
  },
  onboarding: [
    require("../../assets/images/hero-moon-woman.png"),
    require("../../assets/images/wash-pink-ombre.jpg"),
    require("../../assets/images/forest-deep.jpg"),
    require("../../assets/images/wash-pink-soft.jpg"),
    require("../../assets/images/marble-dark-green.jpg"),
  ],
};
