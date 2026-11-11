import React from "react";
import { View, Image } from "react-native";
import { exercisePicture } from "../content/exerciseMedia";
import { BodyThumb } from "./BodyFigure";

/* ---------------------------------------------------------------
   EXERCISE ICON — the small square picture in lists.

   A yoga pose's picture is a tall frame with the figure somewhere in
   it, so the icon zooms onto the figure's own box (measured once, kept
   as \`py.box\`): the whole pose fits and fills the square. Gym pictures
   are square already. Without a picture, the small body figure.
   --------------------------------------------------------------- */

export const ExerciseThumb = ({ ex, size = 52 }) => {
  const picture = exercisePicture(ex);
  if (!picture) return <BodyThumb primary={ex?.p ?? []} secondary={ex?.s ?? []} size={size} />;
  const box = ex.py?.box;
  if (!box) {
    return <Image source={picture} style={{ width: size, height: size, backgroundColor: "#FFFFFF" }} resizeMode="contain" accessibilityElementsHidden importantForAccessibility="no" />;
  }
  const [x0, y0, x1, y1, w, h] = box;
  const k = (size - 6) / Math.max(x1 - x0, y1 - y0);
  return (
    <View style={{ width: size, height: size, overflow: "hidden", backgroundColor: "#FFFFFF" }} accessibilityElementsHidden importantForAccessibility="no" testID="pose-thumb">
      <Image
        source={picture}
        style={{ position: "absolute", width: w * k, height: h * k, left: (size - (x1 - x0) * k) / 2 - x0 * k, top: (size - (y1 - y0) * k) / 2 - y0 * k }}
      />
    </View>
  );
};
