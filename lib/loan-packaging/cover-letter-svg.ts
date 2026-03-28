interface CoverLetterSvgParams {
  businessName: string;
  loanPurpose: string;
  loanAmount?: number | null;
  content: string;
  date?: Date;
}

const PAGE_WIDTH = 816;
const PAGE_HEIGHT = 1056;
const PAGE_MARGIN_X = 72;
const PAGE_MARGIN_Y = 78;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN_X * 2;
const BODY_FONT_SIZE = 15;
const BODY_LINE_HEIGHT = 24;
const SECTION_HEADING_GAP = 16;
const PARAGRAPH_GAP = 12;

const SECTION_HEADINGS = [
  'Introduction',
  'Business Overview',
  'Use of Funds',
  'Financial Position',
  'Impact of Loan',
  'Repayment Confidence',
  'Closing',
] as const;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(text: string, maxChars = 88): string[] {
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

function parseCoverLetterSections(content: string): Array<{ heading: string; paragraphs: string[] }> {
  const cleaned = content
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim());

  const sections: Array<{ heading: string; paragraphs: string[] }> = [];
  let currentHeading: string | null = null;
  let currentParagraphs: string[] = [];
  let currentParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      currentParagraphs.push(currentParagraphLines.join(' ').trim());
      currentParagraphLines = [];
    }
  };

  const flushSection = () => {
    flushParagraph();
    if (currentHeading) {
      sections.push({
        heading: currentHeading,
        paragraphs: currentParagraphs.filter((paragraph) => paragraph.length > 0),
      });
    }
    currentHeading = null;
    currentParagraphs = [];
  };

  for (const line of cleaned) {
    if (!line) {
      flushParagraph();
      continue;
    }

    if (
      SECTION_HEADINGS.includes(line as typeof SECTION_HEADINGS[number])
    ) {
      flushSection();
      currentHeading = line;
      continue;
    }

    if (/^dear /i.test(line) || /^credit committee/i.test(line) || /^re:/i.test(line)) {
      continue;
    }

    currentParagraphLines.push(line);
  }

  flushSection();

  if (sections.length === 0) {
    return [
      {
        heading: 'Introduction',
        paragraphs: content
          .split(/\n{2,}/)
          .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
          .filter(Boolean),
      },
    ];
  }

  return sections;
}

export function renderCoverLetterSvg({
  businessName,
  loanPurpose,
  loanAmount,
  content,
  date = new Date(),
}: CoverLetterSvgParams): string {
  const sections = parseCoverLetterSections(content);
  const displayDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const loanAmountText =
    typeof loanAmount === 'number' && Number.isFinite(loanAmount)
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(loanAmount)
      : 'Loan Request';

  let currentY = PAGE_MARGIN_Y;
  const textBlocks: string[] = [];

  const pushText = (
    text: string,
    options: {
      x?: number;
      fontSize?: number;
      fontWeight?: string;
      fill?: string;
      letterSpacing?: string;
      uppercase?: boolean;
      dy?: number;
      fontFamily?: string;
    } = {},
  ) => {
    const x = options.x ?? PAGE_MARGIN_X;
    const fontSize = options.fontSize ?? BODY_FONT_SIZE;
    const fontWeight = options.fontWeight ?? '400';
    const fill = options.fill ?? '#0f172a';
    const letterSpacing = options.letterSpacing ?? '0';
    const fontFamily = options.fontFamily ?? 'Georgia, Times New Roman, serif';
    const textTransform = options.uppercase ? 'uppercase' : 'none';

    textBlocks.push(
      `<text x="${x}" y="${currentY}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}" letter-spacing="${letterSpacing}" style="text-transform:${textTransform};">${escapeXml(text)}</text>`,
    );

    currentY += options.dy ?? BODY_LINE_HEIGHT;
  };

  pushText(businessName, {
    fontSize: 24,
    fontWeight: '700',
    fill: '#0f172a',
    dy: 34,
  });
  pushText('Business Loan Cover Letter', {
    fontSize: 11,
    fontWeight: '600',
    fill: '#475569',
    letterSpacing: '2',
    uppercase: true,
    dy: 24,
  });
  pushText(displayDate, {
    fontSize: 13,
    fill: '#334155',
    dy: 28,
  });
  pushText(`Re: ${loanPurpose} - ${loanAmountText}`, {
    fontSize: 13,
    fontWeight: '600',
    fill: '#0f172a',
    dy: 34,
  });
  pushText('To Whom It May Concern,', {
    fontSize: 15,
    fontWeight: '600',
    dy: 30,
  });

  for (const section of sections) {
    currentY += SECTION_HEADING_GAP;
    pushText(section.heading, {
      fontSize: 12,
      fontWeight: '700',
      fill: '#1e3a8a',
      letterSpacing: '1.2',
      uppercase: true,
      dy: 22,
    });

    for (const paragraph of section.paragraphs) {
      const lines = wrapText(paragraph);
      if (lines.length === 0) {
        continue;
      }

      const tspans = lines
        .map((line, index) => {
          const dy = index === 0 ? 0 : BODY_LINE_HEIGHT;
          return `<tspan x="${PAGE_MARGIN_X}" dy="${dy}">${escapeXml(line)}</tspan>`;
        })
        .join('');

      textBlocks.push(
        `<text x="${PAGE_MARGIN_X}" y="${currentY}" font-family="Georgia, Times New Roman, serif" font-size="${BODY_FONT_SIZE}" fill="#1e293b">${tspans}</text>`,
      );
      currentY += Math.max(lines.length, 1) * BODY_LINE_HEIGHT + PARAGRAPH_GAP;
    }
  }

  currentY += 10;
  pushText('Sincerely,', {
    fontSize: 15,
    dy: 30,
  });
  pushText(businessName, {
    fontSize: 15,
    fontWeight: '600',
    dy: 0,
  });

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" viewBox="0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}">`,
    `<rect width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" fill="#ffffff" />`,
    `<line x1="${PAGE_MARGIN_X}" y1="56" x2="${PAGE_WIDTH - PAGE_MARGIN_X}" y2="56" stroke="#dbeafe" stroke-width="2" />`,
    ...textBlocks,
    '</svg>',
  ].join('');
}
