import React, { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { TimeWheel } from "../ui/TimeWheel";
import { useApp } from "../state/AppState";
import { ACTIVITY_KINDS, KIND, INTENSITY, caloriesFor, weightOf, youTubeId, fetchVideoTitle, readVideo } from "../lib/activity";
import { diaryDay, dayLabel, OLIVE } from "../ui/food";
import { T, F } from "../ui/theme";
import { Screen, Body, Serif, Chip, IconBtn, s } from "../ui/kit";

/* ---------------------------------------------------------------
   ADD AN ACTIVITY — what, how long, and optionally the YouTube video
   it came from. The video's title is fetched from its link; only the
   link is sent to YouTube to do that.
   --------------------------------------------------------------- */


export function ActivityAdd() {
  const params = useLocalSearchParams();
  const { addActivity, profile, hideNumbers, todayKey } = useApp();
  const date = diaryDay(params.date, todayKey);
  const [kind, setKind] = useState(KIND[params.kind] ? params.kind : "walk");
  const [minutes, setMinutes] = useState(30);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [looking, setLooking] = useState(false);
  const [intensity, setIntensity] = useState("moderate");
  // what the video's title told us, shown so she can see why the form changed
  const [fromVideo, setFromVideo] = useState(null);
  const back = () => (router.canGoBack?.() ? router.back() : router.replace("/workouts"));
  const videoId = youTubeId(url);

  // fill in the video's title once a real YouTube link is there
  useEffect(() => {
    if (!videoId) return undefined;
    let alive = true;
    setLooking(true);
    fetchVideoTitle(url)
      .then((t) => {
        if (!alive || !t) return;
        setTitle((cur) => cur || t);
        // the title says what kind of workout it is and how long: use it
        const seen = readVideo(t);
        if (seen.kind) setKind(seen.kind);
        if (seen.minutes) setMinutes(seen.minutes);
        if (seen.intensity) setIntensity(seen.intensity);
        setFromVideo(seen.kind || seen.minutes || seen.intensity ? seen : null);
      })
      .catch(() => {})
      .finally(() => alive && setLooking(false));
    return () => {
      alive = false;
    };
  }, [videoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const kcal = caloriesFor({ kind, minutes, intensity }, weightOf(profile));
  const save = () => {
    addActivity(
      {
        kind,
        minutes,
        intensity: KIND[kind].met > 0 ? intensity : null,
        title: title.trim() || null,
        url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
        note: note.trim() || null,
      },
      date
    );
    back();
  };

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Pressable onPress={save} disabled={minutes <= 0} accessibilityRole="button" accessibilityLabel="Save activity" style={[styles.primary, minutes <= 0 && { opacity: 0.45 }]}>
            <Text style={styles.primaryText}>Save activity</Text>
          </Pressable>
        </View>
      }
    >
      <View style={[s.row, { gap: 12, marginBottom: 16 }]}>
        <IconBtn label="Back" onPress={back}>
          <ArrowLeft size={20} color={T.ink} />
        </IconBtn>
        <View>
          <Serif size={24} accessibilityRole="header">
            Add an activity
          </Serif>
          {date !== todayKey && <Body size={13}>{dayLabel(date, todayKey)}</Body>}
        </View>
      </View>

      <Text style={styles.label}>What did you do?</Text>
      <View style={[s.row, { flexWrap: "wrap", gap: 8, marginBottom: 18 }]}>
        {ACTIVITY_KINDS.map((k) => (
          <Chip key={k.key} label={k.label} selected={kind === k.key} onPress={() => setKind(k.key)} />
        ))}
      </View>

      {KIND[kind].met > 0 && (
        <>
          <Text style={styles.label}>How hard did it feel?</Text>
          <View style={[s.row, { gap: 8, marginBottom: 18 }]}>
            {INTENSITY.map((i) => (
              <Chip key={i.key} label={i.label} selected={intensity === i.key} onPress={() => setIntensity(i.key)} />
            ))}
          </View>
        </>
      )}

      <Text style={styles.label}>How long?</Text>
      <View style={{ marginBottom: 18 }}>
        <TimeWheel minutes={minutes} onChange={setMinutes} />
      </View>

      <Text style={styles.label}>From a YouTube video? (optional)</Text>
      <TextInput
        value={url}
        onChangeText={setUrl}
        placeholder="Paste the link, e.g. youtu.be/…"
        placeholderTextColor={T.inkSoft}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        accessibilityLabel="YouTube link"
        style={styles.input}
      />
      {!!url && !videoId && <Body size={12.5}>That doesn't look like a YouTube link yet.</Body>}
      {looking && <Body size={12.5}>Finding the video's title…</Body>}
      {fromVideo && (
        <Body size={12.5} testID="from-video">
          {`From the video: ${[fromVideo.kind && KIND[fromVideo.kind].label, fromVideo.minutes && `${fromVideo.minutes} min`, fromVideo.intensity && INTENSITY.find((i) => i.key === fromVideo.intensity).label.toLowerCase()].filter(Boolean).join(", ")}. Change anything that's off.`}
        </Body>
      )}

      <Text style={[styles.label, { marginTop: 14 }]}>Name (optional)</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={kind === "yoga" ? "e.g. Gentle evening yoga" : "e.g. Evening walk"}
        placeholderTextColor={T.inkSoft}
        accessibilityLabel="Activity name"
        style={styles.input}
      />

      <Text style={[styles.label, { marginTop: 14 }]}>How did it feel? (optional)</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="A note for yourself"
        placeholderTextColor={T.inkSoft}
        accessibilityLabel="Note"
        multiline
        style={[styles.input, { minHeight: 80, textAlignVertical: "top", paddingTop: 12 }]}
      />

      {!hideNumbers && KIND[kind].met > 0 && (
        <Body size={13} style={{ marginTop: 14 }} testID="activity-kcal">{`About ${kcal} kcal${profile.body?.kg ? "" : ", estimated for an average weight"}`}</Body>
      )}
      {kind === "meditation" && (
        <Body size={13} style={{ marginTop: 14 }}>
          Meditation is counted in your journey as calm minutes, not calories.
        </Body>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: F.sansMed, fontSize: 13, color: T.inkSoft, marginBottom: 8 },
  minutes: { fontFamily: F.serif, fontSize: 24, color: T.ink, minWidth: 90, textAlign: "center" },
  input: { minHeight: 48, paddingHorizontal: 16, borderWidth: 1, borderColor: T.hair, backgroundColor: T.surface, fontFamily: F.sans, fontSize: 15, color: T.ink },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18, backgroundColor: T.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.hair },
  primary: { minHeight: 52, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center" },
  primaryText: { fontFamily: F.sansMed, fontSize: 15.5, color: T.canvas },
});
