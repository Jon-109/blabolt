'use client';

import { Italianno } from 'next/font/google';
import { useId } from 'react';
import type { PersonalFinancialStatementData } from '@/lib/templates/types';

type Props = {
  data: PersonalFinancialStatementData;
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const FONT_REGULAR = 'Arial, Helvetica, sans-serif';
const FONT_BOLD = 'Arial, Helvetica, sans-serif';
const FONT_ITALIC = 'Arial, Helvetica, sans-serif';
const TEXT = '#000000';
const BOX_FILL = '#ccd7ff';
const signatureFont = Italianno({ subsets: ['latin'], weight: '400', display: 'swap' });
const SIGNATURE_FAMILY = `"Snell Roundhand", "Apple Chancery", ${signatureFont.style.fontFamily}, "Segoe Script", cursive`;

const formatMoney = (value: number | undefined, blankIfEmpty = false) => {
  if (value == null) return blankIfEmpty ? '' : '$ 0';
  return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const textValue = (value: string | undefined) => value ?? '';
const normalizedFieldValue = (value: string | undefined) => value?.replace(/\s+/g, ' ').trim() ?? '';
const capitalizeFirstLetter = (value: string | undefined) => {
  const normalized = normalizedFieldValue(value);
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : '';
};
const formatRetirementAccountType = (value?: 'traditional_ira' | 'roth_ira' | '401k' | 'sep_ira' | 'simple_ira' | 'solo_401k' | 'other') => {
  switch (value) {
    case 'traditional_ira':
      return 'Traditional IRA';
    case 'roth_ira':
      return 'Roth IRA';
    case '401k':
      return '401(k)';
    case 'sep_ira':
      return 'SEP-IRA';
    case 'simple_ira':
      return 'SIMPLE IRA';
    case 'solo_401k':
      return 'Solo 401(k)';
    case 'other':
      return 'Retirement account';
    default:
      return '';
  }
};

const joinSentenceParts = (...parts: Array<string | undefined>) => parts.map((part) => normalizedFieldValue(part)).filter(Boolean).join(' ');

const formatPersonalLoanType = (
  value?: 'personal_loan' | 'line_of_credit' | 'heloc' | 'business_loan_pg' | 'private_individual_loan',
) => {
  switch (value) {
    case 'personal_loan':
      return 'Personal loan';
    case 'line_of_credit':
      return 'Line of credit';
    case 'heloc':
      return 'HELOC';
    case 'business_loan_pg':
      return 'Personally guaranteed business loan';
    case 'private_individual_loan':
      return 'Private loan from individual';
    default:
      return 'Personal loan';
  }
};

const getPersonalLoanOriginalAmountLabel = (
  value?: 'personal_loan' | 'line_of_credit' | 'heloc' | 'business_loan_pg' | 'private_individual_loan',
) => {
  switch (value) {
    case 'line_of_credit':
    case 'heloc':
      return 'Credit limit';
    default:
      return 'Original amount';
  }
};

const getCollateralTypeLabel = (
  value?: 'real_estate' | 'vehicle' | 'investment_account' | 'business_assets' | 'personal_property' | 'other',
) => {
  switch (value) {
    case 'real_estate':
      return 'real estate';
    case 'vehicle':
      return 'vehicle';
    case 'investment_account':
      return 'investment account';
    case 'business_assets':
      return 'business assets';
    case 'personal_property':
      return 'personal property';
    case 'other':
      return 'other collateral';
    default:
      return 'collateral';
  }
};

const buildPersonalLoanSecurityDescription = (
  row: NonNullable<NonNullable<PersonalFinancialStatementData['liabilityDetails']>['personalLoans']>[number],
) => {
  const collateralDescription = normalizedFieldValue(row.collateralDescription);
  const collateralLabel = collateralDescription || getCollateralTypeLabel(row.collateralType);

  if (row.loanType === 'business_loan_pg') {
    if (row.isSecured === 'yes') return `Personally guaranteed and secured by ${collateralLabel}.`;
    return 'Personally guaranteed.';
  }

  if (row.loanType === 'heloc') {
    return `Secured by ${collateralDescription || 'residential real estate'}.`;
  }

  if (row.isSecured === 'yes') {
    return `Secured by ${collateralLabel}.`;
  }

  return `Unsecured ${formatPersonalLoanType(row.loanType).toLowerCase()}.`;
};

const joinParts = (...values: Array<string | undefined>) => values.filter((value) => Boolean(value?.trim())).join(' ');
const joinCommaParts = (...values: Array<string | undefined>) => values.filter((value) => Boolean(value?.trim())).join(', ');

const formatCityStateZip = (city?: string, state?: string, zip?: string) => {
  const cityState = joinCommaParts(city, state);
  return joinParts(cityState, zip);
};

const formatStreetCityStateZip = ({
  street,
  city,
  state,
  zip,
  fallback,
}: {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  fallback?: string;
}) => {
  const locality = formatCityStateZip(city, state, zip);
  const structured = joinCommaParts(street, locality);
  return structured || textValue(fallback);
};

const formatDate = (value: string | undefined) => {
  if (!value) return '';
  const normalized = value.includes('T') ? value.slice(0, 10) : value;
  const [year, month, day] = normalized.split('-');
  if (!year || !month || !day) return value;
  return `${month}/${day}/${year}`;
};

const wrapText = (value: string | undefined, maxChars: number) => {
  const text = textValue(value).trim();
  if (!text) return [''];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      return;
    }
    if (current) lines.push(current);
    current = word;
  });

  if (current) lines.push(current);
  return lines;
};

