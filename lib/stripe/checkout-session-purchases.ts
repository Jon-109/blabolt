import 'server-only';

import type Stripe from 'stripe';

import {
  isStripeCheckoutProductType,
  isTemplateType,
  type StripeCheckoutProductType,
} from '@/lib/stripe/catalog';
import { getStripeCheckoutProductConfig } from '@/lib/stripe/server-products';

export type CheckoutPurchaseRecord = {
  productId: string;
  productType: StripeCheckoutProductType;
};

type MetadataMap = Record<string, string | number | null | undefined>;

function parseMetadataList(value: string | number | null | undefined): string[] {
  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isMultiTemplateCheckoutSelection(
  productTypes: StripeCheckoutProductType[],
): boolean {
  return productTypes.length > 1 && productTypes.every((productType) => isTemplateType(productType));
}

export function buildCheckoutPurchaseMetadata(
  productTypes: StripeCheckoutProductType[],
  userId: string,
  loanPurpose?: string,
): Record<string, string> {
  const purchases = productTypes.map((productType) => {
    const product = getStripeCheckoutProductConfig(productType);
    return {
      productId: product.productId,
      productType,
    };
  });

  const metadata: Record<string, string> = {
    product_ids: purchases.map((purchase) => purchase.productId).join(','),
    product_types: purchases.map((purchase) => purchase.productType).join(','),
    user_id: userId,
  };

  const firstPurchase = purchases[0];
  if (purchases.length === 1 && firstPurchase) {
    metadata.product_id = firstPurchase.productId;
    metadata.product_type = firstPurchase.productType;
  }

  if (productTypes.length === 1 && productTypes[0] === 'loan_packaging' && loanPurpose) {
    metadata.loan_purpose = loanPurpose;
  }

  return metadata;
}

export function getCheckoutPurchasesFromMetadata(metadata: MetadataMap): CheckoutPurchaseRecord[] {
  const productTypes = parseMetadataList(metadata.product_types).filter(isStripeCheckoutProductType);
  const productIds = parseMetadataList(metadata.product_ids);

  if (productTypes.length > 0 && productTypes.length === productIds.length) {
    return productTypes.flatMap((productType, index) => {
      const productId = productIds[index];
      return productId
        ? [
            {
              productId,
              productType,
            },
          ]
        : [];
    });
  }

  const fallbackProductType = typeof metadata.product_type === 'string' ? metadata.product_type.trim() : '';
  const fallbackProductId = typeof metadata.product_id === 'string' ? metadata.product_id.trim() : '';

  if (isStripeCheckoutProductType(fallbackProductType) && fallbackProductId) {
    return [
      {
        productId: fallbackProductId,
        productType: fallbackProductType,
      },
    ];
  }

  return [];
}

export async function upsertCheckoutPurchases(args: {
  session: Pick<Stripe.Checkout.Session, 'id'>;
  supabase: any;
  purchases: CheckoutPurchaseRecord[];
  userId: string;
}) {
  return await args.supabase.from('purchases').upsert(
    args.purchases.map((purchase) => ({
      paid: true,
      product_id: purchase.productId,
      product_type: purchase.productType,
      stripe_session_id: args.session.id,
      user_id: args.userId,
    })),
    { onConflict: 'user_id,product_id,product_type' },
  );
}
