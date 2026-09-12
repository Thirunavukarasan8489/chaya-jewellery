import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/public/ui/page-header";
import { getPolicies, getPolicyBySlug } from "@/lib/services/content-service";

export async function generateStaticParams() {
  const policies = await getPolicies();
  return policies.map((policy: any) => ({ slug: policy.slug }));
}

export async function generateMetadata(
  props: PageProps<"/policies/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const policy = await getPolicyBySlug(slug);
  if (!policy) return { title: "Policy not found" };

  return { title: policy.title, description: policy.summary };
}

export default async function PolicyPage(
  props: PageProps<"/policies/[slug]">,
) {
  const { slug } = await props.params;
  const policy = await getPolicyBySlug(slug);
  if (!policy) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title={policy.title}
        body={policy.summary}
        breadcrumbs={[{ label: policy.title }]}
      />

      <div className="shell gutter py-10 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs text-ink-muted">Last updated {policy.updated}</p>

          <div className="mt-8 prose prose-plum max-w-none" dangerouslySetInnerHTML={{ __html: policy.content }} />

          <nav className="mt-12 border-t border-ivory-300 pt-6">
            <h2 className="text-[0.6875rem] font-semibold tracking-[0.14em] text-ink-muted uppercase">
              Other policies
            </h2>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {(await getPolicies())
                .filter((p: any) => p.slug !== policy.slug)
                .map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/policies/${p.slug}`}
                      className="text-sm font-medium text-gold-700 underline-offset-4 hover:underline"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
