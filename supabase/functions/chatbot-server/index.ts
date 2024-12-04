import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://deno.land/x/openai@1.4.2/mod.ts"

interface WebSocketEvent {
  data: string;
}

const openAI = new OpenAI(Deno.env.get('OPENAI_API_KEY') || '');

serve(async (req: Request) => {
  // Add CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    })
  }

  // Log incoming request
  console.log(`[${new Date().toISOString()}] Incoming request:`, {
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
  });

  // Check if it's a WebSocket upgrade request
  if (req.headers.get("upgrade") !== "websocket") {
    console.error("[ERROR] Not a WebSocket upgrade request");
    return new Response("Expected WebSocket upgrade", { 
      status: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      }
    });
  }

  try {
    // Create WebSocket connection with headers in the upgrade request
    const upgradeRequest = new Request(req.url, {
      method: req.method,
      headers: new Headers({
        ...Object.fromEntries(req.headers.entries()),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      }),
    });

    const { socket, response } = Deno.upgradeWebSocket(upgradeRequest);
    console.log("[INFO] WebSocket connection upgraded successfully");

    socket.onopen = () => {
      console.log("[INFO] WebSocket connection opened");
    };

    socket.onmessage = async (event: WebSocketEvent) => {
      console.log("[INFO] Received message:", event.data);

      // Validate message
      if (!event.data) {
        console.error("[ERROR] Empty message received");
        socket.send("Error: Message cannot be empty");
        return;
      }

      try {
        // Call OpenAI API
        console.log("[INFO] Calling OpenAI API");
        const completion = await openAI.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a helpful Business Lending Assistant for Business Lending Advocate. 
              Your expertise includes:
              - SBA loans (especially 7(a) loans)
              - Business loan qualification requirements
              - Financial documentation needed for loans
              - General business lending advice
              
              Keep responses concise and focused on business lending topics.
              If asked about something outside business lending, politely redirect to lending-related topics.
              Always maintain a professional, friendly tone.`
            },
            {
              role: "user",
              content: event.data,
            },
          ],
        });

        const response = completion.choices[0]?.message?.content;
        console.log("[INFO] OpenAI API response received");

        if (response) {
          socket.send(response);
          console.log("[INFO] Response sent to client");
        } else {
          console.error("[ERROR] Empty response from OpenAI");
          socket.send("I apologize, but I couldn't generate a response. Please try again.");
        }
      } catch (error) {
        console.error("[ERROR] OpenAI API error:", error);
        socket.send("I apologize, but I encountered an error. Please try again in a moment.");
      }
    };

    socket.onerror = (error: Event) => {
      console.error("[ERROR] WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("[INFO] WebSocket connection closed");
    };

    return response;
  } catch (error: unknown) {
    console.error("[ERROR] WebSocket upgrade failed:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Failed to upgrade WebSocket connection: ${errorMessage}`, {
      status: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      }
    });
  }
});

// Log any unhandled errors
addEventListener("error", (event: ErrorEvent) => {
  console.error("[ERROR] Unhandled error:", event.error);
});

addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
  console.error("[ERROR] Unhandled promise rejection:", event.reason);
});
