import { MessageCircle } from "lucide-react";
import { buttonStyles } from "@/components/public/ui/button";
import { Reveal } from "@/components/public/ui/reveal";
import { whatsappLink } from "@/lib/utils";

const STEPS = [
  {
    step: 1,
    title: "Browse the collection",
    body: "Explore rings, necklaces, earrings and more by category, occasion or budget.",
  },
  {
    step: 2,
    title: "Talk to a consultant",
    body: "Message us on WhatsApp with your requirements — sizing, budget or customisation.",
  },
  {
    step: 3,
    title: "Confirm & customise",
    body: "Adjust size, weight or engraving where possible, then confirm your order.",
  },
  {
    step: 4,
    title: "Insured delivery",
    body: "Receive your piece fully insured, hallmarked, with a certificate of authenticity.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative w-full max-w-full overflow-hidden bg-gradient-to-b from-ivory-100 via-gold-50/40 to-ivory-100 py-14 sm:py-20 lg:py-24">
      <div className="shell gutter">
        {/* Title Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-2xl leading-tight font-semibold text-plum-950 sm:text-3xl lg:text-4xl">
            How shopping with Chaya Jewellery works
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-plum-700 sm:text-base">
            Four simple steps from browsing to a piece at your door.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="relative mt-12 sm:mt-16">
          {/* Dashed Connecting Line (Desktop) */}
          <div
            aria-hidden
            className="absolute top-7 right-12 left-12 hidden border-t-2 border-dashed border-gold-300 lg:block"
          />

          <ol className="relative z-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.step} delay={i * 90}>
                <li className="flex flex-col items-center text-center">
                  {/* Number Badge */}
                  <div className="relative flex size-14 shrink-0 items-center justify-center rounded-none border-2 border-gold-400 bg-white font-display text-lg font-bold text-gold-700 shadow-md transition-transform duration-300 hover:scale-110">
                    {s.step}
                  </div>

                  <h3 className="mt-5 font-display text-lg font-semibold text-plum-950">
                    {s.title}
                  </h3>
                  <p className="mt-2.5 max-w-xs text-xs leading-relaxed text-plum-700 sm:text-sm">
                    {s.body}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>

        {/* CTA Action Button */}
        <div className="mt-12 sm:mt-16 flex justify-center">
          <a
            href={whatsappLink(
              null,
              "Hi Chaya Jewellery, I would like to speak with a jewellery consultant."
            )}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({
              size: "lg",
              className:
                "bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 text-plum-950 hover:from-gold-500 hover:to-gold-700 font-semibold shadow-lg px-8 py-3.5 text-base sm:text-lg border border-gold-300/60 rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
            })}
          >
            <MessageCircle size={20} className="mr-2 text-plum-950" />
            Start a Conversation
          </a>
        </div>
      </div>
    </section>
  );
}
