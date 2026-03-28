interface BrokerFeeAgreementSvgParams {
  businessName: string;
  signerName: string;
  signedAt?: string | Date | null;
}

const PAGE_WIDTH = 816;
const PAGE_HEIGHT = 1056;
const PAGE_MARGIN_X = 56;
const PAGE_MARGIN_Y = 52;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN_X * 2;
const BODY_FONT_SIZE = 12.2;
const BODY_LINE_HEIGHT = 17;
const SECTION_HEADING_FONT_SIZE = 13.2;
const SECTION_GAP = 8;
const PARAGRAPH_GAP = 7;
const BULLET_INDENT = 18;
const BROKER_NAME = 'Jonathan Aranda';
const BROKER_COMPANY = 'Business Lending Advocate';
const BODY_FONT_FAMILY = '"Times New Roman", Times, serif';
const SIGNATURE_FONT_FAMILY = '"Snell Roundhand", "Apple Chancery", "Brush Script MT", cursive';

type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] };

interface AgreementSection {
  title: string;
  blocks: Block[];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(text: string, maxChars: number): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return [];
  }

  const words = normalized.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length <= maxChars) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function formatSignedDate(value?: string | Date | null): string {
  if (!value) {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function buildAgreementSections(): AgreementSection[] {
  return [
    {
      title: '1. Engagement and Scope of Services',
      blocks: [
        {
          type: 'paragraph',
          text: 'Client engages Business Lending Advocate ("Broker") to assist in the evaluation, preparation, structuring, and facilitation of business financing.',
        },
        {
          type: 'paragraph',
          text: 'Broker’s services may include, but are not limited to:',
        },
        {
          type: 'bullets',
          items: [
            'Reviewing financial and business information',
            'Advising on loan structure and positioning',
            'Preparing or assisting with loan documentation',
            'Introducing Client to potential lenders or funding sources',
            'Facilitating communication between Client and lenders',
          ],
        },
        {
          type: 'paragraph',
          text: 'Broker does not act as a lender and does not make credit decisions. All approvals and funding outcomes are determined solely by third-party lenders.',
        },
      ],
    },
    {
      title: '2. Broker Compensation (1% Success Fee)',
      blocks: [
        {
          type: 'paragraph',
          text: 'Client agrees to pay Broker a fee equal to 1% (one percent) of the total amount of financing funded.',
        },
        {
          type: 'paragraph',
          text: 'This fee applies exclusively to financing obtained through lenders or funding sources introduced by Broker, whether such introduction is direct or indirect.',
        },
        {
          type: 'paragraph',
          text: 'The Broker fee is earned upon funding, defined as the moment funds are disbursed to Client.',
        },
      ],
    },
    {
      title: '3. Payment Terms',
      blocks: [
        {
          type: 'paragraph',
          text: 'Client agrees that the Broker fee shall be paid:',
        },
        {
          type: 'bullets',
          items: [
            'At closing, or',
            'No later than three (3) business days after receipt of funds',
          ],
        },
        {
          type: 'paragraph',
          text: 'Client acknowledges that Broker’s fee is tied to successful funding and is not contingent upon the continued involvement of Broker at the time of closing, provided the funding source was introduced by Broker.',
        },
      ],
    },
    {
      title: '4. Non-Circumvention and Introduced Lenders',
      blocks: [
        {
          type: 'paragraph',
          text: 'Client agrees not to bypass, avoid, or circumvent Broker in order to avoid payment of the agreed fee.',
        },
        {
          type: 'paragraph',
          text: 'If Client, directly or indirectly:',
        },
        {
          type: 'bullets',
          items: [
            'Engages with',
            'Applies to',
            'Negotiates with, or',
            'Receives financing from',
          ],
        },
        {
          type: 'paragraph',
          text: 'any lender, funding source, or financial partner introduced by Broker, the full 1% Broker fee remains due and payable, regardless of whether Broker is involved at the time of funding.',
        },
        {
          type: 'paragraph',
          text: 'An introduction includes, but is not limited to:',
        },
        {
          type: 'bullets',
          items: [
            'Direct referrals',
            'Email or platform introductions',
            'Shared lender names, contacts, or opportunities',
            'Any situation where Broker provided access or awareness to a funding source',
          ],
        },
      ],
    },
    {
      title: '5. Independent Financing and Loan Packaging Fee',
      blocks: [
        {
          type: 'paragraph',
          text: 'Client acknowledges that Broker provides valuable advisory, structuring, and preparation services during the engagement.',
        },
        {
          type: 'paragraph',
          text: 'If Client chooses to obtain financing outside of Broker’s lender network, including through:',
        },
        {
          type: 'bullets',
          items: [
            'Their own bank',
            'A lender independently sourced by Client',
            'Any funding source not introduced by Broker',
          ],
        },
        {
          type: 'paragraph',
          text: 'then Client agrees to pay a Loan Packaging Fee of $499.',
        },
        {
          type: 'paragraph',
          text: 'This fee applies if Client:',
        },
        {
          type: 'bullets',
          items: [
            'Uses information, guidance, or preparation provided by Broker to secure financing independently, or',
            'Proceeds with financing outside of Broker’s introductions after engaging Broker’s services',
          ],
        },
        {
          type: 'paragraph',
          text: 'This provision ensures fair compensation for the time, expertise, and strategic value provided by Broker, even if funding is ultimately secured independently.',
        },
      ],
    },
    {
      title: '6. Protection Period',
      blocks: [
        {
          type: 'paragraph',
          text: 'This Agreement shall remain in effect for a period of six (6) months from the date of execution.',
        },
        {
          type: 'paragraph',
          text: 'If Client receives funding from any lender introduced by Broker during this period, the Broker fee shall remain due, regardless of when funding occurs or whether Broker is actively involved at the time of closing.',
        },
      ],
    },
    {
      title: '7. Client Responsibilities',
      blocks: [
        {
          type: 'paragraph',
          text: 'Client agrees to:',
        },
        {
          type: 'bullets',
          items: [
            'Provide accurate, complete, and truthful information',
            'Respond promptly to requests from Broker or lenders',
            'Act in good faith throughout the financing process',
          ],
        },
        {
          type: 'paragraph',
          text: 'Client understands that inaccurate or incomplete information may impact funding outcomes and does not relieve Client of any obligations under this Agreement.',
        },
      ],
    },
    {
      title: '8. No Guarantee of Funding',
      blocks: [
        {
          type: 'paragraph',
          text: 'Client acknowledges that Broker does not guarantee loan approval, funding, or specific terms.',
        },
        {
          type: 'paragraph',
          text: 'All financing decisions are made solely by third-party lenders, and Broker is not responsible for lender decisions, underwriting outcomes, or final loan terms.',
        },
      ],
    },
    {
      title: '9. General Terms',
      blocks: [
        {
          type: 'paragraph',
          text: 'This Agreement shall be governed by the laws of the State of Texas.',
        },
        {
          type: 'paragraph',
          text: 'This Agreement represents the entire understanding between the parties and supersedes all prior discussions or agreements.',
        },
        {
          type: 'paragraph',
          text: 'If any provision of this Agreement is found to be unenforceable, the remaining provisions shall remain in full force and effect.',
        },
      ],
    },
    {
      title: '10. Acceptance',
      blocks: [
        {
          type: 'paragraph',
          text: 'By signing below, both parties acknowledge and agree to the terms outlined in this Agreement.',
        },
      ],
    },
  ];
}

export function renderBrokerFeeAgreementSvg({
  businessName,
  signerName,
  signedAt,
}: BrokerFeeAgreementSvgParams): string {
  const displayBusinessName = businessName.trim() || 'Client Business Name';
  const displaySignerName = signerName.trim() || 'Client Name';
  const displayDate = formatSignedDate(signedAt);
  const sections = buildAgreementSections();

  const textBlocks: string[] = [];
  let currentY = PAGE_MARGIN_Y;

  const pushText = (
    text: string,
    options: {
      x?: number;
      fontSize?: number;
      fontWeight?: string;
      dy?: number;
      fontFamily?: string;
      textAnchor?: 'start' | 'middle' | 'end';
      fill?: string;
    } = {},
  ) => {
    textBlocks.push(
      `<text x="${options.x ?? PAGE_MARGIN_X}" y="${currentY}" font-family="${options.fontFamily ?? BODY_FONT_FAMILY}" font-size="${options.fontSize ?? BODY_FONT_SIZE}" font-weight="${options.fontWeight ?? '400'}" fill="${options.fill ?? '#000000'}" text-anchor="${options.textAnchor ?? 'start'}">${escapeXml(text)}</text>`,
    );
    currentY += options.dy ?? BODY_LINE_HEIGHT;
  };

  const pushWrappedParagraph = (text: string, indent = 0, maxChars = 103) => {
    const lines = wrapText(text, maxChars - Math.floor(indent / 2));
    lines.forEach((line, index) => {
      textBlocks.push(
        `<text x="${PAGE_MARGIN_X + indent}" y="${currentY}" font-family="${BODY_FONT_FAMILY}" font-size="${BODY_FONT_SIZE}" fill="#000000">${escapeXml(line)}</text>`,
      );
      currentY += index === lines.length - 1 ? BODY_LINE_HEIGHT + PARAGRAPH_GAP : BODY_LINE_HEIGHT;
    });
  };

  const pushBulletList = (items: string[]) => {
    items.forEach((item) => {
      const lines = wrapText(item, 96);
      lines.forEach((line, index) => {
        const bulletX = PAGE_MARGIN_X + BULLET_INDENT;
        const textX = bulletX + 12;
        if (index === 0) {
          textBlocks.push(
            `<text x="${bulletX}" y="${currentY}" font-family="${BODY_FONT_FAMILY}" font-size="${BODY_FONT_SIZE}" fill="#000000">•</text>`,
          );
        }
        textBlocks.push(
          `<text x="${textX}" y="${currentY}" font-family="${BODY_FONT_FAMILY}" font-size="${BODY_FONT_SIZE}" fill="#000000">${escapeXml(line)}</text>`,
        );
        currentY += index === lines.length - 1 ? BODY_LINE_HEIGHT + 3 : BODY_LINE_HEIGHT;
      });
    });
    currentY += 2;
  };

  pushText('BROKER FEE AGREEMENT', {
    x: PAGE_WIDTH / 2,
    fontSize: 17.5,
    fontWeight: '700',
    textAnchor: 'middle',
    dy: 24,
  });

  pushWrappedParagraph(`This Broker Fee Agreement ("Agreement") is entered into on ${displayDate}, by and between:`, 0, 108);
  currentY += 4;

  pushText('Broker:', { fontWeight: '700', dy: BODY_LINE_HEIGHT });
  pushText(BROKER_NAME, { dy: BODY_LINE_HEIGHT });
  pushText(BROKER_COMPANY, { dy: BODY_LINE_HEIGHT + 4 });

  pushText('Client:', { fontWeight: '700', dy: BODY_LINE_HEIGHT });
  pushText(displayBusinessName, { dy: BODY_LINE_HEIGHT + 6 });

  sections.forEach((section) => {
    currentY += SECTION_GAP;
    pushText(section.title, {
      fontSize: SECTION_HEADING_FONT_SIZE,
      fontWeight: '700',
      dy: BODY_LINE_HEIGHT,
    });

    section.blocks.forEach((block) => {
      if (block.type === 'paragraph') {
        pushWrappedParagraph(block.text);
        return;
      }

      pushBulletList(block.items);
    });
  });

  currentY += 10;
  pushText('Broker Signature:', { fontWeight: '700', dy: BODY_LINE_HEIGHT + 2 });
  const signatureLineWidth = CONTENT_WIDTH * 0.44;
  const rightColumnX = PAGE_MARGIN_X + CONTENT_WIDTH - signatureLineWidth;
  const leftColumnX = PAGE_MARGIN_X;

  textBlocks.push(
    `<line x1="${leftColumnX}" y1="${currentY + 34}" x2="${leftColumnX + signatureLineWidth}" y2="${currentY + 34}" stroke="#000000" stroke-width="1" />`,
  );
  textBlocks.push(
    `<line x1="${rightColumnX}" y1="${currentY + 34}" x2="${rightColumnX + signatureLineWidth}" y2="${currentY + 34}" stroke="#000000" stroke-width="1" />`,
  );
  textBlocks.push(
    `<text x="${leftColumnX + 6}" y="${currentY + 20}" font-family="${SIGNATURE_FONT_FAMILY}" font-size="24" fill="#000000">${escapeXml(BROKER_NAME)}</text>`,
  );
  textBlocks.push(
    `<text x="${leftColumnX}" y="${currentY + 52}" font-family="${BODY_FONT_FAMILY}" font-size="11.5" fill="#000000">${escapeXml(BROKER_NAME)}</text>`,
  );
  textBlocks.push(
    `<text x="${leftColumnX}" y="${currentY + 68}" font-family="${BODY_FONT_FAMILY}" font-size="11.5" fill="#000000">${escapeXml(BROKER_COMPANY)}</text>`,
  );
  textBlocks.push(
    `<text x="${rightColumnX}" y="${currentY + 20}" font-family="${BODY_FONT_FAMILY}" font-size="${BODY_FONT_SIZE}" fill="#000000">${escapeXml(displayDate)}</text>`,
  );
  textBlocks.push(
    `<text x="${rightColumnX}" y="${currentY + 52}" font-family="${BODY_FONT_FAMILY}" font-size="11.5" fill="#000000">Date</text>`,
  );

  currentY += 96;
  pushText('Client Signature:', { fontWeight: '700', dy: BODY_LINE_HEIGHT + 2 });

  textBlocks.push(
    `<line x1="${leftColumnX}" y1="${currentY + 34}" x2="${leftColumnX + signatureLineWidth}" y2="${currentY + 34}" stroke="#000000" stroke-width="1" />`,
  );
  textBlocks.push(
    `<line x1="${rightColumnX}" y1="${currentY + 34}" x2="${rightColumnX + signatureLineWidth}" y2="${currentY + 34}" stroke="#000000" stroke-width="1" />`,
  );
  textBlocks.push(
    `<text x="${leftColumnX + 6}" y="${currentY + 20}" font-family="${SIGNATURE_FONT_FAMILY}" font-size="24" fill="#000000">${escapeXml(displaySignerName)}</text>`,
  );
  textBlocks.push(
    `<text x="${leftColumnX}" y="${currentY + 52}" font-family="${BODY_FONT_FAMILY}" font-size="11.5" fill="#000000">${escapeXml(displaySignerName)}</text>`,
  );
  textBlocks.push(
    `<text x="${leftColumnX}" y="${currentY + 68}" font-family="${BODY_FONT_FAMILY}" font-size="11.5" fill="#000000">${escapeXml(displayBusinessName)}</text>`,
  );
  textBlocks.push(
    `<text x="${rightColumnX}" y="${currentY + 20}" font-family="${BODY_FONT_FAMILY}" font-size="${BODY_FONT_SIZE}" fill="#000000">${escapeXml(displayDate)}</text>`,
  );
  textBlocks.push(
    `<text x="${rightColumnX}" y="${currentY + 52}" font-family="${BODY_FONT_FAMILY}" font-size="11.5" fill="#000000">Date</text>`,
  );

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" viewBox="0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}" role="img" aria-label="Broker Fee Agreement">
      <rect width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" fill="#ffffff" />
      ${textBlocks.join('')}
    </svg>
  `;
}
