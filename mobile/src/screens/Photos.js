import React, { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput, Image, Modal, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ArrowLeft, Camera, ImagePlus, Trash2 } from "lucide-react-native";
import { useApp } from "../state/AppState";
import { keepPhoto } from "../lib/photos";
import { dayLabel, OLIVE } from "../ui/food";
import { T, F } from "../ui/theme";
import { Screen, Body, Serif, Card, IconBtn, ToggleRow, s } from "../ui/kit";

/* ---------------------------------------------------------------
   PROGRESS PHOTOS — her body over time, with a note for each photo.

   Photos stay on this phone, are never backed up, and the top of each
   one is softened on screen, where a face usually sits. An optional
   reminder offers a photo after training; it never insists.
   --------------------------------------------------------------- */

/** A photo with the face area softened, as in the baseline Polaroid. */
export const SoftPhoto = ({ uri, height = 220, label }) => (
  <View style={{ height, overflow: "hidden", backgroundColor: T.canvasDeep }}>
    <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel={label} />
    <View style={{ position: "absolute", left: 0, right: 0, top: 0, height: "38%", overflow: "hidden" }}>
      <Image source={{ uri }} blurRadius={28} style={{ width: "100%", height }} resizeMode="cover" />
    </View>
  </View>
);

/** Take or choose a photo; resolves to a permanent uri, or null. */
export const pickPhoto = async (fromCamera) => {
  if (fromCamera) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return { error: "Camera access is off. You can choose a photo from your library instead." };
  }
  const opts = { mediaTypes: ["images"], quality: 0.7, allowsEditing: true, aspect: [4, 5] };
  const result = fromCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (result.canceled || !result.assets?.[0]) return null;
  return { uri: await keepPhoto(result.assets[0].uri) };
};

export function Photos() {
  const params = useLocalSearchParams();
  const { photos, addPhoto, updatePhoto, removePhoto, profile, setProfile, todayKey } = useApp();
  const [draft, setDraft] = useState(null);
  const [message, setMessage] = useState(null);
  const back = () => (router.canGoBack?.() ? router.back() : router.replace("/profile"));

  const take = async (fromCamera) => {
    setMessage(null);
    try {
      const got = await pickPhoto(fromCamera);
      if (got?.error) setMessage(got.error);
      else if (got?.uri) setDraft({ uri: got.uri, note: "" });
    } catch {
      setMessage("The camera isn't available here. You can choose a photo from your library instead.");
    }
  };

  // opened from the after-training nudge: go straight to the camera
  useEffect(() => {
    if (params.take === "1") take(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Screen>
      <View style={[s.row, { gap: 12 }]}>
        <IconBtn label="Back" onPress={back}>
          <ArrowLeft size={20} color={T.ink} />
        </IconBtn>
        <Serif size={24} accessibilityRole="header">
          Progress photos
        </Serif>
      </View>
      <Body size={13} style={{ marginTop: 10, marginBottom: 14 }}>
        Only on this phone, never backed up. The top of each photo is softened on screen.
      </Body>

      <View style={[s.row, { gap: 10, marginBottom: 14 }]}>
        <Pressable onPress={() => take(true)} accessibilityRole="button" accessibilityLabel="Take a photo" style={[styles.btn, { backgroundColor: OLIVE, borderColor: OLIVE }]}>
          <Camera size={16} color={T.canvas} />
          <Text style={[styles.btnText, { color: T.canvas }]}>Take a photo</Text>
        </Pressable>
        <Pressable onPress={() => take(false)} accessibilityRole="button" accessibilityLabel="Choose from library" style={styles.btn}>
          <ImagePlus size={16} color={T.ink} />
          <Text style={styles.btnText}>Choose</Text>
        </Pressable>
      </View>
      {message && <Body size={12.5} style={{ marginBottom: 10 }}>{message}</Body>}

      <ToggleRow
        label="A gentle reminder after training"
        sublabel="After you log a workout, yoga or a walk, Selena offers to take a photo. Never more than that."
        leftLabel="Off"
        rightLabel="On"
        value={!!profile.photoReminder}
        onChange={(v) => setProfile({ photoReminder: v })}
      />

      <View style={styles.grid} testID="photo-grid">
        {photos.map((p) => (
          <Card key={p.id} style={styles.cell}>
            <SoftPhoto uri={p.uri} height={190} label={`Progress photo, ${dayLabel(p.date, todayKey)}`} />
            <Text style={styles.date}>{dayLabel(p.date, todayKey)}</Text>
            <TextInput
              value={p.note}
              onChangeText={(note) => updatePhoto(p.id, { note })}
              placeholder="Add a note"
              placeholderTextColor={T.inkSoft}
              accessibilityLabel={`Note for photo from ${dayLabel(p.date, todayKey)}`}
              multiline
              style={styles.note}
            />
            <Pressable onPress={() => removePhoto(p.id)} accessibilityRole="button" accessibilityLabel={`Delete photo from ${dayLabel(p.date, todayKey)}`} style={[s.row, { gap: 6, minHeight: 40 }]}>
              <Trash2 size={13} color={T.terracotta} />
              <Body size={12} color={T.terracotta}>
                Delete
              </Body>
            </Pressable>
          </Card>
        ))}
        {profile.baselinePhoto && (
          <Card style={styles.cell}>
            <SoftPhoto uri={profile.baselinePhoto} height={190} label="Your baseline photo" />
            <Text style={styles.date}>Where you started</Text>
          </Card>
        )}
      </View>
      {!photos.length && !profile.baselinePhoto && (
        <Body size={13.5} style={{ textAlign: "center", marginTop: 10 }}>
          Your photos will gather here, each with its own note.
        </Body>
      )}

      <Modal visible={!!draft} transparent animationType="slide" onRequestClose={() => setDraft(null)}>
        <View style={styles.backdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setDraft(null)} accessibilityRole="button" accessibilityLabel="Close" />
          <View style={styles.sheet}>
            {draft && <SoftPhoto uri={draft.uri} height={240} label="New progress photo" />}
            <TextInput
              value={draft?.note ?? ""}
              onChangeText={(note) => setDraft((d) => ({ ...d, note }))}
              placeholder="A note: how you feel, what changed…"
              placeholderTextColor={T.inkSoft}
              accessibilityLabel="Photo note"
              multiline
              style={[styles.note, { marginTop: 12, minHeight: 70 }]}
            />
            <Pressable
              onPress={() => {
                addPhoto({ uri: draft.uri, note: draft.note.trim() });
                setDraft(null);
              }}
              accessibilityRole="button"
              accessibilityLabel="Save photo"
              style={[styles.btn, { backgroundColor: OLIVE, borderColor: OLIVE, marginTop: 12 }]}
            >
              <Text style={[styles.btnText, { color: T.canvas }]}>Save photo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  btn: { flex: 1, flexDirection: "row", gap: 8, minHeight: 48, borderWidth: 1, borderColor: T.hair, alignItems: "center", justifyContent: "center" },
  btnText: { fontFamily: F.sansMed, fontSize: 14.5, color: T.ink },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
  cell: { width: "48.5%", padding: 8, gap: 6 },
  date: { fontFamily: F.serif, fontSize: 14, color: T.ink },
  note: { minHeight: 40, fontFamily: F.serifItalic, fontSize: 13.5, color: T.ink, borderWidth: StyleSheet.hairlineWidth, borderColor: T.hair, padding: 8 },
  backdrop: { flex: 1, backgroundColor: "rgba(20,24,18,0.35)" },
  sheet: { backgroundColor: T.canvas, padding: 20, paddingBottom: 32 },
});
