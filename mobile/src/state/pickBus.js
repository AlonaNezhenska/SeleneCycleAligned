/* ---------------------------------------------------------------
   PICK BUS — hands exercises picked on the exercise list back to the
   screen that asked for them (the routine editor), since a route
   cannot carry a callback.
   --------------------------------------------------------------- */

let listener = null;

/** Listen for picked exercise ids; returns a function that stops listening. */
export const onPick = (fn) => {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
};

export const sendPicked = (ids) => listener?.(ids);