const chunkArray = <T,>(items: T[], size: number) => {
  if (items.length === 0) return [[]] as T[][];
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const fitFontSize = ({
  value,
  baseSize,
  width,
  weight,
  padding,
  minSize = 7,
}: {
  value: string;
  baseSize: number;
  width: number;
  weight: number;
  padding: number;
  minSize?: number;
}) => {
  const availableWidth = Math.max(width - padding * 2, 1);
  const estimatedCharWidth = weight >= 700 ? 0.59 : 0.54;
  const estimatedWidth = value.length * baseSize * estimatedCharWidth;
  if (estimatedWidth <= availableWidth) return baseSize;

  return Math.max(minSize, (availableWidth / estimatedWidth) * baseSize);
};

function Page({
  label,
  backgroundHref,
  children,
}: {
  label: string;
  backgroundHref: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox={`0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}`}
      width="100%"
      style={{ background: '#fff', display: 'block' }}
      role="img"
      aria-label={label}
    >
      <rect x="0" y="0" width={PAGE_WIDTH} height={PAGE_HEIGHT} fill="#ffffff" />
      <image href={backgroundHref} x="0" y="0" width={PAGE_WIDTH} height={PAGE_HEIGHT} preserveAspectRatio="none" />
      {children}
    </svg>
  );
}

function T({
  x,
  y,
  children,
  size = 9.48,
  weight = 400,
  anchor = 'start',
  italic = false,
  baseline = 'auto',
  family,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
  weight?: number;
  anchor?: 'start' | 'middle' | 'end';
  italic?: boolean;
  baseline?: 'auto' | 'middle';
  family?: string;
}) {
  return (
    <text
      x={x}
      y={y}
      fontFamily={family ?? (italic ? FONT_ITALIC : weight >= 700 ? FONT_BOLD : FONT_REGULAR)}
      fontSize={size}
      fontWeight={weight}
      fill={TEXT}
      textAnchor={anchor}
      fontStyle={italic ? 'italic' : 'normal'}
      letterSpacing="0"
      dominantBaseline={baseline}
      textRendering="geometricPrecision"
      style={{ fontKerning: 'normal', fontVariantLigatures: 'none' }}
    >
      {children}
    </text>
  );
}

function Multiline({
  x,
  y,
  lines,
  size = 9.48,
  lineHeight = 10.44,
  anchor = 'start',
  weight = 400,
  italic = false,
}: {
  x: number;
  y: number;
  lines: string[];
  size?: number;
  lineHeight?: number;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
  italic?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      fontFamily={italic ? FONT_ITALIC : weight >= 700 ? FONT_BOLD : FONT_REGULAR}
      fontSize={size}
      fontWeight={weight}
      fill={TEXT}
      textAnchor={anchor}
      fontStyle={italic ? 'italic' : 'normal'}
      letterSpacing="0"
      textRendering="geometricPrecision"
      style={{ fontKerning: 'normal', fontVariantLigatures: 'none' }}
    >
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function MarkBox({ x, y, checked }: { x: number; y: number; checked: boolean }) {
  if (!checked) return null;
  return (
    <T x={x} y={y} size={9.48} weight={700} anchor="middle">
      X
    </T>
  );
}

function FieldText({
  x,
  y,
  width,
  height,
  value,
  size = 9.48,
  weight = 400,
  align = 'start',
  padding = 4,
  minSize = 7,
  paintBox = true,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  size?: number;
  weight?: number;
  align?: 'start' | 'middle' | 'end';
  padding?: number;
  minSize?: number;
  paintBox?: boolean;
}) {
  const clipId = useId().replace(/:/g, '');
  const fieldValue = normalizedFieldValue(value);
  if (!fieldValue) return null;

  const textX = align === 'end' ? x + width - padding : align === 'middle' ? x + width / 2 : x + padding;
  const fittedSize = fitFontSize({ value: fieldValue, baseSize: size, width, weight, padding, minSize });
  const textY = y + height / 2;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {paintBox ? <rect x={x} y={y} width={width} height={height} fill={BOX_FILL} /> : null}
        <T x={textX} y={textY} size={fittedSize} weight={weight} anchor={align} baseline="middle">
          {fieldValue}
        </T>
      </g>
    </g>
  );
}

function FieldMultiline({
  x,
  y,
  width,
  height,
  lines,
  size = 8.04,
  lineHeight = 9.6,
  align = 'start',
  verticalAlign = 'top',
  padding = 4,
  paintBox = true,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  lines: string[];
  size?: number;
  lineHeight?: number;
  align?: 'start' | 'middle' | 'end';
  verticalAlign?: 'top' | 'middle';
  padding?: number;
  paintBox?: boolean;
}) {
  const clipId = useId().replace(/:/g, '');
  const visibleLines = lines.filter(Boolean);
  if (visibleLines.length === 0) return null;

  const textX = align === 'end' ? x + width - padding : align === 'middle' ? x + width / 2 : x + padding;
  const contentHeight = size + Math.max(visibleLines.length - 1, 0) * lineHeight;
  const topOffset = verticalAlign === 'middle' ? Math.max((height - contentHeight) / 2, 0) : padding;
  const textY = y + topOffset + size;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {paintBox ? <rect x={x} y={y} width={width} height={height} fill={BOX_FILL} /> : null}
        <Multiline x={textX} y={textY} lines={visibleLines} size={size} lineHeight={lineHeight} anchor={align} />
      </g>
    </g>
  );
}

function SignatureField({
  x,
  y,
  width,
  height,
  value,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
}) {
  const fieldValue = normalizedFieldValue(value);
  if (!fieldValue) return null;

  const compactUnits = fieldValue.replace(/\s/g, '').length * 0.41 + (fieldValue.match(/\s/g)?.length ?? 0) * 0.16;
  const availableWidth = width - 12;
  const estimatedSize = availableWidth / Math.max(compactUnits, 1);
  const fontSize = Math.max(18, Math.min(28, estimatedSize));
  const baselineY = y + height * 0.8;
  const startX = x + 10;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={BOX_FILL} />
      <text
        x={startX}
        y={baselineY}
        fontFamily={SIGNATURE_FAMILY}
        fontSize={fontSize}
        fill={TEXT}
        letterSpacing="-0.02em"
        fontStyle="italic"
        textRendering="geometricPrecision"
        transform={`rotate(-0.25 ${startX} ${baselineY}) scale(0.95 1)`}
        style={{ fontKerning: 'normal', fontVariantLigatures: 'none' }}
      >
        {fieldValue}
      </text>
    </g>
  );
}

