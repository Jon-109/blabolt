import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, firstName, lastName, concerns, message } = body;

    // Validate required fields
    if (!businessName || !firstName || !lastName || !concerns || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Format concerns list
    const concernsList = concerns.map((concern: string) => `• ${concern}`).join('\n');

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Business Lending Advocate <onboarding@resend.dev>', // You'll need to update this with your verified domain
      to: ['jonathan@businesslendingadvocate.com'],
      subject: `New Contact Form Submission - ${businessName}`,
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
                  <div class="field-value">${businessName}</div>
                </div>
                
                <div class="field">
                  <div class="field-label">Contact Name:</div>
                  <div class="field-value">${firstName} ${lastName}</div>
                </div>
                
                <div class="field">
                  <div class="field-label">Top Concerns:</div>
                  <div class="field-value concerns-list">${concernsList}</div>
                </div>
                
                <div class="field">
                  <div class="field-label">Loan Details & Message:</div>
                  <div class="field-value">${message.replace(/\n/g, '<br>')}</div>
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
