"use client";

import { CldImage as CldImageBase, type CldImageProps } from "next-cloudinary";

/**
 * next-cloudinary's CldImage uses useState internally, but the package's
 * published build does not carry a "use client" directive — so importing
 * `CldImage` from "next-cloudinary" directly into a Server Component throws:
 *   "useState only works in Client Components. Add the 'use client'
 *    directive..."
 * This wrapper carries the directive so CldImage is safe to use from both
 * Server and Client Components. Import CldImage from here, not from
 * "next-cloudinary" directly.
 */
export function CldImage(props: CldImageProps) {
  return <CldImageBase {...props} />;
}
