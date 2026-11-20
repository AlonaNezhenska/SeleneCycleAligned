/* ---------------------------------------------------------------
   EXERCISE PICTURES — for Selena's private, personal use only.

   Gym exercises: still 180×180 pictures from the exercises-dataset
   repository on GitHub (github.com/hasaneyldrm/exercises-dataset),
   published there with Gym visual's permission; © Gym visual,
   https://gymvisual.com/. `gv` is the picture's file name.

   Yoga poses: pictures from Pocket Yoga (pocketyoga.com). `py` names the
   pose and its picture file. Only names, levels and Sanskrit names are
   kept in Selena; how to do a pose is read on Pocket Yoga's own page.

   None of these pictures are licensed to Selena: nothing is copied into
   this project, and they must be removed, or licensed, before the app is
   ever shared or released. Without a picture an exercise shows the body
   figure alone.
   --------------------------------------------------------------- */

const GYM = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/images/";
const YOGA = "https://pocketyoga.com/assets/images/";

/** The picture for an exercise, or null: small for lists, large for its page. */
export const exercisePicture = (ex, { large = false } = {}) => {
  if (ex?.py) return { uri: large ? `${YOGA}full/${ex.py.file}.png` : `${YOGA}thumbnails146/${ex.py.file}-tn146.png` };
  if (ex?.gv) return { uri: `${GYM}${ex.gv}.jpg` };
  return null;
};

/** Who the picture belongs to, shown under it. */
export const pictureCredit = (ex) => (ex?.py ? "Picture: Pocket Yoga — pocketyoga.com" : "© Gym visual — gymvisual.com");

/** Where to read how to do a pose, or null. */
export const poseGuide = (ex) => (ex?.py ? `https://www.pocketyoga.com/pose/${ex.py.name}` : null);
