import { extname } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  documentRequirementMatchesLoanPurpose,
  normalizeLoanPurpose,
} from '@/lib/loan-packaging/constants';
import {
  isDocumentCompleted,
  isDocumentExcludedFromPackage,
} from '@/lib/loan-packaging/document-state';
import { createZipArchive } from '@/lib/loan-packaging/zip';
import { resolveServiceAccessForUser } from '@/lib/server/service-access';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { isApiUserFailure, requireApiUser } from '@/lib/server/request-auth';

export const runtime = 'nodejs';

type AnyRow = Record<string, unknown>;

const packageSchema = z.object({
  loanRequestId: z.string().uuid(),
});

async function ensureLoanPackagingApiAccess(user: { id: string; email?: string | null }) {
  const access = await resolveServiceAccessForUser({
    id: user.id,
    email: user.email ?? undefined,
  });

  return access.canAccessLoanPackaging;
}

function sanitizeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 64) || 'document';
}

function extensionFromMimeType(mimeType: string | null | undefined): string {
  switch (mimeType) {
    case 'application/pdf':
      return '.pdf';
    case 'image/png':
      return '.png';
    case 'image/jpeg':
      return '.jpg';
    case 'text/plain':
      return '.txt';
    case 'text/csv':
      return '.csv';
    case 'application/vnd.ms-excel':
      return '.xls';
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return '.xlsx';
    case 'application/msword':
      return '.doc';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return '.docx';
    default:
      return '.pdf';
  }
}

function safeExtname(fileName: string | null | undefined, mimeType: string | null | undefined): string {
  if (fileName) {
    const extension = extname(fileName).toLowerCase();
    if (extension) {
      return extension;
    }
  }

  return extensionFromMimeType(mimeType);
}

function ensureUniqueArchivePath(path: string, usedPaths: Set<string>): string {
  if (!usedPaths.has(path)) {
    usedPaths.add(path);
    return path;
  }

  const extension = extname(path);
  const baseName = extension ? path.slice(0, -extension.length) : path;

  let attempt = 2;
  while (true) {
    const candidate = `${baseName}-${attempt}${extension}`;
    if (!usedPaths.has(candidate)) {
      usedPaths.add(candidate);
      return candidate;
    }
    attempt += 1;
  }
}

