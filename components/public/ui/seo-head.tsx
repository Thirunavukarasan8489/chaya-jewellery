import Head from 'next/head';

interface SeoHeadProps {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  type?: 'website' | 'article' | 'product';
  // Product specific JSON-LD
  product?: {
    name: string;
    image: string;
    description: string;
    sku: string;
    price: number;
    currency: string;
    availability: string;
  };
}

export function SeoHead({ title, description, url, imageUrl = 'https://chayajewellery.com/og-image.jpg', type = 'website', product }: SeoHeadProps) {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    "name": "Chaya Jewellery",
    "image": "https://chayajewellery.com/logo.png",
    "@id": "https://chayajewellery.com",
    "url": "https://chayajewellery.com",
    "telephone": "+91-9999999999",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Jewellery Market",
      "addressLocality": "Mumbai",
      "postalCode": "400001",
      "addressCountry": "IN"
    },
    "priceRange": "$$$"
  };

  const productSchema = product ? {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.image,
    "description": product.description,
    "sku": product.sku,
    "offers": {
      "@type": "Offer",
      "url": url,
      "priceCurrency": product.currency,
      "price": product.price,
      "availability": product.availability === 'IN_STOCK' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    }
  } : null;

  return (
    <Head>
      <title>{`${title} | Chaya Jewellery`}</title>
      <meta name="description" content={description} />
      
      {/* OpenGraph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={imageUrl} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* LocalBusiness JSON-LD for GEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      
      {/* Product JSON-LD for standard SEO & AEO */}
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
    </Head>
  );
}
