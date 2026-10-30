/* ---------------------------------------------------------------
   DAILY MOTIVATION — one picture a day, like a photo widget.

   To add more: drop the image into assets/images/motivation/ and add
   one require() line below. The rotation picks them up on its own.
   --------------------------------------------------------------- */

export const MOTIVATION_IMAGES = [
  require("../../assets/images/motivation/motivation-01.jpg"),
  require("../../assets/images/motivation/motivation-02.jpg"),
  require("../../assets/images/motivation/motivation-03.jpg"),
  require("../../assets/images/motivation/motivation-04.jpg"),
  require("../../assets/images/motivation/motivation-05.jpg"),
  require("../../assets/images/motivation/motivation-06.jpg"),
  require("../../assets/images/motivation/motivation-07.jpg"),
  require("../../assets/images/motivation/motivation-08.jpg"),
  require("../../assets/images/motivation/motivation-09.jpg"),
  require("../../assets/images/motivation/motivation-10.jpg"),
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** The same picture all day, a new one at local midnight, cycling through the list. */
export const dailyIndex = (date, count) => {
  if (!count) return 0;
  const d = new Date(date);
  const dayNumber = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS_PER_DAY);
  return ((dayNumber % count) + count) % count;
};

export const motivationFor = (date, images = MOTIVATION_IMAGES) => images[dailyIndex(date, images.length)];
