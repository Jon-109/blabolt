import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request: NextRequest) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);
    const body = await request.json();
    const {
      businessName,
      firstName,
      lastName,
      email,
      phone,
      services,
      loanPurpose,
      fundingAmount,
      concerns,
      message,
      prefersPhoneCall,
      source,
    } = body;

    if (!firstName || !lastName || !email || !Array.isArray(services) || !loanPurpose || !fundingAmount || !Array.isArray(concerns)) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }
    if (services.length > 12 || concerns.length > 15) {
      return NextResponse.json(
        { error: 'Too many selections submitted' },
        { status: 400 }
      );
    }
    if (prefersPhoneCall && String(phone ?? '').replace(/\D/g, '').length < 10) {
      return NextResponse.json(
        { error: 'A valid phone number is required for callback requests' },
        { status: 400 }
      );
    }
    if (
      String(businessName).length > 200 ||
      String(firstName).length > 100 ||
      String(lastName).length > 100 ||
      String(email).length > 200 ||
      String(phone ?? '').length > 60 ||
      String(loanPurpose).length > 120 ||
      String(fundingAmount).length > 80 ||
      String(source ?? '').length > 250 ||
      String(message ?? '').length > 10000
    ) {
      return NextResponse.json(
        { error: 'Input exceeds allowed length' },
        { status: 400 }
      );
    }

    const safeBusinessName = escapeHtml(String(businessName ?? '').trim() || 'Not provided');
    const safeFirstName = escapeHtml(String(firstName).trim());
    const safeLastName = escapeHtml(String(lastName).trim());
    const safeEmail = escapeHtml(String(email).trim());
    const safePhone = escapeHtml(String(phone ?? '').trim() || 'Not provided');
    const safeServices = services.map((service: unknown) => escapeHtml(String(service).trim()));
    const safeLoanPurpose = escapeHtml(String(loanPurpose).trim());
    const safeFundingAmount = escapeHtml(String(fundingAmount).trim());
    const safePrefersPhoneCall = prefersPhoneCall ? 'Yes - prefers a phone call' : 'No preference selected';
    const safeConcerns = concerns.map((concern: unknown) => escapeHtml(String(concern).trim()));
    const safeMessage = escapeHtml(String(message ?? '').trim() || 'Not provided');
    const safeSource = escapeHtml(String(source ?? '').trim() || 'Unknown');
    const servicesList = safeServices.map((service: string) => `• ${service}`).join('\n');
    const concernsList = safeConcerns.map((concern: string) => `• ${concern}`).join('\n');

    const { data, error } = await resend.emails.send({
      from: 'Business Lending Advocate <onboarding@resend.dev>',
      to: ['jonathan@businesslendingadvocate.com'],
      replyTo: safeEmail,
      subject: `New Funding Interest Lead - ${safeFirstName} ${safeLastName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
              }
              .header {
                background-color: #002c55;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background-color: white;
                padding: 30px;
                border-radius: 0 0 8px 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .field {
                margin-bottom: 20px;
              }
              .field-label {
                font-weight: bold;
                color: #002c55;
                margin-bottom: 5px;
              }
              .field-value {
                color: #555;
                padding: 10px;
                background-color: #f5f5f5;
                border-radius: 4px;
              }
              .concerns-list {
                white-space: pre-line;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>New Contact Form Submission</h1>
              </div>
              <div class="content">
                <div class="field">
                  <div class="field-label">Business Name:</div>
                  <div class="field-value">${safeBusinessName}</div>
                </div>
                
                <div class="field">
                  <div class="field-label">Contact Name:</div>
                  <div class="field-value">${safeFirstName} ${safeLastName}</div>
                </div>

                <div class="field">
                  <div class="field-label">Email:</div>
                  <div class="field-value">${safeEmail}</div>
                </div>

                <div class="field">
                  <div class="field-label">Phone:</div>
                  <div class="field-value">${safePhone}</div>
                </div>

                <div class="field">
                  <div class="field-label">Interested In:</div>
                  <div class="field-value concerns-list">${servicesList}</div>
                </div>

                <div class="field">
                  <div class="field-label">Loan Purpose:</div>
                  <div class="field-value">${safeLoanPurpose}</div>
                </div>

                <div class="field">
                  <div class="field-label">Funding Amount:</div>
                  <div class="field-value">${safeFundingAmount}</div>
                </div>

                <div class="field">
                  <div class="field-label">Contact Preference:</div>
                  <div class="field-value">${safePrefersPhoneCall}</div>
                </div>
                
                <div class="field">
                  <div class="field-label">Top Concerns:</div>
                  <div class="field-value concerns-list">${concernsList}</div>
                </div>
                
                <div class="field">
                  <div class="field-label">Loan Details & Message:</div>
                  <div class="field-value">${safeMessage.replace(/\n/g, '<br>')}</div>
                </div>

                <div class="field">
                  <div class="field-label">Page Source:</div>
                  <div class="field-value">${safeSource}</div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, messageId: data?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
