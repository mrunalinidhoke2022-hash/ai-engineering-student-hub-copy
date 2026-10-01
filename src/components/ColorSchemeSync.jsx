import { useEffect } from "react";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Keeps the app's colour scheme in step with the device setting
 * (Android/iOS dark mode, desktop OS theme) and with later changes
 * while the app is open. Renders nothing.
 */
export default function ColorSchemeSync() {
  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const apply = (isDark) => document.documentElement.classList.toggle("dark", isDark);

    apply(media.matches);
    const onChange = (event) => apply(event.matches);
    media.addEventListener("change", onChange);

    return () => media.removeEventListener("change", onChange);
  }, []);

  return null;
}