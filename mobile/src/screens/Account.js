import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Cloud, CloudOff, Check, LogOut, Mail } from "lucide-react-native";
import { BACKUP_CATEGORIES } from "../lib/backup";
import { T, F } from "../ui/theme";
import { Card, Button, Body, SectionLabel, s } from "../ui/kit";

/* ---------------------------------------------------------------
   ONLINE BACKUP — optional sign-in by emailed code, and the boxes that
   decide exactly what leaves the phone.
   --------------------------------------------------------------- */

const STATUS_TEXT = { saving: "Backing up…", saved: "Backed up.", error: "Backup paused. It will retry on the next change." };

const Field = ({ label, ...rest }) => (
  <View style={{ marginBottom: 12 }}>
    <Body size={13} weight="medium" color={T.ink} style={{ marginBottom: 6 }}>
      {label}
    </Body>
    <TextInput
      accessibilityLabel={label}
      placeholderTextColor={T.inkSoft}
      style={styles.input}
      {...rest}
    />
  </View>
);

const SignIn = ({ backup }) => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const send = async () => {
    setBusy(true);
    setError(null);
    const err = await backup.sendLink(email);
    setBusy(false);
    if (err) setError(err);
    else setSent(true);
  };

  if (sent) {
    return (
      <View accessibilityLiveRegion="polite">
        <View style={[s.row, { gap: 8, marginBottom: 6 }]}>
          <Mail size={16} color={T.sage} />
          <Body size={13.5} weight="medium" color={T.ink}>
            Check your email
          </Body>
        </View>
        <Body size={13} style={{ marginBottom: 14 }}>
          {`We sent a sign-in link to ${email.trim()}. Open it on this phone and tap Sign in. Selena opens and you are signed in.`}
        </Body>
        <Button tone="quiet" label="Use a different email" onPress={() => setSent(false)} />
      </View>
    );
  }

  return (
    <>
      <Body size={13} style={{ marginBottom: 14 }}>
        Optional. Sign in with your email to keep a backup you can restore on a new phone. No password: we email you a
        one-time sign-in link.
      </Body>
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      {error && (
        <Body size={12.5} color={T.terracotta} style={{ marginBottom: 10 }}>
          {error}
        </Body>
      )}
      <Button
        label={busy ? "Sending…" : "Email me a sign-in link"}
        icon={Mail}
        disabled={busy || !/^\S+@\S+\.\S+$/.test(email.trim())}
        onPress={send}
      />
    </>
  );
};

const Choices = ({ backup }) => (
  <>
    <View style={[s.row, { gap: 8, marginBottom: 4 }]}>
      <Cloud size={16} color={T.sage} />
      <Body size={13} color={T.ink}>
        {`Signed in as ${backup.user.email}`}
      </Body>
    </View>
    <Body size={12.5} style={{ marginBottom: 14 }}>
      Tick what to back up. Anything you untick is deleted from the backup straight away. Your photo is never backed up.
    </Body>
    <View style={{ gap: 8, marginBottom: 12 }}>
      {BACKUP_CATEGORIES.map(({ key, label, sub }) => {
        const on = !!backup.prefs[key];
        return (
          <Pressable
            key={key}
            onPress={() => backup.setPrefs({ ...backup.prefs, [key]: !on })}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={`Back up ${label}`}
            style={[styles.choice, { borderColor: on ? T.sage : T.hair }]}
          >
            <View style={[styles.box, on && { backgroundColor: T.sage, borderColor: T.sage }]}>{on && <Check size={14} color={T.canvas} strokeWidth={2.6} />}</View>
            <View style={{ flex: 1 }}>
              <Body size={13.5} weight="medium" color={T.ink}>
                {label}
              </Body>
              <Body size={12}>{sub}</Body>
            </View>
          </Pressable>
        );
      })}
    </View>
    {STATUS_TEXT[backup.status] && (
      <Body size={12} style={{ marginBottom: 10 }} accessibilityLiveRegion="polite">
        {STATUS_TEXT[backup.status]}
      </Body>
    )}
    <Button tone="outline" label="Sign out" icon={LogOut} onPress={backup.signOut} />
    <Body size={12} style={{ marginTop: 8, textAlign: "center" }}>
      Signing out stops backups. Everything stays on this phone.
    </Body>
  </>
);

export const BackupSection = ({ backup }) => (
  <View style={{ marginBottom: 20 }}>
    <SectionLabel>Account & backup</SectionLabel>
    <Card>
      {!backup.available ? (
        <View style={[s.row, { gap: 10, alignItems: "flex-start" }]}>
          <CloudOff size={18} color={T.inkSoft} />
          <Text style={{ flex: 1, fontFamily: F.sans, fontSize: 13, lineHeight: 19, color: T.inkSoft }}>
            Online backup is not switched on in this version of Selena. Everything stays on this phone.
          </Text>
        </View>
      ) : backup.user ? (
        <Choices backup={backup} />
      ) : (
        <SignIn backup={backup} />
      )}
    </Card>
  </View>
);

const styles = StyleSheet.create({
  input: { minHeight: 48, borderWidth: 1, borderColor: T.hair, backgroundColor: T.canvas, paddingHorizontal: 14, fontFamily: F.sans, fontSize: 15, color: T.ink },
  choice: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10 },
  box: { width: 24, height: 24, borderWidth: 1.5, borderColor: T.inkSoft, alignItems: "center", justifyContent: "center" },
});
