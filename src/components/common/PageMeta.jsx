import { useEffect } from "react";

const MAX_DESCRIPTION = 155;

const upsertMeta = (name, content) => {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

// Keeps the page title and meta description in step with the page the user is on.
export default function PageMeta({ title, description }) {
  useEffect(() => {
    if (title) document.title = title;
    const trimmed = description?.trim();
    if (trimmed) upsertMeta("description", trimmed.slice(0, MAX_DESCRIPTION));
  }, [title, description]);

  return null;
}