function pageTwo(data: PersonalFinancialStatementData) {
  const retirementTotal = (data.retirementAccounts || []).reduce((sum, row) => sum + (row.currentEstimatedValue || 0), 0);
  const lifeInsuranceLoanTotal = (data.lifeInsuranceHeld || []).reduce((sum, row) => sum + (row.loanAgainstPolicy || 0), 0);
  const taxesOwedTotal = (data.liabilityDetails?.taxesOwed || []).reduce((sum, row) => sum + (row.balanceOwed || 0), 0);
  const otherLiabilitiesTotal = data.liabilities.otherDebts;
  const formattedHomeAddress = normalizedFieldValue(data.personalInfo.homeStreet) || textValue(data.personalInfo.address);
  const formattedHomeCityStateZip = formatCityStateZip(
    data.personalInfo.homeCity,
    data.personalInfo.homeState,
    data.personalInfo.homeZip,
  );
  const formattedBusinessAddress = formatStreetCityStateZip({
    street: data.businessInfo?.businessStreet,
    city: data.businessInfo?.businessCity,
    state: data.businessInfo?.businessState,
    zip: data.businessInfo?.businessZip,
  });
  const assets = [
    { value: data.assets.cashChecking, height: 20 },
    { value: data.assets.cashSavings, height: 20 },
    { value: retirementTotal, height: 28 },
    { value: data.assets.accountsNotesReceivable, height: 28 },
    { value: data.assets.lifeInsuranceCashSurrender, height: 28 },
    { value: data.assets.stocksBonds, height: 28 },
    { value: data.assets.realEstate, height: 28 },
    { value: data.assets.automobiles, height: 36 },
    { value: data.assets.personalProperty, height: 28 },
    { value: data.assets.otherAssets, height: 28 },
  ];
  const totalAssets = assets.reduce((sum, item) => sum + (item.value || 0), 0);
  const autoInstallmentMonthlyPayment = (data.vehiclesOwned || []).reduce(
    (sum, row) => sum + (row.monthlyPayment || 0),
    0,
  );
  const otherInstallmentMonthlyPayment = data.liabilityDetails?.studentLoans?.totalMonthlyPayment || 0;
  const otherIncomeSummary = data.incomeDetails?.otherIncome?.description?.trim()
    ? `${data.incomeDetails.otherIncome.description.trim()} - Monthly Income: ${formatMoney(data.annualIncome?.otherIncome)}`
    : data.annualIncome?.otherIncome != null
      ? `Other Income - Monthly Income: ${formatMoney(data.annualIncome.otherIncome)}`
      : '';
  const liabilities = [
    { value: 0, height: 20 },
    { value: 0, height: 28 },
    { value: data.liabilities.autoLoans, height: 28 },
    { value: data.liabilities.studentLoans, height: 28 },
    { value: lifeInsuranceLoanTotal, height: 20 },
    { value: data.liabilities.mortgages, height: 28 },
    { value: taxesOwedTotal, height: 28 },
    { value: otherLiabilitiesTotal, height: 28 },
  ];
  const totalLiabilities = liabilities.reduce((sum, item) => sum + (item.value || 0), 0);
  // SBA Form 413 enforces Assets = Liabilities + Net Worth.
  const netWorth = totalAssets - totalLiabilities;
  const totalLiabilitiesAndNetWorth = totalLiabilities + netWorth;
  const autoInstallmentMonthlyPaymentBox = { x: 434.396, y: 333.387, width: 57.579, height: 10.853 };
  const otherInstallmentMonthlyPaymentBox = { x: 434.56, y: 354.406, width: 57.415, height: 10.314 };
  const income = [
    data.annualIncome?.salary,
    data.annualIncome?.netInvestmentIncome,
    data.annualIncome?.realEstateIncome,
    data.annualIncome?.otherIncome,
  ];
  const contingent = [
    data.contingentLiabilities?.asEndorserOrCoMaker?.estimatedAmount,
    data.contingentLiabilities?.legalClaimsAndJudgments?.estimatedAmount,
    data.contingentLiabilities?.provisionForFederalIncomeTax?.estimatedAmount,
    data.contingentLiabilities?.otherSpecialDebt?.estimatedAmount,
  ];
  const assetBoxes = [
    { x: 224.86, y: 290.817, width: 82.57, height: 11.28 },
    { x: 224.86, y: 302.776, width: 82.57, height: 9.72 },
    { x: 224.86, y: 313.513, width: 82.57, height: 10.08 },
    { x: 224.86, y: 331.953, width: 82.57, height: 11.28 },
    { x: 224.86, y: 353.473, width: 82.57, height: 11.28 },
    { x: 224.86, y: 374.233, width: 82.57, height: 11.28 },
    { x: 224.86, y: 394.993, width: 82.57, height: 11.28 },
    { x: 224.86, y: 415.28, width: 82.57, height: 11.28 },
    { x: 224.86, y: 446.36, width: 82.57, height: 11.28 },
    { x: 224.86, y: 467.12, width: 82.57, height: 11.28 },
  ];
  const totalAssetBox = { x: 225.464, y: 487.238, width: 80.333, height: 11.28 };
  const liabilityBoxes = [
    { x: 499.436, y: 291.438, width: 70.715, height: 11.28 },
    { x: 499.436, y: 303.198, width: 70.715, height: 9.72 },
    { x: 499.436, y: 321.398, width: 70.715, height: 11.28 },
    { x: 499.436, y: 342.683, width: 70.715, height: 11.768 },
    { x: 499.436, y: 364.443, width: 70.715, height: 11.28 },
    { x: 499.436, y: 376.421, width: 70.715, height: 9.72 },
    { x: 499.436, y: 393.827, width: 70.715, height: 11.28 },
    { x: 499.436, y: 414.535, width: 70.715, height: 11.28 },
  ];
  const totalLiabilitiesBox = { x: 499.436, y: 435.398, width: 70.715, height: 11.28 };
  const netWorthBox = { x: 499.436, y: 448.158, width: 70.715, height: 9.84 };
  const totalLiabilitiesAndNetWorthBox = { x: 499.436, y: 466.478, width: 70.715, height: 14.959 };
  const incomeBoxes = [
    { x: 232.455, y: 523.88, width: 83.683, height: 11.28 },
    { x: 232.455, y: 536.6, width: 83.683, height: 11.28 },
    { x: 232.455, y: 549.08, width: 83.683, height: 11.28 },
    { x: 232.455, y: 561.8, width: 83.683, height: 11.28 },
  ];
  const contingentBoxes = [
    { x: 510.127, y: 523.632, width: 66.372, height: 11.28 },
    { x: 510.127, y: 536.316, width: 66.372, height: 11.28 },
    { x: 510.127, y: 548.999, width: 66.372, height: 11.28 },
    { x: 510.127, y: 561.683, width: 66.372, height: 11.28 },
  ];
  const businessTypeMarkPositions = [
    { x: 118.3, y: 199.1, checked: data.businessInfo?.businessType === 'corporation' },
    { x: 193.9, y: 199.1, checked: data.businessInfo?.businessType === 's_corp' },
    { x: 249.5, y: 199.1, checked: data.businessInfo?.businessType === 'llc' },
    { x: 289.0, y: 199.1, checked: data.businessInfo?.businessType === 'partnership' },
    { x: 362.6, y: 199.1, checked: data.businessInfo?.businessType === 'sole_proprietor' },
  ];

  return (
    <Page label="SBA Form 413 page 2" backgroundHref="/pdf/sba-form-413/page-2.svg">
      <FieldText x={68.785} y={59.946} width={277.578} height={24.997} value={textValue(data.personalInfo.name)} />
      <FieldText x={480.547} y={59.946} width={111.453} height={24.997} value={textValue(data.businessInfo?.applicantBusinessPhone)} size={8.04} />
      <FieldText x={106.243} y={85.792} width={239.966} height={22.338} value={formattedHomeAddress} />
      <FieldText x={475.607} y={85.792} width={116.393} height={22.338} value={textValue(data.personalInfo.phone || data.personalInfo.primaryPhone)} size={8.04} />
      <FieldText x={142.744} y={108.679} width={449.256} height={25.186} value={formattedHomeCityStateZip} />
      <FieldText x={212.862} y={134.523} width={379.138} height={25.017} value={textValue(data.businessInfo?.applicantBusinessName)} />
      <FieldText x={248.08} y={160.229} width={343.92} height={24.59} value={formattedBusinessAddress} />

      {businessTypeMarkPositions.map((item, index) => (
        <MarkBox key={`business-type-mark-${index}`} x={item.x} y={item.y} checked={item.checked} />
      ))}

      <FieldText x={246.2} y={213.183} width={97.567} height={12.196} value={formatDate(data.asOfDate)} align="middle" size={9} />
      <MarkBox x={186.571} y={247.063} checked={data.declarations?.isMarried === 'yes'} />
      <MarkBox x={224.622} y={247.063} checked={data.declarations?.isMarried === 'no'} />

      {assets.map((item, index) => {
        const box = assetBoxes[index];
        if (!box) return null;
        return (
          <FieldText
            key={`asset-${index}`}
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            value={formatMoney(item.value)}
            size={9}
            align="end"
            padding={3}
          />
        );
      })}
      <FieldText
        x={totalAssetBox.x}
        y={totalAssetBox.y}
        width={totalAssetBox.width}
        height={totalAssetBox.height}
        value={formatMoney(totalAssets)}
        size={9}
        weight={700}
        align="start"
        padding={3}
      />

      {liabilities.map((item, index) => {
        const box = liabilityBoxes[index];
        if (!box) return null;
        return (
          <FieldText
            key={`liability-${index}`}
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            value={formatMoney(item.value)}
            size={9}
            align="end"
            padding={3}
          />
        );
      })}
      <FieldText
        x={totalLiabilitiesBox.x}
        y={totalLiabilitiesBox.y}
        width={totalLiabilitiesBox.width}
        height={totalLiabilitiesBox.height}
        value={formatMoney(totalLiabilities)}
        size={9}
        weight={700}
        align="end"
        padding={3}
      />
      <FieldText
        x={autoInstallmentMonthlyPaymentBox.x}
        y={autoInstallmentMonthlyPaymentBox.y}
        width={autoInstallmentMonthlyPaymentBox.width}
        height={autoInstallmentMonthlyPaymentBox.height}
        value={formatMoney(autoInstallmentMonthlyPayment)}
        size={9}
        align="end"
        padding={3}
      />
      <FieldText
        x={otherInstallmentMonthlyPaymentBox.x}
        y={otherInstallmentMonthlyPaymentBox.y}
        width={otherInstallmentMonthlyPaymentBox.width}
        height={otherInstallmentMonthlyPaymentBox.height}
        value={formatMoney(otherInstallmentMonthlyPayment)}
        size={9}
        align="end"
        padding={3}
      />
      <FieldText
        x={netWorthBox.x}
        y={netWorthBox.y}
        width={netWorthBox.width}
        height={netWorthBox.height}
        value={formatMoney(netWorth)}
        size={9}
        weight={700}
        align="end"
        padding={3}
      />
      <FieldText
        x={totalLiabilitiesAndNetWorthBox.x}
        y={totalLiabilitiesAndNetWorthBox.y}
        width={totalLiabilitiesAndNetWorthBox.width}
        height={totalLiabilitiesAndNetWorthBox.height}
        value={formatMoney(totalLiabilitiesAndNetWorth)}
        size={9}
        weight={700}
        align="start"
        padding={3}
      />

      {income.map((value, index) => {
        const box = incomeBoxes[index];
        if (!box) return null;
        return (
        <FieldText
          key={`income-${index}`}
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          value={formatMoney(value)}
          size={9}
          align="end"
          padding={3}
        />
      )})}
      {contingent.map((value, index) => {
        const box = contingentBoxes[index];
        if (!box) return null;
        return (
        <FieldText
          key={`contingent-${index}`}
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          value={formatMoney(value)}
          size={9}
          align="end"
          padding={3}
        />
      )})}

      <FieldMultiline x={32.992} y={605.958} width={559.291} height={146.36} lines={otherIncomeSummary ? [otherIncomeSummary] : ['']} size={8.04} lineHeight={9.6} />
    </Page>
  );
}

