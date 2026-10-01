import React from "react";
import { Mail, Phone } from "lucide-react";
import { Image } from "@/components/ui/image";

const FOUNDERS = [
  {
    name: "Mrunalini Pramod Dhoke",
    role: "CEO & Co-Founder",
    initials: "MD",
    photo: "https://media.base44.com/images/public/6abb82ef0cd45cfce95f34b2/e464fb31e_ChatGPTImageSep26202609_56_15AM.png",
  },
  {
    name: "Sanchita Bhaskar Chimate",
    role: "Co-Founder",
    initials: "SC",
    photo: "https://media.base44.com/images/public/6abb82ef0cd45cfce95f34b2/903e83b83_ChatGPTImageSep26202610_06_20AM.png",
  },
];

export default function Team() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-brand-navy text-white">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <p className="font-heading text-[11px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-brand-cyan">
          The Team
        </p>
        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl mt-4">Meet the Founders</h1>

        <div className="mt-16 sm:mt-24 grid sm:grid-cols-2 gap-14 sm:gap-10">
          {FOUNDERS.map((person) => (
            <div key={person.name} className="flex flex-col items-center text-center">
              <div className="rounded-full p-[3px] bg-gradient-to-br from-fuchsia-500 via-pink-500 to-brand-cyan">
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-brand-navy-soft flex items-center justify-center overflow-hidden">
                  {person.photo ? (
                    <Image
                      src={person.photo}
                      alt={person.name}
                      className="w-full h-full"
                      fittingType="fill"
                    />
                  ) : (
                    <span className="font-heading font-bold text-3xl text-brand-cyan">
                      {person.initials}
                    </span>
                  )}
                </div>
              </div>
              <h2 className="font-heading font-bold text-lg sm:text-xl mt-6">{person.name}</h2>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-cyan mt-2">
                {person.role}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-20 sm:mt-24 flex flex-col items-center gap-2.5">
          <a
            href="tel:8788185009"
            className="inline-flex items-center gap-2 text-sm text-white hover:text-brand-cyan transition-colors"
          >
            <Phone className="w-4 h-4" /> 8788185009
          </a>
          <a
            href="mailto:mrunaltech9@gmail.com"
            className="inline-flex items-center gap-2 text-sm text-brand-cyan hover:underline"
          >
            <Mail className="w-4 h-4" /> mrunaltech9@gmail.com
          </a>
        </div>

        <div className="mt-16 border-t border-brand-cyan/15 pt-6 flex items-center justify-between gap-4">
          <span className="font-heading text-[10px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-brand-cyan/60">
            DevLaunch / TechNova'26
          </span>
          <span className="font-heading text-xs font-semibold text-white">14</span>
        </div>
      </div>
    </div>
  );
}