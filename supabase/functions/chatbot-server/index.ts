import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY environment variable");
  throw new Error("OPENAI_API_KEY environment variable is required");
}

serve(async (req) => {
  // Handle warm-up ping
  if (req.method === "GET") {
    console.log("Received warm-up ping");
    return new Response("Edge Function is ready", { 
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  }

  // Handle WebSocket upgrade for chat
  if (req.headers.get("upgrade") === "websocket") {
    try {
      console.log("Attempting WebSocket upgrade");
      const { socket, response } = Deno.upgradeWebSocket(req);
      console.log("WebSocket upgrade successful");

      // WebSocket lifecycle handlers
      socket.onopen = () => {
        console.log("Client connected - WebSocket connection established");
      };

      socket.onmessage = async (event) => {
        console.log("Raw message received from client:", event.data);
        
        try {
          const message = JSON.parse(event.data);
          console.log("Parsed message:", message);

          if (!message.content) {
            console.error("Invalid message format - missing content");
            socket.send(JSON.stringify({ error: "Message must include content field" }));
            return;
          }

          // ... rest of the existing WebSocket handling code ...
        } catch (error) {
          console.error("Error processing message:", error);
          socket.send(JSON.stringify({ error: "Error processing your request" }));
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error occurred:", error);
      };

      socket.onclose = () => {
        console.log("Client disconnected - WebSocket connection closed");
      };

      return response;
    } catch (error) {
      console.error("Error upgrading to WebSocket:", error);
      return new Response("Error upgrading to WebSocket", { status: 500 });
    }
  }

  // Handle unsupported request types
  return new Response("Method not allowed. Use GET for warm-up or WebSocket upgrade for chat.", { 
    status: 405,
    headers: { "Content-Type": "text/plain" }
  });
});
