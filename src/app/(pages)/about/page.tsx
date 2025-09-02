"use client";

import Image from "next/image";
import { useI18n } from "@/contexts/I18nProvider";

export default function AboutPage() {
  const { t } = useI18n();
  
  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(180deg, #a8b8b8 0%, #f8f8f8 100%)" }}>
      {/* Intro */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl md:text-4xl font-medium text-foreground mb-6">{t("About.title")}</h1>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
          {t("About.intro")}
        </p>
      </section>

      {/* Block 1: text window then image aligned to right edge */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-4xl">
          <div className="rounded-md border border-gray-200 bg-gray-100/80 p-6">
            <h2 className="text-2xl font-medium mb-3">{t("About.philosophyTitle")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("About.philosophyText")}
            </p>
          </div>
        </div>
        <div className="mt-4 md:w-1/2 ml-auto relative aspect-[16/10] border border-gray-200 bg-white">
          <Image src="/about/about1.jpg" alt="About 1" fill className="object-cover" />
        </div>
      </section>

      {/* Block 2: text window then image aligned to left edge */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-4xl ml-auto">
          <div className="rounded-md border border-gray-200 bg-gray-100/80 p-6">
            <h2 className="text-2xl font-medium mb-3">{t("About.craftedTitle")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("About.craftedText")}
            </p>
          </div>
        </div>
        <div className="mt-4 md:w-1/2 mr-auto relative aspect-[16/10] border border-gray-200 bg-white">
          <Image src="/about/about2.jpg" alt="About 2" fill className="object-cover" />
        </div>
      </section>

      {/* Block 3: text window then full-width image */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-4xl">
          <div className="rounded-md border border-gray-200 bg-gray-100/80 p-6">
            <h2 className="text-2xl font-medium mb-3">{t("About.peopleTitle")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("About.peopleText")}
            </p>
          </div>
        </div>
        <div className="mt-4 relative w-full aspect-[21/9] border border-gray-200 bg-white">
          <Image src="/about/about3.jpg" alt="About 3" fill className="object-cover" />
        </div>
      </section>

      {/* Final block: two windows similar sizing to Hexagon */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <div className="relative w-full" style={{ aspectRatio: "22/15" }}>
            <div className="absolute inset-0 border border-gray-300 bg-white flex items-center justify-center">
              <div className="px-8">
                <h3 className="text-xl font-medium mb-2">{t("About.rootsTitle")}</h3>
                <p className="text-muted-foreground leading-relaxed">{t("About.rootsText")}</p>
              </div>
            </div>
          </div>
          <div className="relative w-full" style={{ aspectRatio: "22/15" }}>
            <Image src="/about/about5.jpg" alt="Workshop" fill className="object-cover border border-gray-300" />
          </div>
        </div>
      </section>
    </main>
  );
}