import { Gift, Heart, ShieldCheck, Sparkles } from "lucide-react";

export function TrustStrip({ averageRating }: { averageRating?: number }) {
  const trustHighlights = [
    { icon: ShieldCheck, title: "Certified Quality", body: "Authenticity you can trust." },
    { icon: Sparkles, title: "Timeless Designs", body: "Tradition with a modern touch." },
    { icon: Gift, title: "Beautifully Packed", body: "For every special occasion." },
    {
      icon: Heart,
      title: "Customer Love",
      body: averageRating ? `${averageRating.toFixed(1)}★ average rating` : "Loved by thousands.",
    },
  ];

  return (
    <section className="border-b border-ivory-300 bg-white">
      <ul className="shell gutter grid grid-cols-2 gap-x-4 gap-y-6 py-8 lg:grid-cols-4 lg:py-10">
        {trustHighlights.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.title} className="flex flex-col items-center gap-2 text-center">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gold-50 text-gold-700 ring-1 ring-gold-500/20">
                <Icon size={19} strokeWidth={2} />
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
