import { MD3LightTheme, configureFonts } from "react-native-paper";
import { T, F, TOILE } from "./theme";

/* ---------------------------------------------------------------
   PAPER THEME — React Native Paper dressed as Selena.

   Square corners everywhere (roundness 0), flat surfaces, midnight navy
   for what you press, and Selena's own fonts.
   --------------------------------------------------------------- */

export const selenaTheme = {
  ...MD3LightTheme,
  roundness: 0,
  fonts: configureFonts({ config: { fontFamily: F.sans } }),
  colors: {
    ...MD3LightTheme.colors,
    primary: TOILE.navy,
    onPrimary: T.canvas,
    primaryContainer: TOILE.navy,
    onPrimaryContainer: T.canvas,
    secondary: T.sage,
    secondaryContainer: TOILE.creamDeep,
    onSecondaryContainer: TOILE.ink,
    background: T.canvas,
    surface: T.canvas,
    onSurface: T.ink,
    surfaceVariant: T.canvasDeep,
    onSurfaceVariant: T.inkSoft,
    outline: T.hair,
    outlineVariant: T.hair,
  },
};
