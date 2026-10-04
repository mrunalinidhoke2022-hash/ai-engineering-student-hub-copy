import React from "react";
import { Upload, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { buildUserId } from "@/lib/registration";

// Step 1 — who the student is. The User ID preview updates as they type, so nobody is
// surprised later by the handle teammates will search for.
export default function AccountStep({ form, setForm, photoUrl, onPickPhoto, uploading, invalidField }) {
  const { t } = useLanguage();
  const preview = buildUserId(form.username || form.fullName);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">{t("common.fullName")}</Label>
        <Input
          id="fullName"
          autoFocus
          value={form.fullName}
          onChange={(event) => setForm({ ...form, fullName: event.target.value })}
          placeholder={t("register.account.namePlaceholder")}
          className={`h-12 ${invalidField === "name" ? "border-destructive" : ""}`}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">{t("common.username")}</Label>
        <Input
          id="username"
          value={form.username}
          onChange={(event) => setForm({ ...form, username: event.target.value })}
          placeholder={t("register.account.usernamePlaceholder")}
          className={`h-12 uppercase ${invalidField === "username" ? "border-destructive" : ""}`}
        />
        <p className="text-xs text-muted-foreground">{t("register.account.usernameHint")}</p>
        {preview ? (
          <p className="text-xs text-muted-foreground">
            {t("identity.userId")}:{" "}
            <span className="font-mono font-semibold text-foreground">{preview}</span>
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo">{t("register.account.photo")}</Label>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            )}
          </span>
          <label
            htmlFor="photo"
            className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input px-3 text-sm font-medium hover:bg-accent ${
              uploading ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {uploading ? t("common.loading") : photoUrl ? t("register.account.changePhoto") : t("register.account.uploadPhoto")}
          </label>
          <input
            id="photo"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={onPickPhoto}
            disabled={uploading}
          />
        </div>
        <p className="text-xs text-muted-foreground">{t("register.account.photoHint")}</p>
      </div>
    </div>
  );
}