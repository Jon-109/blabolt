import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// System message to define the AI assistant's role and behavior
const SYSTEM_MESSAGE = {
  role: 'system',
  content: `You are BLA (Business Lending Advocate) AI, an expert assistant specializing in business loans and financing.
  Your key responsibilities:
  - Help users understand different types of business loans (especially SBA 7(a) loans)
  - Explain loan application processes and requirements
  - Discuss loan packaging and brokering services
  - Answer questions about cash flow analysis
  - Provide general guidance about business financing
  
  Important guidelines:
  - Be professional but friendly
  - Give concise, clear answers
  - Use simple language to explain complex concepts
  - When discussing specific loan amounts or rates, always clarify they are estimates
  - For very specific questions about rates or approval, suggest contacting a BLA representative
  - Never make promises about loan approval
  - Focus on education and guidance rather than sales
  
  Remember: You represent Business Lending Advocate and should align with their mission of helping businesses secure the funding they deserve through expert guidance and simplified processes.`
};

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Add system message to the conversation
    const fullMessages = [
      SYSTEM_MESSAGE,
      ...messages
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    // Return the response
    return NextResponse.json({
      content: completion.choices[0].message.content,
      role: 'assistant'
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'There was an error processing your request' },
      { status: 500 }
    );
  }
} 