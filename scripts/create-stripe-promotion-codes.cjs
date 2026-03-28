#!/usr/bin/env node

const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-06-30.basil',
});

const productConfigs = [
  {
    key: 'balance_sheet',
    productId: 'prod_UEFt3aKb1z4YOc',
    productName: 'Balance Sheet Template',
    codes: {
      25: 'BALANCE25',
      50: 'BALANCE50',
      100: 'BALANCEFREE',
    },
  },
  {
    key: 'income_statement',
    productId: 'prod_UEFvURsPZjlgUI',
    productName: 'Income Statement Template',
    codes: {
      25: 'INCOME25',
      50: 'INCOME50',
      100: 'INCOMEFREE',
    },
  },
  {
    key: 'business_debt_summary',
    productId: 'prod_UEFwqMwyjysfqx',
    productName: 'Business Debt Summary Template',
    codes: {
      25: 'BIZDEBT25',
      50: 'BIZDEBT50',
      100: 'BIZDEBTFREE',
    },
  },
  {
    key: 'personal_financial_statement',
    productId: 'prod_UEFwqMv6QZjKqf',
    productName: 'Personal Financial Statement Template',
    codes: {
      25: 'PFS25',
      50: 'PFS50',
      100: 'PFSFREE',
    },
  },
  {
    key: 'personal_debt_summary',
    productId: 'prod_UEFwHIqNRLEjnF',
    productName: 'Personal Debt Summary Template',
    codes: {
      25: 'PERSONALDEBT25',
      50: 'PERSONALDEBT50',
      100: 'PERSONALDEBTFREE',
    },
  },
  {
    key: 'templates_bundle',
    productId: 'prod_UEFw7ulXBOZhwG',
    productName: 'Templates Bundle',
    codes: {
      25: 'BUNDLE25',
      50: 'BUNDLE50',
      100: 'BUNDLEFREE',
    },
  },
  {
    key: 'loan_packaging',
    productId: 'prod_RPi5e24PCy1D1p',
    productName: 'Loan Packaging',
    codes: {
      25: 'PACK25',
      50: 'PACK50',
      100: 'PACKFREE',
    },
  },
  {
    key: 'cash_flow_analysis',
    productId: 'prod_SKdzuNVM6rSu6W',
    productName: 'Comprehensive Cash Flow Analysis',
    codes: {
      25: 'CASHFLOW25',
      50: 'CASHFLOW50',
      100: 'CASHFLOWFREE',
    },
  },
];

async function ensurePromotionCode(productConfig, percentOff, code) {
  const existingPromotionCodes = await stripe.promotionCodes.list({
    code,
    active: true,
    limit: 1,
  });

  const existingPromotionCode = existingPromotionCodes.data[0];
  if (existingPromotionCode) {
    return {
      status: 'reused',
      code,
      percentOff,
      couponId: existingPromotionCode.coupon.id,
      promotionCodeId: existingPromotionCode.id,
      productId: productConfig.productId,
      productName: productConfig.productName,
    };
  }

  const coupon = await stripe.coupons.create({
    name: `${code} ${percentOff}% off`,
    percent_off: percentOff,
    duration: 'once',
    applies_to: {
      products: [productConfig.productId],
    },
  });

  const promotionCode = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code,
  });

  return {
    status: 'created',
    code,
    percentOff,
    couponId: coupon.id,
    promotionCodeId: promotionCode.id,
    productId: productConfig.productId,
    productName: productConfig.productName,
  };
}

async function main() {
  const results = [];

  for (const productConfig of productConfigs) {
    for (const [percentOffRaw, code] of Object.entries(productConfig.codes)) {
      const percentOff = Number(percentOffRaw);
      results.push(await ensurePromotionCode(productConfig, percentOff, code));
    }
  }

  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
