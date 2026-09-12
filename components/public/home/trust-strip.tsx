import { Gem, RefreshCcw, ScrollText, ShieldCheck } from "lucide-react";
const trustHighlights = [
  { icon: "gem", title: "Ethically Sourced", body: "Direct from mines." },
  { icon: "certificate", title: "Certified Natural", body: "Independently tested." },
  { icon: "refresh", title: "Lifetime Exchange", body: "100% value upgrade." },
  { icon: "shield", title: "Secure Checkout", body: "100% encrypted." },
];

const icons = {
  certificate: ScrollText,
  shield: ShieldCheck,
  refresh: RefreshCcw,
  gem: Gem,
} as const;

export function TrustStrip() {
  return (
    <section className="border-b border-ivory-300 bg-white">
      <ul className="shell gutter grid grid-cols-2 gap-x-4 gap-y-5 py-7 lg:grid-cols-4 lg:py-8">
        {trustHighlights.map((item: any) => {
          const Icon = icons[item.icon as keyof typeof icons];
          return (
            <li key={item.title} className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold-50 text-gold-700 ring-1 ring-gold-500/20">
                <Icon size={17} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-[0.8125rem] font-semibold text-plum-900 sm:text-sm">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-ink-muted">
                  {item.body}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
