import React from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import SiteHeader from "./SiteHeader";
import MobileBottomNav from "./MobileBottomNav";
import BackButton from "./BackButton";
import SiteFooter from "./SiteFooter";
import ActivityTracker from "@/components/ActivityTracker";

export default function AppLayout() {
  // Reuse the signed-in user already loaded by the auth provider instead of
  // asking the API for it again on every page.
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader user={user} isAdmin={user?.role === "admin"} />
      <main className="flex-1 pb-16 lg:pb-0">
        <BackButton />
        <ActivityTracker user={user} />
        <Outlet />
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}