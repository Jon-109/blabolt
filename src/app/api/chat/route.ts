import OpenAI from 'openai';
import { NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_MESSAGE: ChatMessage = {
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
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });

    const body = await req.json();

    // Validate messages exists
    if (!body.messages) {
      return NextResponse.json(
        { error: 'Messages field is required' },
        { status: 400 }
      );
    }

    // Validate messages is an array
    if (!Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Messages must be an array' },
        { status: 400 }
      );
    }

    // Validate each message has required fields and correct format
    const isValidMessage = (msg: any): msg is ChatMessage => {
      return (
        typeof msg === 'object' &&
        msg !== null &&
        typeof msg.content === 'string' &&
        ['user', 'assistant', 'system'].includes(msg.role)
      );
    };

    if (!body.messages.every(isValidMessage)) {
      return NextResponse.json(
        { error: 'Invalid message format. Each message must have role and content fields' },
        { status: 400 }
      );
    }

    const messages: ChatMessage[] = body.messages;

    // Convert messages to OpenAI format
    const formattedMessages = [
      SYSTEM_MESSAGE,
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: formattedMessages as any[],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      // Validate OpenAI response
      if (!completion.choices || completion.choices.length === 0) {
        console.error('Empty response from OpenAI:', completion);
        return NextResponse.json(
          { error: 'No response generated from AI' },
          { status: 500 }
        );
      }

      const message = completion.choices[0].message;

      // Validate message content
      if (!message || !message.content) {
        console.error('Invalid message format from OpenAI:', message);
        return NextResponse.json(
          { error: 'Invalid response format from AI' },
          { status: 500 }
        );
      }

      // Return the response
      return NextResponse.json({
        content: message.content,
        role: 'assistant'
      });

    } catch (openAIError: any) {
      // Log detailed OpenAI error
      console.error('OpenAI API Error Details:', {
        error: openAIError,
        message: openAIError.message,
        type: openAIError.type,
        status: openAIError.status,
      });

      // Return more specific error message
      if (openAIError.status === 401) {
        return NextResponse.json(
          { error: 'Authentication error with AI service' },
          { status: 401 }
        );
      }

      if (openAIError.status === 429) {
        return NextResponse.json(
          { error: 'AI service rate limit exceeded' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `AI service error: ${openAIError.message}` },
        { status: openAIError.status || 500 }
      );
    }

  } catch (error) {
    // Existing error handling for validation errors
    if (error instanceof Error && error.name === 'SyntaxError') {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Log the full error for debugging
    console.error('OpenAI API error:', error);
    
    // Return a user-friendly error message
    return NextResponse.json(
      { error: 'There was an error processing your request' },
      { status: 500 }
    );
  }
} 