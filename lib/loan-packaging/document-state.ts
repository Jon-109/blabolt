import {
  COMPLETED_DOCUMENT_STATUSES,
  type DocumentStatus,
} from '@/lib/loan-packaging/constants';

type DocumentStatusLike = { status?: unknown } | null | undefined;
type DocumentExclusionLike = { excluded_from_package?: unknown } | null | undefined;

export function toDocumentStatus(value: unknown): DocumentStatus {
  switch (value) {
    case 'uploaded':
    case 'generated':
    case 'approved':
    case 'not_started':
      return value;
    default:
      return 'not_started';
  }
}

export function isDocumentCompleted(document: DocumentStatusLike): boolean {
  if (!document) {
    return false;
  }

  return COMPLETED_DOCUMENT_STATUSES.has(toDocumentStatus(document.status));
}

export function isDocumentExcludedFromPackage(document: DocumentExclusionLike): boolean {
  return document?.excluded_from_package === true;
}
