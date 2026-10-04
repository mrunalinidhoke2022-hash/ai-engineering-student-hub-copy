import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Loader2, UserPlus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import RegisterProgress from "@/components/auth/RegisterProgress";
import AccountStep from "@/components/auth/register/AccountStep";
import ContactStep from "@/components/auth/register/ContactStep";
import PasswordStep from "@/components/auth/register/PasswordStep";
import EmailCodeStep from "@/components/auth/register/EmailCodeStep";
import MobileCodeStep from "@/components/auth/register/MobileCodeStep";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { describeError } from "@/lib/authErrors";
import {
  buildUserId,
  isValidEmail,
  isValidMobile,
  isValidUsername,
  passwordMeetsRules,
  validatePhoto,
} from "@/lib/registration";
import { safeReturnTo } from "@/lib/authReturnTo";

// Six steps, in the only order that actually works: the platform creates the account with the
// password (step 3) so it can then send its own email code (step 4); the account stays unusable
// until that code is verified. The mobile code (step 5) comes after sign-in exists, because our
// verification is bound to the signed-in account.
const STEP_KEYS = ["account", "contact", "password", "email", "mobile", "done"];
const EMAIL_COOLDOWN_SECONDS = 60;

export default function Register() {
  const { t, language } = useLanguage();
  const returnTo = safeReturnTo();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [code, setCode] = useState("");
  const [mobileCode, setMobileCode] = useState("");
  const [error, setError] = useState("");
  const [invalidField, setInvalidField] = useState("");
  const [busy, setBusy] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [sms, setSms] = useState({ state: "idle", attemptsLeft: null });
  const [created, setCreated] = useState(false);
  const [finishError, setFinishError] = useState("");

  const goTo = useCallback((next) => {
    setError("");
    setInvalidField("");
    setStep(next);
  }, []);

  // Resend cooldown for the email code. The platform decides how long its codes stay valid;
  // this only stops a student from firing requests off in a loop.
  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const handlePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (validatePhoto(file)) {
      setError(t("register.account.photoHint"));
      return;
    }
    setError("");
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setPhotoUrl(file_url);
    } catch {
      setError(t("errors.generic"));
    } finally {
      setUploading(false);
    }
  };

  const submitAccount = () => {
    if (form.fullName.trim().replace(/\s+/g, " ").length < 3) {
      setInvalidField("name");
      setError(t("register.account.errName"));
      return;
    }
    if (form.username.trim() && !isValidUsername(form.username)) {
      setInvalidField("username");
      setError(t("register.account.errUsername"));
      return;
    }
    goTo(1);
  };

  const submitContact = async () => {
    if (!isValidEmail(form.email)) {
      setInvalidField("email");
      setError(t("register.contact.errEmail"));
      return;
    }
    if (!isValidMobile(form.mobile)) {
      setInvalidField("mobile");
      setError(t("register.contact.errMobile"));
      return;
    }
    setError("");
    setInvalidField("");
    setBusy(true);

    // A courtesy pre-check so a taken name or User ID is caught while the form is still open.
    // It never blocks the flow: the answer that matters is enforced by the server when the
    // identity record is created, so a throttled or failed check just moves the student on.
    let verdict = null;
    try {
      const response = await base44.functions.invoke("checkIdentity", {
        full_name: form.fullName,
        username: form.username,
        email: form.email,
        mobile: form.mobile,
      });
      verdict = response?.data || null;
    } catch {
      verdict = null;
    }
    setBusy(false);

    if (verdict?.available === false) {
      if (verdict.field === "name" || verdict.field === "username") {
        setInvalidField(verdict.field);
        setError(verdict.field === "name" ? t("errors.nameTaken") : t("errors.usernameTaken"));
        setStep(0);
        return;
      }
      setError(describeError(t, verdict));
      return;
    }

    // A student who came back to correct a detail has already got a verified account: there is
    // no email code left to send, so a corrected mobile number finishes the identity instead.
    // A different email address, though, needs its own account and its own code.
    if (accountCreated && form.email.trim().toLowerCase() === registeredEmail) {
      finishRegistration();
      return;
    }
    setStep(2);
  };

  const submitPassword = async () => {
    if (!passwordMeetsRules(form.password)) {
      setError(t("register.password.errWeak"));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t("register.password.errMismatch"));
      return;
    }
    setError("");
    const email = form.email.trim().toLowerCase();
    if (accountCreated && email === registeredEmail) {
      setStep(3);
      return;
    }
    setBusy(true);
    try {
      // The address is not usable until the platform's code is verified below.
      await base44.auth.register({ email, password: form.password });
      setAccountCreated(true);
      setRegisteredEmail(email);
      setResendIn(EMAIL_COOLDOWN_SECONDS);
      setStep(3);
    } catch (err) {
      setError(describeError(t, err, "register.email.exists"));
    } finally {
      setBusy(false);
    }
  };

  const submitEmailCode = async () => {
    setError("");
    setBusy(true);
    try {
      const session = await base44.auth.verifyOtp({ email: form.email, otpCode: code.trim() });
      base44.auth.setToken(session.access_token);
      setSms({ state: "idle", attemptsLeft: null });
      setStep(4);
    } catch (err) {
      setError(describeError(t, err, "otp.invalid"));
    } finally {
      setBusy(false);
    }
  };

  const resendEmailCode = async () => {
    if (resendIn > 0) return;
    setError("");
    try {
      await base44.auth.resendOtp(form.email);
      setResendIn(EMAIL_COOLDOWN_SECONDS);
    } catch (err) {
      setError(describeError(t, err));
    }
  };

  const sendMobileCode = async () => {
    setError("");
    setBusy(true);
    try {
      const response = await base44.functions.invoke("sendMobileOtp", { mobile: form.mobile });
      const delivery = response?.data?.delivery;
      if (delivery === "sent") setSms({ state: "sent", attemptsLeft: null });
      else if (delivery === "already_verified") setSms({ state: "verified", attemptsLeft: null });
      else setSms({ state: "unavailable", attemptsLeft: null });
    } catch (err) {
      const reason = err?.response?.data?.code;
      if (reason === "COOLDOWN" || reason === "TOO_MANY") {
        // Asking again too soon is not a missing gateway: keep the code box open and say so.
        setError(describeError(t, err, "otp.tooMany"));
      } else {
        // No SMS gateway is connected yet (or the send failed). The number can still be verified
        // later from Profile → Security, so this step never traps a student mid-registration.
        setSms({ state: "unavailable", attemptsLeft: null });
      }
    } finally {
      setBusy(false);
    }
  };

  const verifyMobileCode = async () => {
    setError("");
    setBusy(true);
    try {
      const response = await base44.functions.invoke("verifyMobileOtp", {
        mobile: form.mobile,
        code: mobileCode.trim(),
      });
      if (response?.data?.verified) {
        setSms({ state: "verified", attemptsLeft: null });
        return;
      }
      setError(describeError(t, response?.data, "otp.invalid"));
    } catch (err) {
      setError(describeError(t, err, "otp.invalid"));
      setSms((current) => ({ ...current, attemptsLeft: err?.response?.data?.attemptsLeft ?? current.attemptsLeft }));
    } finally {
      setBusy(false);
    }
  };

  const finishRegistration = async () => {
    setStep(5);
    setFinishError("");
    setBusy(true);
    try {
      const response = await base44.functions.invoke("completeRegistration", {
        full_name: form.fullName,
        username: buildUserId(form.username),
        mobile: form.mobile,
        photo_url: photoUrl,
      });
      if (response?.data?.error) {
        setFinishError(describeError(t, response.data));
        return;
      }
      // Keep the account itself in step with the profile that was just created, including the
      // language the student picked — so it follows them to their next device too.
      await base44.auth
        .updateMe({
          mobile: form.mobile,
          photo_url: photoUrl,
          student_user_id: response?.data?.profile?.user_id,
          language,
        })
        .catch(() => {});
      setCreated(true);
      setTimeout(() => {
        window.location.href = returnTo;
      }, 1500);
    } catch (err) {
      setFinishError(describeError(t, err));
    } finally {
      setBusy(false);
    }
  };

  const stepForms = [submitAccount, submitContact, submitPassword];

  return (
    <AuthLayout
      icon={UserPlus}
      wide
      title={t("auth.register.title")}
      subtitle={t("auth.register.subtitle")}
      progress={step < 5 ? <RegisterProgress keys={STEP_KEYS} current={step} /> : null}
      footer={
        <>
          {t("auth.register.haveAccount")}{" "}
          <Link
            to={"/login" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="font-medium text-brand-ink hover:underline"
          >
            {t("auth.register.signIn")}
          </Link>
        </>
      }
    >
      {step === 0 ? (
        <>
          <Button
            variant="outline"
            className="mb-5 h-12 w-full text-sm font-medium"
            onClick={() => base44.auth.loginWithProvider("google", returnTo)}
          >
            <GoogleIcon className="mr-2 h-5 w-5" />
            {t("auth.register.google")}
          </Button>
          <p className="mb-5 text-center text-xs text-muted-foreground">{t("auth.register.noAccountYet")}</p>
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">{t("common.or")}</span>
            </div>
          </div>
        </>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      ) : null}

      {step < 3 ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            stepForms[step]();
          }}
        >
          {step === 0 ? (
            <AccountStep
              form={form}
              setForm={setForm}
              photoUrl={photoUrl}
              onPickPhoto={handlePhoto}
              uploading={uploading}
              invalidField={invalidField}
            />
          ) : null}
          {step === 1 ? <ContactStep form={form} setForm={setForm} invalidField={invalidField} /> : null}
          {step === 2 ? <PasswordStep form={form} setForm={setForm} /> : null}

          <Button type="submit" className="h-12 w-full font-medium" disabled={busy || uploading}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("common.loading")}
              </>
            ) : (
              t("common.continue")
            )}
          </Button>
        </form>
      ) : null}

      {step === 3 ? (
        <EmailCodeStep
          email={form.email}
          code={code}
          setCode={setCode}
          onSubmit={submitEmailCode}
          onResend={resendEmailCode}
          onBack={() => goTo(1)}
          busy={busy}
          resendIn={resendIn}
        />
      ) : null}

      {step === 4 ? (
        <MobileCodeStep
          mobile={form.mobile}
          state={sms.state}
          busy={busy}
          code={mobileCode}
          setCode={setMobileCode}
          attemptsLeft={sms.attemptsLeft}
          onSend={sendMobileCode}
          onVerify={verifyMobileCode}
          onContinue={finishRegistration}
          onChangeMobile={() => goTo(1)}
        />
      ) : null}

      {step === 5 ? (
        <div className="space-y-4 text-center">
          {finishError ? (
            <>
              <p className="text-sm text-destructive">{finishError}</p>
              <Button variant="outline" className="h-12 w-full" onClick={() => goTo(1)}>
                {t("register.mobile.changeMobile")}
              </Button>
              <Button className="h-12 w-full" onClick={finishRegistration} disabled={busy}>
                {t("common.retry")}
              </Button>
            </>
          ) : created ? (
            <>
              <BadgeCheck className="mx-auto h-9 w-9 text-success" aria-hidden="true" />
              <p className="font-heading text-lg font-bold">{t("register.done.created")}</p>
              <p className="text-xs text-muted-foreground">{t("auth.securityNote")}</p>
              <Button
                className="h-12 w-full font-medium"
                onClick={() => {
                  window.location.href = returnTo;
                }}
              >
                {t("register.done.goHome")}
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">{t("register.done.desc")}</p>
            </>
          )}
        </div>
      ) : null}

      {step > 0 && step < 3 ? (
        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          onClick={() => goTo(step - 1)}
        >
          {t("common.back")}
        </button>
      ) : null}
    </AuthLayout>
  );
}