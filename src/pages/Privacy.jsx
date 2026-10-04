import React from "react";
import LegalPage from "@/components/legal/LegalPage";

const SECTIONS = [
  {
    heading: "Who we are",
    body: [
      "DEVLAUNCH is a free learning and building platform for engineering students, designed and maintained by the student team MrunalTech. This policy explains what we collect when you use the app, why we collect it, and what control you have over it.",
      "For any privacy question or request, use the Contact page or write to mrunaltech9@gmail.com.",
    ],
  },
  {
    heading: "What we collect",
    bullets: [
      "Account details: your name, email address and role, plus your mobile number if you choose to verify it.",
      "Profile and preference details you enter: year of study, branch, skills, interests, learning goals, language and theme.",
      "Learning activity: saved toolkit items, bookmarks, lesson and challenge progress, XP, coins, streaks, badges, coding problem attempts and answers.",
      "Team activity: the teams you belong to, tasks you create or update, and comments you post in a team workspace.",
      "Content you submit: project ideas you generate roadmaps from, code you save for an AI review, answers to practice challenges, content issue reports and contact messages.",
      "Technical data: basic usage events (for example that a coding problem was attempted) and local device storage such as your language and theme choice and the last code you typed in a challenge workspace.",
    ],
  },
  {
    heading: "How we use it",
    body: [
      "We use this data to run the features you ask for: signing you in, saving your progress, showing your dashboard, toolkit and leaderboard position, generating roadmaps and AI feedback, keeping team workspaces working, and verifying your contact details when you enable them.",
      "We also use aggregated usage signals to decide what to improve next, and we keep security records such as one-time-code attempts so that verification cannot be abused.",
    ],
  },
  {
    heading: "AI features and your content",
    body: [
      "When you use the AI Mentor, the Project Roadmap Generator or an AI code review, the text or code you submit is sent to a third-party AI model provider through our platform's integration layer so that a response can be generated. Do not submit anything confidential, and do not submit another person's work as your own.",
      "AI code reviews are stored against your account so you can read them again later. AI output can be wrong or incomplete, and it is not professional advice.",
      "Your practice code is never executed on our servers. The challenge workspace is a text editor: it stores what you type in your browser and, when you save, in your account. Running code requires an external sandboxed execution service, which is only enabled if it is configured.",
    ],
  },
  {
    heading: "Who we share it with",
    body: [
      "We do not sell your personal data and we do not share it for advertising. We use service providers strictly to run the app: Base44 for hosting, database, authentication and integrations; AI model providers for AI features; an SMS provider for mobile verification when it is configured; and the sign-in provider you choose (for example Google) when you sign in with it. If you install the app from the Google Play Store or Apple App Store, the store processes the app delivery under its own policy.",
    ],
  },
  {
    heading: "Storage, retention and your control",
    body: [
      "Your data is stored on our platform provider's infrastructure for as long as your account exists. You can edit your profile at any time in your Profile page.",
      "You can delete your account and the data tied to it from Profile → Delete account. That removes your profile, toolkit, learning progress and project roadmaps; your sign-in account itself is managed by the platform, so contact us if you want that closed as well. Backups and security logs may persist briefly before they are rotated out.",
    ],
  },
  {
    heading: "Cookies and local storage",
    body: [
      "We use your browser's local storage for functional purposes only: remembering your language and theme, keeping your sign-in session, and keeping unsaved code in a challenge workspace on your own device. We do not use advertising cookies.",
    ],
  },
  {
    heading: "Age",
    body: [
      "DEVLAUNCH is built for college-age engineering students and is not directed at children under 13. If you are under 18, use the platform with the knowledge and consent of a parent or guardian.",
    ],
  },
  {
    heading: "Changes to this policy",
    body: [
      "If we change how we handle your data, we will update this page and change the date at the top. Continuing to use DEVLAUNCH after an update means you accept the revised policy.",
    ],
  },
];

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="4 October 2026"
      metaDescription="How DEVLAUNCH collects, uses, stores and deletes your data, and the control you have over it."
      intro="This policy covers the DEVLAUNCH web app and the mobile app published from it. It is written to be readable rather than legalistic — if anything here is unclear, ask us and we will explain it."
      sections={SECTIONS}
    />
  );
}