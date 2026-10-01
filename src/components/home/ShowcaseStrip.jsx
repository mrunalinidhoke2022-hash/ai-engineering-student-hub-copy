import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const CARDS = [
  {
    image: "https://media.base44.com/images/public/6abb82ef0cd45cfce95f34b2/21b4cc691_generated_image.png",
    titleKey: "showcase.master.title",
    captionKey: "showcase.master.caption",
    path: "/learn",
  },
  {
    image: "https://media.base44.com/images/public/6abb82ef0cd45cfce95f34b2/6c09d4b47_generated_image.png",
    titleKey: "showcase.team.title",
    captionKey: "showcase.team.caption",
    path: "/project-builder",
  },
  {
    image: "https://media.base44.com/images/public/6abb82ef0cd45cfce95f34b2/1a99783fe_generated_image.png",
    titleKey: "showcase.win.title",
    captionKey: "showcase.win.caption",
    path: "/hackathon-hub",
  },
];

export default function ShowcaseStrip() {
  const { t } = useLanguage();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 lg:pt-16">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {CARDS.map((card) => (
          <Link
            key={card.path}
            to={card.path}
            className="group block bg-card border border-border rounded-lg overflow-hidden hover:border-primary/40 transition-colors"
          >
            <div className="aspect-[4/3] overflow-hidden">
              <Image
                src={card.image}
                alt={t(card.titleKey)}
                className="w-full h-full group-hover:scale-[1.03] transition-transform duration-300"
              />
            </div>
            <div className="p-4">
              <h3 className="font-heading font-bold text-base">{t(card.titleKey)}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t(card.captionKey)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}