function pageThree(data: PersonalFinancialStatementData) {
  const notesChunks = chunkArray(data.notesPayableToBanksAndOthers || [], 5);
  const stocks = (data.stocksAndBonds || []).slice(0, 4);
  const realEstate = (data.realEstateOwned || []).slice(0, 3);
  const noteRows = [
    { top: 115.972, height: 16.268 },
    { top: 132.686, height: 17.669 },
    { top: 150.509, height: 17.757 },
    { top: 168.772, height: 17.582 },
    { top: 186.772, height: 17.757 },
  ];
  const noteColumns = {
    noteholder: { x: 33.052, width: 161.514 },
    originalBalance: { x: 194.72, width: 52.106 },
    currentBalance: { x: 247.16, width: 52.379 },
    payment: { x: 299.96, width: 63.146 },
    frequency: { x: 363.44, width: 92.611 },
    secured: { x: 456.56, width: 134.666 },
  };
  const stockRows = [
    { top: 252.09, height: 15.56 },
    { top: 267.771, height: 15.297 },
    { top: 283.669, height: 15.691 },
    { top: 299.549, height: 15.165 },
  ];
  const stockColumns = {
    shares: { x: 33.195, width: 96.572 },
    security: { x: 129.903, width: 121.137 },
    cost: { x: 251.572, width: 61.748 },
    market: { x: 313.84, width: 98.143 },
    dateOrExchange: { x: 412.109, width: 98.251 },
    total: { x: 510.68, width: 80.622 },
  };
  const realEstateColumns = [
    { x: 157.524, width: 149.79 },
    { x: 307.8, width: 148.445 },
    { x: 456.549, width: 134.777 },
  ];
  const realEstateRows = {
    type: { top: 360.463, height: 41.381 },
    address: { top: 402.103, height: 25.576 },
    datePurchased: { top: 427.948, height: 20.914 },
    originalCost: { top: 449.668, height: 18.154 },
    presentValue: { top: 468.697, height: 21.08 },
    mortgageHolder: { top: 490.098, height: 32.541 },
    accountNumber: { top: 521.96, height: 21.845 },
    balance: { top: 544.337, height: 18.417 },
    payment: { top: 562.88, height: 25.794 },
    status: { top: 589.337, height: 18.548 },
  };
  const sectionFiveEntries = [
    ...(data.otherPersonalPropertyAndOtherAssets || []).map((row) =>
      joinSentenceParts(
        `${row.description || 'Other personal property or asset'}.`,
        `Estimated value - ${formatMoney(row.value, true)}.`,
      ),
    ),
    ...(data.retirementAccounts || []).map((row) => {
      const accountType = formatRetirementAccountType(row.accountType);
      const retirementLabel = accountType && row.institutionName
        ? `${accountType} - ${row.institutionName}`
        : accountType || row.institutionName || 'Retirement account';
      const securityDetails = row.pledgedAsCollateral === 'yes'
        ? joinSentenceParts(
            `Pledged as security${row.lenderName ? ` to ${row.lenderName}` : ''}.`,
            row.lienAmount != null ? `Amount of lien - ${formatMoney(row.lienAmount)}.` : undefined,
            row.monthlyPayment != null ? `Payment terms - ${formatMoney(row.monthlyPayment)} monthly.` : undefined,
          )
        : '';

      return joinSentenceParts(
        `${retirementLabel}.`,
        `Current value - ${formatMoney(row.currentEstimatedValue, true)}.`,
        securityDetails,
      );
    }),
    ...(data.vehiclesOwned || []).map((row) => {
      const vehicleLabel = joinParts(row.year?.toString(), row.make, row.model) || row.description || 'Automobile';
      const lienDetails = row.loanBalance != null || row.monthlyPayment != null
        ? joinSentenceParts(
            'Secures an auto loan.',
            row.loanBalance != null ? `Amount of lien - ${formatMoney(row.loanBalance)}.` : undefined,
            row.monthlyPayment != null ? `Payment terms - ${formatMoney(row.monthlyPayment)} monthly.` : undefined,
          )
        : '';

      return joinSentenceParts(
        `${vehicleLabel}.`,
        `Estimated value - ${formatMoney(row.currentEstimatedValue, true)}.`,
        lienDetails,
      );
    }),
    ...(data.accountsAndNotesReceivable || []).map((row) => {
      const agreementDetails = row.hasWrittenAgreement === 'yes'
        ? 'Written agreement on file.'
        : row.hasWrittenAgreement === 'no'
          ? 'No written agreement indicated.'
          : '';
      const securityDetails = row.isSecuredByCollateral === 'yes'
        ? `Secured by ${row.collateralDescription || 'collateral'}.`
        : '';

      return joinSentenceParts(
        `${row.debtorName ? `Money owed to me by ${row.debtorName}.` : 'Account or note receivable owed to me.'}`,
        row.originalAmountLoaned != null ? `Original amount - ${formatMoney(row.originalAmountLoaned, true)}.` : undefined,
        `Current balance - ${formatMoney(row.currentBalanceOwed, true)}.`,
        row.monthlyPaymentReceived != null ? `Payment terms - ${formatMoney(row.monthlyPaymentReceived)} monthly.` : undefined,
        agreementDetails,
        securityDetails,
      );
    }),
  ];
  const sectionFiveLines = sectionFiveEntries.flatMap((entry) => wrapText(entry, 128)).slice(0, 12);

  return notesChunks.map((notes, chunkIndex) => {
    const isFirstPage = chunkIndex === 0;

    return (
      <Page
        key={`page3-${chunkIndex}`}
        label={isFirstPage ? 'SBA Form 413 page 3' : `SBA Form 413 page 3 continuation ${chunkIndex + 1}`}
        backgroundHref="/pdf/sba-form-413/page-3.svg"
      >
        {notes.map((row, index) => {
          const geometry = noteRows[index];
          if (!geometry) return null;
          return (
            <g key={`note-${chunkIndex}-${index}`}>
              <FieldMultiline
                x={noteColumns.noteholder.x}
                y={geometry.top}
                width={noteColumns.noteholder.width}
                height={geometry.height}
                lines={wrapText(row.nameAndAddressOfNoteholder, 30)}
                size={8.04}
                lineHeight={8.5}
                padding={3}
              />
              <FieldText x={noteColumns.originalBalance.x} y={geometry.top} width={noteColumns.originalBalance.width} height={geometry.height} value={formatMoney(row.originalBalance, true)} size={8.04} align="end" padding={3} />
              <FieldText x={noteColumns.currentBalance.x} y={geometry.top} width={noteColumns.currentBalance.width} height={geometry.height} value={formatMoney(row.currentBalance, true)} size={8.04} align="end" padding={3} />
              <FieldText x={noteColumns.payment.x} y={geometry.top} width={noteColumns.payment.width} height={geometry.height} value={formatMoney(row.paymentAmount, true)} size={8.04} align="end" padding={3} />
              <FieldText x={noteColumns.frequency.x} y={geometry.top} width={noteColumns.frequency.width} height={geometry.height} value={textValue(row.frequency)} size={8.04} align="middle" padding={3} />
              <FieldText
                x={noteColumns.secured.x}
                y={geometry.top}
                width={noteColumns.secured.width}
                height={geometry.height}
                value={textValue(row.howSecuredOrEndorsed)}
                size={8.04}
                align="start"
                padding={3}
                minSize={5}
              />
            </g>
          );
        })}

        {isFirstPage
          ? stocks.map((row, index) => {
              const geometry = stockRows[index];
              if (!geometry) return null;
              const totalValue =
                row.numberOfShares != null && row.marketValue != null
                  ? Math.round(Number(row.numberOfShares) * Number(row.marketValue))
                  : row.marketValue;
              return (
                <g key={`stock-${index}`}>
                  <FieldText x={stockColumns.shares.x} y={geometry.top} width={stockColumns.shares.width} height={geometry.height} value={row.numberOfShares != null ? Number(row.numberOfShares).toLocaleString() : ''} size={8.04} align="end" padding={3} />
                  <FieldText x={stockColumns.security.x} y={geometry.top} width={stockColumns.security.width} height={geometry.height} value={textValue(row.issuerName || row.symbol)} size={8.04} padding={3} />
                  <FieldText x={stockColumns.cost.x} y={geometry.top} width={stockColumns.cost.width} height={geometry.height} value={formatMoney(row.cost, true)} size={8.04} align="end" padding={3} />
                  <FieldText x={stockColumns.market.x} y={geometry.top} width={stockColumns.market.width} height={geometry.height} value={formatMoney(row.marketValue, true)} size={8.04} align="end" padding={3} />
                  <FieldText x={stockColumns.dateOrExchange.x} y={geometry.top} width={stockColumns.dateOrExchange.width} height={geometry.height} value={formatDate(row.dateOfQuote) || textValue(row.exchange)} size={8.04} align="middle" padding={3} />
                  <FieldText x={stockColumns.total.x} y={geometry.top} width={stockColumns.total.width} height={geometry.height} value={formatMoney(totalValue, true)} size={8.04} align="end" padding={3} />
                </g>
              );
            })
          : null}

        {isFirstPage
          ? realEstate.map((row, index) => {
              const column = realEstateColumns[index];
              if (!column) return null;
              return (
                <g key={`real-estate-${index}`}>
                  <FieldMultiline x={column.x} y={realEstateRows.type.top} width={column.width} height={realEstateRows.type.height} lines={wrapText(capitalizeFirstLetter(row.propertyType?.replaceAll('_', ' ')), 20)} size={8.04} lineHeight={8.8} align="middle" verticalAlign="middle" padding={3} />
                  <FieldMultiline x={column.x} y={realEstateRows.address.top} width={column.width} height={realEstateRows.address.height} lines={wrapText(row.propertyAddress, 24)} size={8.04} lineHeight={8.8} align="middle" verticalAlign="middle" padding={3} />
                  <FieldText x={column.x} y={realEstateRows.datePurchased.top} width={column.width} height={realEstateRows.datePurchased.height} value={formatDate(row.datePurchased)} size={8.04} align="middle" padding={3} />
                  <FieldText x={column.x} y={realEstateRows.originalCost.top} width={column.width} height={realEstateRows.originalCost.height} value={formatMoney(row.originalCost, true)} size={8.04} align="middle" padding={3} />
                  <FieldText x={column.x} y={realEstateRows.presentValue.top} width={column.width} height={realEstateRows.presentValue.height} value={formatMoney(row.presentMarketValue, true)} size={8.04} align="middle" padding={3} />
                  <FieldMultiline x={column.x} y={realEstateRows.mortgageHolder.top} width={column.width} height={realEstateRows.mortgageHolder.height} lines={wrapText(joinParts(row.mortgageHolderName, row.mortgageHolderAddress), 21)} size={8.04} lineHeight={8.6} align="middle" verticalAlign="middle" padding={3} />
                  <FieldText x={column.x} y={realEstateRows.accountNumber.top} width={column.width} height={realEstateRows.accountNumber.height} value={textValue(row.mortgageAccountNumber)} size={8.04} align="middle" padding={3} />
                  <FieldText x={column.x} y={realEstateRows.balance.top} width={column.width} height={realEstateRows.balance.height} value={formatMoney(row.mortgageBalance, true)} size={8.04} align="middle" padding={3} />
                  <FieldText x={column.x} y={realEstateRows.payment.top} width={column.width} height={realEstateRows.payment.height} value={formatMoney(row.amountOfPaymentPerMonth, true)} size={8.04} align="middle" padding={3} />
                  <FieldText x={column.x} y={realEstateRows.status.top} width={column.width} height={realEstateRows.status.height} value={capitalizeFirstLetter(row.status?.replaceAll('_', ' '))} size={8.04} align="middle" padding={3} />
                </g>
              );
            })
          : null}

        {isFirstPage ? (
          <FieldMultiline
            x={33.928}
            y={629.48}
            width={555.96}
            height={119.28}
            lines={sectionFiveLines.length ? sectionFiveLines.slice(0, 12) : ['']}
            size={8.04}
            lineHeight={9.2}
            padding={4}
          />
        ) : null}
      </Page>
    );
  });
}

