import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Built on native <details>/<summary> so FAQs stay expandable with zero
 * JavaScript, remain accessible by default, and are findable by in-page search.
 * Flexibly handles both { q, a } and { question, answer } schema formats.
 */
export function Accordion({
  items,
  className,
  defaultOpenIndex,
}: {
  items: Array<{
    q?: string;
    a?: string;
    question?: string;
    answer?: string;
    title?: string;
    content?: string;
  }>;
  className?: string;
  defaultOpenIndex?: number;
}) {
  if (!items || items.length === 0) return null;

  return (
    <div
      className={cn(
        "divide-y divide-ivory-300 overflow-hidden rounded-2xl border border-ivory-300 bg-white shadow-xs",
        className,
      )}
    >
      {items.map((item, i) => {
        const questionText = item.question || item.q || item.title || "";
        const answerText = item.answer || item.a || item.content || "";

        return (
          <details
            key={questionText || i}
            open={i === defaultOpenIndex}
            className="group px-4 sm:px-6 transition-colors duration-200"
          >
            <summary className="flex cursor-pointer list-none items-start gap-4 py-4 sm:py-5 [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 rounded-lg">
              <h3 className="flex-1 text-[0.9375rem] leading-snug font-semibold text-plum-900 sm:text-base">
                {questionText}
              </h3>
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-ivory-200 text-plum-700 transition-transform duration-300 ease-[var(--ease-out-soft)] group-open:rotate-45 group-open:bg-gold-500 group-open:text-plum-950">
                <Plus size={16} strokeWidth={2.5} />
              </span>
            </summary>
            <div className="pb-5 pt-1 text-[0.9375rem] leading-relaxed text-plum-800 border-t border-ivory-100/60 mt-1">
              {answerText}
            </div>
          </details>
        );
      })}
    </div>
  );
}
