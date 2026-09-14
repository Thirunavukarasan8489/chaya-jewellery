import sanitizeHtml from 'sanitize-html';

/**
 * Sanitizes admin-authored rich-text HTML (product descriptions, policy
 * pages, ...) before it's stored. SECURITY: this HTML is rendered on public
 * pages via dangerouslySetInnerHTML with no sanitization anywhere else in
 * the codebase — a CONTENT_MANAGER account (the lowest admin role) could
 * otherwise plant a <script>/onerror payload that runs for every visitor,
 * and it also gets rendered unsanitized inside the admin panel's own
 * product view, so the same payload can execute inside a SUPER_ADMIN's
 * session too. Sanitizing here, at write time, closes both paths at once —
 * whatever's already stored stays sanitized on every future read.
 *
 * Allowlist matches components/admin/ui/QuillEditor.tsx's actual toolbar
 * exactly (headers 1-3, bold/italic/underline/strike, ordered/bullet
 * lists, link) — nothing the editor can't produce is let through.
 */
export function sanitizeRichText(html: string | undefined | null): string {
  if (!html) return '';
  return sanitizeHtml(html, {
    allowedTags: ['h1', 'h2', 'h3', 'p', 'br', 'strong', 'em', 'u', 's', 'ol', 'ul', 'li', 'a'],
    allowedAttributes: {
      a: ['href'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    // Force safe defaults on every link Quill can produce, rather than
    // trusting target/rel values that were never in the allowlist anyway.
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
    },
  });
}
