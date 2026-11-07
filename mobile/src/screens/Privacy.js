import React, { useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ChevronLeft, ShieldCheck, Trash2 } from "lucide-react-native";
import { PRIVACY_AGREEMENT, PRIVACY_HEADLINE, PRIVACY_SUMMARY, DELETE_WARNING } from "../shared";
import { useApp } from "../state/AppState";
import { T, tone } from "../ui/theme";
import { Screen, IconBtn, Button, Card, Serif, Body, Eyebrow, SectionLabel, s } from "../ui/kit";
import { TrackChoices, DEFAULT_TRACKING } from "../ui/TrackChoices";
import { BackupSection } from "./Account";

/* ---------------------------------------------------------------
   YOU & YOUR DATA — what Selena follows, the optional backup, the
   agreement (readable any time) and the one button that erases it all.
   --------------------------------------------------------------- */

/** The agreement itself, used both in onboarding and on this page. */
export const AgreementText = ({ dark = false }) => {
  const c = tone(dark);
  return (
    <View style={{ gap: 14 }}>
      {PRIVACY_AGREEMENT.map(({ title, body }) => (
        <View key={title}>
          <Body size={13.5} weight="semi" color={c.text}>
            {title}
          </Body>
          <Body size={13} color={c.textSoft}>
            {body}
          </Body>
        </View>
      ))}
    </View>
  );
};

export function Privacy() {
  const { agreement, deleteAllData, profile, setProfile, backup } = useApp();
  const [confirming, setConfirming] = useState(false);

  const erase = async () => {
    await deleteAllData();
    router.replace("/onboarding");
  };

  return (
    <Screen>
      <View style={[s.row, { justifyContent: "space-between", marginBottom: 22 }]}>
        <IconBtn label="Back" onPress={() => (router.canGoBack?.() ? router.back() : router.replace("/"))}>
          <ChevronLeft size={18} color={T.ink} />
        </IconBtn>
        <Eyebrow>You & your data</Eyebrow>
        <View style={{ width: 44 }} />
      </View>

      <View style={[s.row, { gap: 10, marginBottom: 8 }]}>
        <ShieldCheck size={22} color={T.sage} strokeWidth={1.6} />
        <Serif size={26} accessibilityRole="header">
          {PRIVACY_HEADLINE}
        </Serif>
      </View>
      <Body size={14} color={T.ink} style={{ marginBottom: 20 }}>
        {PRIVACY_SUMMARY}
      </Body>

      <SectionLabel>What Selena follows</SectionLabel>
      <View style={{ marginBottom: 20 }}>
        <TrackChoices value={profile.tracking ?? DEFAULT_TRACKING} onChange={(tracking) => setProfile({ tracking })} />
      </View>

      <BackupSection backup={backup} />

      <SectionLabel>Privacy agreement</SectionLabel>
      <Card style={{ marginBottom: 20 }}>
        <AgreementText />
        {agreement?.acceptedAt && (
          <Body size={12} style={{ marginTop: 16 }}>
            {`You agreed on ${new Date(agreement.acceptedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`}
          </Body>
        )}
      </Card>

      {confirming ? (
        <Card style={{ backgroundColor: T.canvasDeep }} accessibilityLabel="Confirm delete" testID="confirm-delete">
          <Body size={13.5} weight="semi" color={T.ink} style={{ marginBottom: 4 }}>
            Delete everything?
          </Body>
          <Body size={13} style={{ marginBottom: 14 }}>
            {DELETE_WARNING}
          </Body>
          <View style={{ gap: 10 }}>
            <Button tone="warm" label="Yes, delete everything" icon={Trash2} onPress={erase} />
            <Button tone="outline" label="Keep my data" onPress={() => setConfirming(false)} />
          </View>
        </Card>
      ) : (
        <Pressable onPress={() => setConfirming(true)} accessibilityRole="button" style={styles.delete}>
          <Trash2 size={16} color={T.terracotta} />
          <Body size={14} weight="medium" color={T.terracotta}>
            Delete all my data
          </Body>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  delete: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: T.terracotta },
});
