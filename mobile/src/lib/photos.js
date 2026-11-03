import { Directory, File, Paths } from "expo-file-system";

/* ---------------------------------------------------------------
   PROGRESS PHOTOS — kept in the app's own storage on this phone.

   A picked or taken photo starts in a temporary folder the phone may
   clear, so it is copied somewhere permanent first. Photos are never
   uploaded and never part of a backup.
   --------------------------------------------------------------- */

const FOLDER = "progress-photos";

/** Copy a photo into permanent storage; the original uri if that is not possible (web). */
export const keepPhoto = async (uri) => {
  try {
    const dir = new Directory(Paths.document, FOLDER);
    dir.create({ intermediates: true, idempotent: true });
    const dest = new File(dir, `${Date.now()}.jpg`);
    await new File(uri).copy(dest);
    return dest.uri;
  } catch {
    return uri;
  }
};

/** Delete a kept photo; nothing happens if it is already gone. */
export const forgetPhoto = (uri) => {
  try {
    if (uri?.includes(FOLDER)) new File(uri).delete();
  } catch {
    /* already gone */
  }
};
