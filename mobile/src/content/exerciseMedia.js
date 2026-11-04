/* ---------------------------------------------------------------
   EXERCISE PICTURES — for Selena's private, personal use only.

   Still 180×180 pictures, loaded from the exercises-dataset repository
   on GitHub (github.com/hasaneyldrm/exercises-dataset), where they are
   published with Gym visual's permission. They are © Gym visual —
   https://gymvisual.com/ — and are NOT licensed to Selena: nothing is
   copied into this project, and they must be removed, or licensed from
   Gym visual, before the app is ever shared or released.

   `gv` on an exercise is the picture's file name, e.g. "0001-2gPfomN".
   Without a picture an exercise shows the body figure alone.
   --------------------------------------------------------------- */

const BASE = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/images/";

export const PICTURE_CREDIT = "© Gym visual — gymvisual.com";

/** The picture for an exercise, or null. */
export const exercisePicture = (ex) => (ex?.gv ? { uri: `${BASE}${ex.gv}.jpg` } : null);
