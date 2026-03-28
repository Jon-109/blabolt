import type { StripeCheckoutProductType } from '@/lib/stripe/catalog';
import { isTemplateType } from '@/lib/stripe/catalog';
import type { TemplateType } from '@/lib/templates/types';

export const TEMPLATES_CART_CHECKOUT_PATH = '/checkout/templates-cart';

export function getCheckoutPath(productType: StripeCheckoutProductType): string {
  return `/checkout/${productType}`;
}

export function buildTemplatesCartCheckoutPath(productTypes: TemplateType[]): string {
  const params = new URLSearchParams();
  params.set('products', productTypes.join(','));
  return `${TEMPLATES_CART_CHECKOUT_PATH}?${params.toString()}`;
}

export function parseTemplatesCartProducts(value: string | null | undefined): TemplateType[] {
  if (!value) {
    return [];
  }

  const seen = new Set<TemplateType>();
  const results: TemplateType[] = [];

  for (const part of value.split(',')) {
    const candidate = part.trim();
    if (!isTemplateType(candidate)) {
      continue;
    }

    if (seen.has(candidate)) {
      continue;
    }

    seen.add(candidate);
    results.push(candidate);
  }

  return results;
}
