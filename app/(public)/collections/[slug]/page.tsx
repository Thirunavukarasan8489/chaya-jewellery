import { redirect } from "next/navigation";

export default async function CategoryPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  redirect(`/products?category=${slug}`);
}
