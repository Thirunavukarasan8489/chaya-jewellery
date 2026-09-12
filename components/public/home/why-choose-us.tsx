import { OrnamentalBg } from "@/components/public/ui/ornamental-bg";
import { SectionHeading } from "@/components/public/ui/section-heading";

const whyChooseUs = [
  {
    title: "100% Disclosure",
    body: "We disclose every single treatment. If a stone is heated, we tell you."
  },
  {
    title: "Lab Certified",
    body: "Every single stone comes with an independent lab certificate."
  },
  {
    title: "No Middlemen",
    body: "We source our stones directly from mines."
  },
  {
    title: "Expert Advice",
    body: "Speak with a gemmologist before making any purchase."
  }
];

export async function WhyChooseUs() {
  return (
    <section className="relative overflow-hidden bg-plum-900 text-ivory-100">
      <OrnamentalBg glowPosition="88% 0%" />

      <div className="shell gutter relative py-14 sm:py-18 lg:py-22">
        <SectionHeading
          eyebrow="Why Chaya Jewellery"
          title="Four things we do differently"
          body="The gemstone trade runs on information asymmetry. We would rather not."
          onDark
        />

    <ol className="mt-9 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:mt-12 lg:gap-y-10">
      {whyChooseUs.map((item: any, i: number) => (
        <li key={item.title} className="flex gap-4">
          <span className="font-display text-2xl leading-none font-semibold text-gold-500/60 tabular-nums sm:text-3xl">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0 border-l border-white/12 pl-4">
            <h3 className="text-base font-semibold text-ivory-100 sm:text-lg">
              {item.title}
            </h3>
            <p className="mt-2 text-[0.875rem] leading-relaxed text-plum-200">
              {item.body}
            </p>
          </div>
        </li>
      ))}
    </ol>
      </div >
    </section >
  );
}
