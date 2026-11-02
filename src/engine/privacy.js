/* ---------------------------------------------------------------
   PRIVACY — the promise every user agrees to before giving any data.
   Plain language on purpose. Shared by the web and phone apps so the
   wording can never drift between them.

   Keep this true: if the app ever adds accounts, cloud sync, analytics
   or crash reporting, this text must change first and AGREEMENT_VERSION
   must go up so every user is asked again.
   --------------------------------------------------------------- */

export const AGREEMENT_VERSION = 3;

export const PRIVACY_HEADLINE = "Your data stays yours.";

export const PRIVACY_SUMMARY =
  "Everything you tell Selena stays on this device unless you choose to back it up. It is never shared, sold or used for ads.";

/** The agreement, section by section. */
export const PRIVACY_AGREEMENT = [
  {
    title: "Stored on your device",
    body: "Your cycle dates, symptoms, moods, food logs, workouts, body measurements and photo are saved on this device. Without an account there is no copy anywhere else.",
  },
  {
    title: "Backup only if you choose it",
    body: "Signing in is optional. If you do, only the categories you tick are copied to Selena's secure database (Supabase), sent encrypted and locked so that only your account can read them. Untick a category and its copy is deleted.",
  },
  {
    title: "Looking up food",
    body: "When you scan a barcode or search for a packaged food, only that barcode number or the words you typed are sent to Open Food Facts, a free public food database, to fetch the product. Nothing about you, your cycle or what you ate goes with it.",
  },
  {
    title: "Never shared with anyone",
    body: "Your data is never shared, sold, rented or given to anyone: not to advertisers, not to data brokers, not to employers or insurers. Selena has no ads, no analytics and no tracking.",
  },
  {
    title: "Only you can see it",
    body: "No other user can ever see your data, and the Selena team does not look at backups. Anyone who can unlock your device can open the app, so keep your device locked.",
  },
  {
    title: "Your photo and body measurements",
    body: "If you add a photo, or your weight, height and measurements for a food goal, they stay on this device and are never uploaded, even with backup on. Your face is blurred on screen.",
  },
  {
    title: "You are in control",
    body: "You can change what you track and what you back up at any time. Delete all my data removes everything from this device and, if you signed in, your account and backup too. Deleted data cannot be recovered.",
  },
  {
    title: "Not medical advice",
    body: "Selena offers general wellbeing guidance. It is not a medical device, not a method of contraception and not a substitute for advice from a doctor.",
  },
];

export const AGREE_LABEL =
  "I have read this and agree. My data is never shared, and nothing about me leaves this device unless I choose to back it up.";

export const DELETE_WARNING =
  "This permanently deletes every entry, your cycle details and your photo from this device, plus your account and online backup if you have one. It cannot be undone.";
