import { Gem } from "lucide-react";

const MESSAGES = [
  "BIS Hallmarked Gold",
  "Certificate of Authenticity",
  "Lifetime Exchange",
  "Free Insured Shipping",
  "15-Day Easy Returns",
  "Handcrafted to Order",
];

/** Duplicated once so the marquee track can loop seamlessly at -50%. */
function Track() {
  return (
    <>
      {MESSAGES.map((m) => (
        <li key={m} className="flex shrink-0 items-center gap-2.5 px-6">
          <Gem size={13} className="shrink-0 text-gold-400" />
          <span className="text-[0.75rem] font-semibold tracking-[0.08em] text-ivory-100/90 uppercase whitespace-nowrap">
            {m}
          </span>
        </li>
      ))}
    </>
  );
}

export function TrustMarquee() {
  return (
    <div
      aria-hidden="true"
      className="w-full overflow-hidden border-b border-white/10 bg-plum-950 py-2.5"
    >
      <ul className="animate-marquee flex w-max motion-reduce:animate-none">
        <Track />
        <Track />
      </ul>
    </div>
  );
}
