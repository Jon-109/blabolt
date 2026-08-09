"use client";

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

import { trackCtaClick } from '@/lib/analytics';

type TrackedGuideLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
  pageTemplate: string;
  sectionId: string;
  ctaId: string;
  ctaLabel: string;
  destinationUrl: string;
};

export default function TrackedGuideLink({
  children,
  pageTemplate,
  sectionId,
  ctaId,
  ctaLabel,
  destinationUrl,
  onClick,
  ...props
}: TrackedGuideLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackCtaClick({
          page_template: pageTemplate,
          section_id: sectionId,
          cta_id: ctaId,
          cta_label: ctaLabel,
          destination_url: destinationUrl,
        });
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}
