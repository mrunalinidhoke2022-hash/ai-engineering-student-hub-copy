import React, { useEffect, useState } from "react";
import { BadgeCheck, Clock, LogOut, Mail, Pencil, Phone, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image } from "@/components/ui/image";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { validatePhoto, formatMobile, isValidMobile } from "@/lib/registration";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function VerifiedBadge({ verified }) {
  const { t } = useLanguage();

  return verified ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
      <BadgeCheck className="w-3.5 h-3.5" /> {t("identity.verified")}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
      <Clock className="w-3.5 h-3.5" /> {t("identity.pending")}
    </span>
  );
}

export default function IdentityPanel() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [profile, setProfile] = useState(undefined);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ full_name: "", mobile: "" });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    base44.entities.StudentProfile.filter({ account_id: user.id }, { limit: 1 }).then((page) => {
      const record = page.items[0] || null;
      setProfile(record);
      if (record) setForm({ full_name: record.full_name, mobile: record.mobile });
    });
  }, [user?.id]);

  const handlePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const problem = validatePhoto(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    setError("");
    if (!form.full_name.trim()) {
      setError(t("identity.errName"));
      return;
    }
    if (!isValidMobile(form.mobile)) {
      setError(t("identity.errMobile"));
      return;
    }
    setSaving(true);
    try {
      let photo_url = profile?.photo_url || "";
      if (photoFile) {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: photoFile });
        photo_url = file_url;
      }
      const res = await base44.functions.invoke(profile ? "updateProfile" : "completeRegistration", {
        full_name: form.full_name,
        mobile: form.mobile,
        photo_url,
      });
      if (res.data?.error) {
        setError(res.data.error);
        return;
      }
      setProfile(res.data.profile);
      setPhotoFile(null);
      setPhotoPreview("");
      setEditing(false);
      toast({ description: t("profile.updated") });
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    setError("");
    setDeleting(true);
    try {
      const res = await base44.functions.invoke("deleteMyAccount", {});
      if (res.data?.error) {
        setError(res.data.error);
        setDeleting(false);
        return;
      }
      toast({ description: t("identity.deleted") });
      await base44.auth.logout("/login");
    } catch (err) {
      setError(t("identity.errDelete"));
      setDeleting(false);
    }
  };

  if (profile === undefined) {
    return <p className="text-sm text-muted-foreground">{t("identity.loading")}</p>;
  }

  const showForm = editing || !profile;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-heading font-bold text-lg">{t("identity.title")}</h2>
        {profile && !editing && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
            <Pencil className="w-3.5 h-3.5" /> {t("identity.edit")}
          </Button>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      {!profile && (
        <p className="text-sm text-muted-foreground mt-2">{t("identity.empty")}</p>
      )}

      {profile && !showForm && (
        <div className="flex flex-col sm:flex-row gap-5 mt-4">
          <div className="w-24 h-24 rounded-full bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0">
            {profile.photo_url ? (
              <Image src={profile.photo_url} alt={profile.full_name} className="w-full h-full" fittingType="fill" />
            ) : (
              <User className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 space-y-1.5">
            <p className="font-heading font-bold text-lg">{profile.full_name}</p>
            <p className="text-sm text-muted-foreground">
              {t("identity.userId")}: <span className="font-mono font-semibold text-foreground">{profile.user_id}</span>
            </p>
            <p className="text-sm flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" /> {profile.email} <VerifiedBadge verified={profile.email_verified} />
            </p>
            <p className="text-sm flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" /> {formatMobile(profile.mobile)}{" "}
              <VerifiedBadge verified={profile.mobile_verified} />
            </p>
            <p className="text-sm text-muted-foreground">
              {t("identity.status")}: <span className="font-semibold text-foreground capitalize">{profile.status}</span> · {t("identity.registered")}{" "}
              {new Date(profile.registered_at || profile.created_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identity-photo">{t("identity.photo")}</Label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0">
                {photoPreview || profile?.photo_url ? (
                  <img
                    src={photoPreview || profile?.photo_url}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <label className="text-sm font-medium text-primary cursor-pointer">
                {photoPreview || profile?.photo_url ? t("identity.changePhoto") : t("identity.uploadPhoto")}
                <input
                  id="identity-photo"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handlePhoto}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">{t("identity.photoHint")}</p>
          </div>

          <div>
            <Label>{t("identity.fullName")}</Label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Sanchita Bhaskar Chimate"
              className="mt-1"
            />
          </div>
          <div>
            <Label>{t("identity.mobile")}</Label>
            <Input
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              placeholder="98765 43210"
              className="mt-1"
            />
          </div>
          {profile && (
            <div>
              <Label>{t("identity.userId")}</Label>
              <Input value={profile.user_id} disabled className="mt-1 font-mono" />
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="flex-1">
              {saving ? t("common.saving") : profile ? t("identity.saveChanges") : t("identity.createIdentity")}
            </Button>
            {editing && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setError("");
                  setPhotoPreview("");
                  setPhotoFile(null);
                }}
              >
                {t("common.cancel")}
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-border mt-6 pt-4 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" className="gap-2 text-destructive hover:text-destructive" onClick={() => base44.auth.logout("/login")}>
          <LogOut className="w-4 h-4" /> {t("nav.logout")}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              disabled={deleting}
              className="gap-2 text-destructive border-destructive/40 hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" /> {deleting ? t("identity.deleting") : t("identity.deleteAccount")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("identity.deleteTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("identity.deleteDesc")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t("identity.deleteConfirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}