function pageFour(data: PersonalFinancialStatementData) {
  const taxesLines = (data.liabilityDetails?.taxesOwed || []).flatMap((row) =>
    wrapText(
      joinSentenceParts(
        `${row.authority || 'Tax authority'}.`,
        row.originalBalance != null ? `Original amount - ${formatMoney(row.originalBalance, true)}.` : undefined,
        `Current balance - ${formatMoney(row.balanceOwed, true)}.`,
        row.monthlyPayment != null ? `Payment terms - ${formatMoney(row.monthlyPayment)} monthly.` : undefined,
      ),
      128,
    ),
  );

  const otherLiabilityLines = [
    ...(data.liabilityDetails?.personalLoans || []).flatMap((row) =>
      wrapText(
        joinSentenceParts(
          `${row.lenderName || formatPersonalLoanType(row.loanType)}.`,
          row.originalBalance != null
            ? `${getPersonalLoanOriginalAmountLabel(row.loanType)} - ${formatMoney(row.originalBalance, true)}.`
            : undefined,
          `Current balance - ${formatMoney(row.currentBalance, true)}.`,
          row.monthlyPayment != null ? `Payment terms - ${formatMoney(row.monthlyPayment)} monthly.` : undefined,
          buildPersonalLoanSecurityDescription(row),
        ),
        128,
      ),
    ),
    ...(data.liabilityDetails?.otherObligations || []).flatMap((row) =>
      wrapText(
        joinSentenceParts(
          `${row.description || 'Other financial obligation'}.`,
          `Current balance - ${formatMoney(row.amountOwed, true)}.`,
          row.monthlyPayment != null ? `Payment terms - ${formatMoney(row.monthlyPayment)} monthly.` : undefined,
        ),
        128,
      ),
    ),
    ...(data.liabilityDetails?.creditCards?.totalBalance != null
      ? wrapText(
          joinSentenceParts(
            'Personal credit cards.',
            `Current balance - ${formatMoney(data.liabilityDetails.creditCards.totalBalance, true)}.`,
            data.liabilityDetails.creditCards.totalMonthlyPayment != null
              ? `Payment terms - ${formatMoney(data.liabilityDetails.creditCards.totalMonthlyPayment)} monthly.`
              : undefined,
          ),
          128,
        )
      : []),
    ...(data.liabilityDetails?.medicalBills?.totalBalance != null
      ? wrapText(
          joinSentenceParts(
            'Medical bills or unpaid personal bills.',
            `Current balance - ${formatMoney(data.liabilityDetails.medicalBills.totalBalance, true)}.`,
          ),
          128,
        )
      : []),
  ].filter(Boolean);

  const lifeInsuranceLines = (data.lifeInsuranceHeld || []).flatMap((row) =>
    wrapText(
      joinSentenceParts(
        `${row.companyName || 'Insurance company'}.`,
        `Face amount - ${formatMoney(row.faceAmount, true)}.`,
        `Cash surrender value - ${formatMoney(row.cashSurrenderValue, true)}.`,
        `Beneficiaries - ${row.beneficiaries || 'No beneficiary listed'}.`,
      ),
      128,
    ),
  );
  const signedName = normalizedFieldValue(data.eSignature?.fullName);
  const printedName = normalizedFieldValue(data.personalInfo.name);
  const signatureDate = signedName ? formatDate(data.eSignature?.signedAt || data.asOfDate) : '';

  return (
    <Page label="SBA Form 413 page 4" backgroundHref="/pdf/sba-form-413/page-4.svg">
      <FieldMultiline x={33.389} y={72.048} width={557.712} height={120.682} lines={taxesLines.length ? taxesLines : ['']} size={8.04} lineHeight={9.6} padding={4} />
      <FieldMultiline x={33.739} y={206.981} width={557.712} height={85.522} lines={otherLiabilityLines.length ? otherLiabilityLines : ['']} size={8.04} lineHeight={9.6} padding={4} />
      <FieldMultiline x={33.739} y={322.29} width={557.362} height={82.531} lines={lifeInsuranceLines.length ? lifeInsuranceLines : ['']} size={8.04} lineHeight={9.6} padding={4} />

      <SignatureField x={74.827} y={558.271} width={211.44} height={25.92} value={signedName} />
      <FieldText x={429.128} y={554.258} width={105.24} height={28.8} value={signatureDate} size={9.48} align="middle" padding={4} />
      <FieldText x={80.347} y={590.858} width={205.92} height={28.8} value={printedName} size={9.48} padding={4} />
    </Page>
  );
}

export default function SBAForm413SvgTemplate({ data }: Props) {
  const pageThreeSheets = pageThree(data);
  const sheets = [
    { key: 'page-2', label: 'Page 2', content: pageTwo(data) },
    ...pageThreeSheets.map((content, index) => ({
      key: `page-3-${index}`,
      label: index === 0 ? 'Page 3' : `Page 3 Continued ${index + 1}`,
      content,
    })),
    { key: 'page-4', label: 'Page 4', content: pageFour(data) },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gap: 24,
        background: '#eef1f5',
        padding: 16,
      }}
    >
      {sheets.map((sheet) => (
        <div key={sheet.key} style={{ display: 'grid', gap: 10 }}>
          <div
            style={{
              borderTop: '2px dashed #cbd5e1',
            }}
          />
          <div
            style={{
              background: '#ffffff',
              padding: 12,
              border: '1px solid #d1d5db',
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
            }}
          >
            {sheet.content}
          </div>
        </div>
      ))}
    </div>
  );
}