function buildPackageArchiveFileName(
  businessName: string | null | undefined,
  loanRequestId: string,
): string {
  if (!businessName?.trim()) {
    return `loan-package-${loanRequestId.slice(0, 8)}.zip`;
  }

  const baseName = sanitizeFileName(businessName);

  return baseName.endsWith('loan-package')
    ? `${baseName}.zip`
    : `${baseName}-loan-package.zip`;
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiUserFailure(auth)) {
    return auth.response;
  }
  if (!(await ensureLoanPackagingApiAccess(auth.user))) {
    return NextResponse.json({ error: 'Loan packaging access is required' }, { status: 403 });
  }

  const parsed = packageSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { loanRequestId } = parsed.data;
  const admin = getSupabaseAdmin();

  const loanRequestResult = await admin
    .from('loan_requests')
    .select('*')
    .eq('id', loanRequestId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  const loanRequest = (loanRequestResult.data as AnyRow | null) ?? null;

  if (!loanRequest) {
    return NextResponse.json({ error: 'Loan request not found' }, { status: 404 });
  }

  const [documentResult, requirementsResult] = await Promise.all([
    admin
      .from('loan_request_documents')
      .select('*')
      .eq('loan_request_id', loanRequestId)
      .eq('user_id', auth.user.id)
      .order('updated_at', { ascending: true }),
    admin
      .from('document_requirements')
      .select('*')
      .in(
        'service_type',
        String(loanRequest.service_type) === 'loan_brokering'
          ? ['loan_packaging', 'loan_brokering']
          : [String(loanRequest.service_type)],
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ]);

  const documents = (documentResult.data ?? []) as AnyRow[];
  const requirements = (requirementsResult.data ?? []) as AnyRow[];
  const applicableRequirements = requirements.filter((requirement) =>
    documentRequirementMatchesLoanPurpose(
      typeof requirement.loan_purpose === 'string' ? requirement.loan_purpose : null,
      normalizeLoanPurpose(typeof loanRequest.loan_purpose === 'string' ? loanRequest.loan_purpose : null),
    ),
  );

  const requirementByKey = new Map(
    applicableRequirements.map((requirement) => [String(requirement.requirement_key), requirement]),
  );

  const documentByRequirementKey = new Map(
    documents.map((document) => [String(document.requirement_key), document]),
  );

  const missingRequiredDocuments = applicableRequirements
    .filter((requirement) => Boolean(requirement.required))
    .flatMap((requirement) => {
      const requirementKey = String(requirement.requirement_key);
      const document = documentByRequirementKey.get(requirementKey);

      if (isDocumentExcludedFromPackage(document)) {
        return [];
      }

      if (!document) {
        return [{
          requirementKey,
          displayName: String(requirement.display_name ?? requirementKey),
          reason: 'No document record exists yet.',
        }];
      }

      if (!isDocumentCompleted(document)) {
        return [{
          requirementKey,
          displayName: String(requirement.display_name ?? requirementKey),
          reason: 'This requirement is not completed yet.',
        }];
      }

      if (!document.file_path) {
        return [{
          requirementKey,
          displayName: String(requirement.display_name ?? requirementKey),
          reason: 'A completed file artifact is missing for this requirement.',
        }];
      }

      return [];
    });

  if (missingRequiredDocuments.length > 0) {
    return NextResponse.json(
      {
        error: 'Complete every required document before building the package ZIP.',
        missingRequirements: missingRequiredDocuments,
      },
      { status: 400 },
    );
  }

  const coverLetterDocument = documentByRequirementKey.get('cover_letter');
  const coverLetterReady =
    String(loanRequest.cover_letter_status ?? '') === 'approved' &&
    coverLetterDocument &&
    isDocumentCompleted(coverLetterDocument) &&
    coverLetterDocument.file_path;

  if (!coverLetterReady) {
    return NextResponse.json(
      {
        error: 'Approve the cover letter PDF before building the package ZIP.',
      },
      { status: 400 },
    );
  }

  const packageableDocuments = documents
    .filter((document) => {
      const requirementKey = String(document.requirement_key);
      return (
        requirementByKey.has(requirementKey) &&
        !isDocumentExcludedFromPackage(document) &&
        isDocumentCompleted(document) &&
        Boolean(document.file_path)
      );
    })
    .sort((left, right) => {
      const leftRequirement = requirementByKey.get(String(left.requirement_key));
      const rightRequirement = requirementByKey.get(String(right.requirement_key));
      const leftSortOrder = Number(leftRequirement?.sort_order ?? 999);
      const rightSortOrder = Number(rightRequirement?.sort_order ?? 999);

      if (leftSortOrder !== rightSortOrder) {
        return leftSortOrder - rightSortOrder;
      }

      return String(left.requirement_key).localeCompare(String(right.requirement_key));
    });

  const zipFiles: Array<{ name: string; data: Buffer }> = [];
  const usedArchivePaths = new Set<string>();
  const includedDocuments: Array<Record<string, unknown>> = [];
  const retrievalFailures: Array<Record<string, string>> = [];

  for (const document of packageableDocuments) {
    const metadata = (document.metadata ?? {}) as Record<string, unknown>;
    const bucket = typeof metadata.bucket === 'string' ? metadata.bucket : 'loan-package-documents';

    const downloadResult = await admin.storage
      .from(bucket)
      .download(String(document.file_path));

    if (downloadResult.error || !downloadResult.data) {
      retrievalFailures.push({
        requirementKey: String(document.requirement_key),
        reason: downloadResult.error?.message ?? 'Storage download failed',
      });
      continue;
    }

    const fileBuffer = Buffer.from(await downloadResult.data.arrayBuffer());
    const requirement = requirementByKey.get(String(document.requirement_key));
    const originalFileName = typeof metadata.original_file_name === 'string'
      ? metadata.original_file_name
      : null;
    const extension = safeExtname(
      originalFileName,
      typeof document.mime_type === 'string' ? document.mime_type : null,
    );
    const baseName = requirement?.display_name
      ? sanitizeFileName(String(requirement.display_name))
      : sanitizeFileName(String(document.requirement_key));
    const archivePath = ensureUniqueArchivePath(
      `documents/${String(requirement?.sort_order ?? 999).padStart(3, '0')}-${baseName}${extension}`,
      usedArchivePaths,
    );

    zipFiles.push({
      name: archivePath,
      data: fileBuffer,
    });
    includedDocuments.push({
      requirement_key: String(document.requirement_key),
      display_name: String(requirement?.display_name ?? document.requirement_key),
      archive_path: archivePath,
      source: String(document.source ?? 'upload'),
      status: String(document.status ?? 'uploaded'),
      original_file_name: originalFileName,
      mime_type: typeof document.mime_type === 'string' ? document.mime_type : null,
      uploaded_at: document.uploaded_at,
    });
  }

  if (retrievalFailures.length > 0) {
    return NextResponse.json(
      {
        error: 'The package could not be built because one or more completed files could not be retrieved.',
        retrievalFailures,
      },
      { status: 409 },
    );
  }

  if (zipFiles.length === 0) {
    return NextResponse.json(
      { error: 'No completed uploaded or generated files are available to package yet.' },
      { status: 400 },
    );
  }

  const generatedAt = new Date().toISOString();
  const archiveFileName = buildPackageArchiveFileName(
    typeof loanRequest.business_name === 'string' ? loanRequest.business_name : null,
    loanRequestId,
  );

  zipFiles.push({
    name: 'package-manifest.json',
    data: Buffer.from(
      JSON.stringify(
        {
          generated_at: generatedAt,
          archive_file_name: archiveFileName,
          service_type: loanRequest.service_type,
          business_name: loanRequest.business_name,
          loan_purpose: loanRequest.loan_purpose,
          loan_amount: loanRequest.loan_amount,
          annual_revenue: loanRequest.annual_revenue,
          years_in_business: loanRequest.years_in_business,
          document_count: includedDocuments.length,
          included_documents: includedDocuments,
        },
        null,
        2,
      ),
      'utf8',
    ),
  });

  const zipBuffer = createZipArchive(zipFiles);
  const packagePath = `${auth.user.id}/${loanRequestId}/${Date.now()}-${archiveFileName}`;

  const uploadResult = await admin.storage
    .from('generated-packages')
    .upload(packagePath, zipBuffer, {
      contentType: 'application/zip',
      upsert: true,
    });

  if (uploadResult.error) {
    return NextResponse.json({ error: uploadResult.error.message }, { status: 500 });
  }

  const signedUrlResult = await admin.storage
    .from('generated-packages')
    .createSignedUrl(packagePath, 60 * 60 * 24);

  if (signedUrlResult.error) {
    return NextResponse.json({ error: signedUrlResult.error.message }, { status: 500 });
  }

  await Promise.all([
    admin
      .from('loan_requests')
      .update({
        package_zip_path: packagePath,
        package_zip_generated_at: generatedAt,
        updated_at: generatedAt,
      })
      .eq('id', loanRequestId)
      .eq('user_id', auth.user.id),
    admin.from('generated_reports').insert({
      user_id: auth.user.id,
      loan_request_id: loanRequestId,
      report_type: 'loan_package_zip',
      source_type: 'package',
      source_id: loanRequestId,
      file_path: packagePath,
      mime_type: 'application/zip',
      file_size_bytes: zipBuffer.length,
      visibility: 'private',
    }),
  ]);

  return NextResponse.json({
    packagePath,
    downloadUrl: signedUrlResult.data?.signedUrl ?? null,
    archiveFileName,
    generatedAt,
    fileCount: includedDocuments.length,
    packageSizeBytes: zipBuffer.length,
  });
}
