export type PurchaseType = 'ENQUIRY_ONLY' | 'BUY_ONLY' | 'BUY_AND_ENQUIRE';

export const purchaseTypeConfig: Record<PurchaseType, {
  allowAddToCart: boolean;
  allowEnquire: boolean;
  primaryCtaText: string;
  secondaryCtaText: string | null;
}> = {
  ENQUIRY_ONLY: {
    allowAddToCart: false,
    allowEnquire: true,
    primaryCtaText: 'Enquire Now',
    secondaryCtaText: null,
  },
  BUY_ONLY: {
    allowAddToCart: true,
    allowEnquire: false,
    primaryCtaText: 'Add to Cart',
    secondaryCtaText: null,
  },
  BUY_AND_ENQUIRE: {
    allowAddToCart: true,
    allowEnquire: true,
    primaryCtaText: 'Add to Cart',
    secondaryCtaText: 'Enquire Now',
  }
};
