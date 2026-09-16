import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/public/layout/logo";
import { NewsletterForm } from "@/components/public/layout/newsletter-form";
import { buttonStyles } from "@/components/public/ui/button";
import { getCategories } from "@/lib/services/category-service";
import { getPolicies } from "@/lib/services/policy-service";
import { categoryTerms, NAV_DATA, whatsappLink } from "@/lib/utils";



const WhatsappIcon = () => (
  <svg
    className="w-5 h-5 fill-[#062f16] relative z-10"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

export async function SiteFooter() {
  const [categories, policies] = await Promise.all([getCategories(), getPolicies()]);
  const { business, primaryNav, secondaryNav } = NAV_DATA;
  const legal = policies.map((policy) => ({ label: policy.title, href: `/policies/${policy.slug}` }));
  return (
    <footer className="bg-plum-950 text-plum-200">
      {/* Newsletter bar */}
      <div className="border-b border-plum-800">
        <div className="shell gutter flex flex-col items-center gap-5 py-9 text-center sm:flex-row sm:justify-between sm:text-left lg:py-11">
          <div>
            <Logo onDark />
            <p className="mt-3 font-display text-lg text-ivory-100">Be the first to know</p>
            <p className="mt-1 text-sm text-plum-300">
              Get exclusive offers, new arrivals and more.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      <div className="shell gutter py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            {/* <Logo onDark /> */}
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-plum-300">
              Handcrafted gold and diamond jewellery — hallmarked, certified
              and made to be worn for a lifetime.
            </p>
            <a
              href={whatsappLink(business,
                "Hi Chaya Jewellery, I would like a free consultation.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles({
                variant: "whatsapp",
                size: "sm",
                className: "mt-6 rounded-full",
              })}
            >
              <WhatsappIcon />
              Chat with a jewellery consultant
            </a>
          </div>

          <FooterColumn title="Shop">
            {categories.slice(0, 6).map((cat) => (
              <FooterLink
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                label={categoryTerms(cat.name).primary}
              />
            ))}
            <FooterLink href="/products" label="All products" />
          </FooterColumn>

          <FooterColumn title="Company">
            {primaryNav.slice(2).map((item: any) => (
              <FooterLink key={item.href} {...item} />
            ))}
            {secondaryNav.map((item: any) => (
              <FooterLink key={item.href} {...item} />
            ))}
          </FooterColumn>

          <FooterColumn title="Reach us">
            <li className="flex items-start gap-2.5 text-sm text-plum-300">
              <MapPin size={16} className="mt-0.5 shrink-0 text-gold-500" />
              {business.address}
            </li>
            <li>
              <a
                href={business.phoneHref}
                className="flex items-center gap-2.5 text-sm text-plum-300 hover:text-gold-300"
              >
                <Phone size={16} className="shrink-0 text-gold-500" />
                {business.phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${business.email}`}
                className="flex items-center gap-2.5 text-sm text-plum-300 hover:text-gold-300"
              >
                <Mail size={16} className="shrink-0 text-gold-500" />
                {business.email}
              </a>
            </li>
            <li className="pt-1 text-sm text-plum-400">{business.hours}</li>
          </FooterColumn>
        </div>

        <p className="mt-12 border-t border-plum-800 pt-7 text-center font-display text-sm text-gold-400 italic">
          More Than Jewellery, A Part of Your Story
        </p>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-plum-400">
            © {new Date().getFullYear()} Chaya Jewellery. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legal.map((item: any) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-xs text-plum-400 underline-offset-4 hover:text-plum-200 hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-4 font-sans text-[0.6875rem] font-semibold tracking-[0.18em] text-gold-500 uppercase">
        {title}
      </h3>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-plum-300 underline-offset-4 transition-colors hover:text-gold-300"
      >
        {label}
      </Link>
    </li>
  );
}
