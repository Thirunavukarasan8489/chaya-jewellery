import type { Metadata } from "next";
import { Quote } from "lucide-react";
import { PageHeader } from "@/components/public/ui/page-header";
import { Rating } from "@/components/public/ui/rating";
import { getTestimonials } from "@/lib/services/content-service";

export const metadata: Metadata = {
  title: "Testimonials",
  description:
    "What Chaya Jewellery customers say about certification, pricing and delivery — unedited, including the reviews that are not five stars.",
};

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials();
  const average =
    testimonials.length > 0
      ? testimonials.reduce((n, t) => n + t.rating, 0) / testimonials.length
      : 5;

  return (
    <>
      <PageHeader
        eyebrow="Testimonials"
        title="What buyers say"
        body="Published unedited, including the ones that are not five stars."
        breadcrumbs={[{ label: "Testimonials" }]}
      >
        <div className="mt-6 inline-flex items-center gap-3 rounded-none border border-white/15 bg-white/8 px-4 py-2.5">
          <span className="font-display text-2xl font-semibold text-gold-300 tabular-nums">
            {average.toFixed(1)}
          </span>
          <span className="text-xs leading-tight text-plum-200">
            average from
            <br />
            {testimonials.length} reviews
          </span>
        </div>
      </PageHeader>

      <div className="shell gutter py-10 sm:py-14">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {testimonials.map((t) => (
            <li key={t._id}>
              <figure className="flex h-full flex-col rounded-2xl border border-ivory-300 bg-white p-5">
                <Quote
                  size={24}
                  className="mb-3 shrink-0 fill-gold-200 text-gold-300"
                />
                <blockquote className="flex-1 text-[0.9375rem] leading-relaxed text-plum-800">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-5 border-t border-ivory-300 pt-4">
                  <Rating value={t.rating} className="mb-2" />
                  <p className="text-sm font-semibold text-plum-900">
                    {t.customerName}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {t.location}{" "}
                    {t.productReference?.name
                      ? `· purchased ${t.productReference.name}`
                      : ""}
                  </p>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
