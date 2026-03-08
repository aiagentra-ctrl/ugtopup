import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Code, Key, Zap, MessageSquare, ShoppingCart, CreditCard, Search } from "lucide-react";

const BASE_URL = "https://iwcqutzgtpbdowghalnl.supabase.co/functions/v1/chatbot-api";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3Y3F1dHpndHBiZG93Z2hhbG5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMDkxNDYsImV4cCI6MjA3NjU4NTE0Nn0.f_NA471WGd5doUunIq39i3kh1NXYA70g1vVwTJU70P4";

const CodeBlock = ({ children }: { children: string }) => (
  <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm leading-relaxed">
    <code className="text-foreground">{children}</code>
  </pre>
);

const ApiDocs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3 py-8">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Chatbot API Documentation</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A single HTTPS API that powers the website chatbot, WhatsApp bots, and any future integration. 
            Send a message, get a structured reply.
          </p>
        </div>

        {/* Architecture */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> Architecture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>All platforms use the same endpoint. The API handles AI responses, product search, order tracking, and credit requests.</p>
            <CodeBlock>{`External Platform (WhatsApp, Telegram, etc.)
        │
        ▼  POST /chatbot-api
┌──────────────────────────┐
│   Chatbot API (Edge Fn)  │
│  ┌────────┐ ┌──────────┐ │
│  │ AI/LLM │ │ Products │ │
│  └────────┘ └──────────┘ │
│  ┌────────┐ ┌──────────┐ │
│  │ Orders │ │ Context  │ │
│  └────────┘ └──────────┘ │
└──────────────────────────┘
        │
        ▼  JSON response
External Platform displays reply`}</CodeBlock>
          </CardContent>
        </Card>

        {/* Base URL & Auth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Base URL &amp; Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-2">All requests are <Badge variant="secondary">POST</Badge> to:</p>
              <CodeBlock>{BASE_URL}</CodeBlock>
            </div>
            <div>
              <p className="text-muted-foreground mb-2">Include the <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">apikey</code> header:</p>
              <CodeBlock>{`curl -X POST "${BASE_URL}" \\
  -H "apikey: ${ANON_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{"action":"message","message":"hello"}'`}</CodeBlock>
            </div>
          </CardContent>
        </Card>

        {/* Session & Platform */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Session &amp; Platform</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              To maintain conversation context across messages, include <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">session_id</code> and <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">platform</code> in every request.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>session_id</strong> — Unique per user/conversation (e.g. phone number, chat ID). Required for context.</li>
              <li><strong>platform</strong> — Identifies the source: <code className="bg-muted px-1 rounded text-foreground">"whatsapp"</code>, <code className="bg-muted px-1 rounded text-foreground">"telegram"</code>, <code className="bg-muted px-1 rounded text-foreground">"web"</code> (default).</li>
            </ul>
            <p>
              For non-web platforms, the API loads conversation history from the server (last 10 messages). 
              For <code className="bg-muted px-1 rounded text-foreground">"web"</code>, the client sends <code className="bg-muted px-1 rounded text-foreground">history</code> directly (backward compatible).
            </p>
            <p>Conversations are stored for <strong>10 days</strong> and then automatically cleaned up.</p>
          </CardContent>
        </Card>

        {/* Endpoint: message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              <Badge>action: "message"</Badge>
              — Chat / Product Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">Send a user message. The API auto-detects product queries and returns structured product data alongside the AI reply.</p>
            <div>
              <p className="font-medium text-foreground mb-1">Request</p>
              <CodeBlock>{`{
  "action": "message",
  "session_id": "wa-9779708562001",
  "platform": "whatsapp",
  "message": "I want to buy Free Fire diamonds"
}`}</CodeBlock>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Response</p>
              <CodeBlock>{`{
  "reply": "Here are the available Free Fire diamond packages...",
  "products": [
    {
      "name": "110 Diamonds",
      "price": "NPR 120",
      "image_url": "https://...",
      "link": "/freefire-diamond",
      "delivery_time": "5–10 minutes"
    }
  ],
  "product": { ... },
  "timestamp": "2026-03-08T12:00:00.000Z"
}`}</CodeBlock>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="font-medium text-foreground mb-1">💡 Product Detection</p>
              <p className="text-muted-foreground">
                The API recognizes keywords like "free fire", "netflix", "pubg", "tiktok", etc. 
                When detected, it fetches real-time pricing from the database and includes a <code className="bg-muted px-1 rounded text-foreground">products</code> array.
                If no product keyword is found, only <code className="bg-muted px-1 rounded text-foreground">reply</code> is returned.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Endpoint: order-status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <Badge>action: "order-status"</Badge>
              — Track Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">Look up orders by order number or email.</p>
            <div>
              <p className="font-medium text-foreground mb-1">Request</p>
              <CodeBlock>{`{
  "action": "order-status",
  "order_id": "john-a1b"
}`}</CodeBlock>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Response</p>
              <CodeBlock>{`{
  "orders": [
    {
      "order_number": "john-a1b",
      "product": "Free Fire Diamond",
      "package": "110 Diamonds",
      "status": "confirmed",
      "price": 120,
      "created_at": "2026-03-07T10:00:00Z",
      "confirmed_at": "2026-03-07T10:05:00Z"
    }
  ],
  "timestamp": "2026-03-08T12:00:00.000Z"
}`}</CodeBlock>
            </div>
          </CardContent>
        </Card>

        {/* Endpoint: credit-request */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <Badge>action: "credit-request"</Badge>
              — Submit Credit Top-Up
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">Submit a credit/wallet top-up request on behalf of a user.</p>
            <div>
              <p className="font-medium text-foreground mb-1">Request</p>
              <CodeBlock>{`{
  "action": "credit-request",
  "name": "Ram Sharma",
  "email": "ram@example.com",
  "amount": "500",
  "whatsapp": "9779708562001"
}`}</CodeBlock>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Response</p>
              <CodeBlock>{`{
  "success": true,
  "message": "Credit request of NPR 500 submitted successfully! ...",
  "request_id": "a1b2c3d4",
  "timestamp": "2026-03-08T12:00:00.000Z"
}`}</CodeBlock>
            </div>
          </CardContent>
        </Card>

        {/* Full curl example */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5" /> Full curl Example</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <CodeBlock>{`# Chat with product search + conversation context
curl -X POST "${BASE_URL}" \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "message",
    "session_id": "wa-9779708562001",
    "platform": "whatsapp",
    "message": "What Free Fire diamond packages do you have?"
  }'

# Follow-up (same session_id → server remembers context)
curl -X POST "${BASE_URL}" \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "message",
    "session_id": "wa-9779708562001",
    "platform": "whatsapp",
    "message": "How about the 110 diamonds one?"
  }'`}</CodeBlock>
          </CardContent>
        </Card>

        {/* Rate Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Limits &amp; Privacy</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <ul className="list-disc list-inside space-y-1">
              <li>AI responses are rate-limited by the upstream provider. If you receive a 429 status, retry after a few seconds.</li>
              <li>Conversation logs are stored for <strong>10 days</strong> and then automatically purged.</li>
              <li>The API uses the Supabase anon key for authentication — no user credentials are required.</li>
            </ul>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ApiDocs;
