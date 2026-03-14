import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Code, Key, Zap, MessageSquare, ShoppingCart, CreditCard, Search, AlertTriangle, Smartphone, DollarSign, CheckCircle, Brain } from "lucide-react";

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
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Unified Chatbot API</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            One endpoint. One message. The AI brain automatically detects intent and executes actions — product search, orders, payments, credit requests — all from a single HTTPS call.
          </p>
        </div>

        {/* Architecture */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p><strong>Send a message → AI decides what to do → Returns structured response.</strong></p>
            <p>No need to specify separate actions. Just send the user's message and the AI will:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Detect if user wants to buy → searches products, shows packages</li>
              <li>Detect if user wants to order → places order with their email + package</li>
              <li>Detect if user asks about status → looks up their order</li>
              <li>Detect if user wants to pay → generates payment link</li>
              <li>Detect if user wants credit → submits credit request</li>
              <li>Otherwise → responds with helpful AI conversation</li>
            </ul>
            <CodeBlock>{`User sends message (any platform)
        │
        ▼  POST /chatbot-api
┌──────────────────────────────┐
│     AI Brain (Edge Fn)       │
│  ┌──────────────────────┐    │
│  │  Intent Detection    │    │
│  │  (AI Tool Calling)   │    │
│  └──────────┬───────────┘    │
│       ┌─────┼─────┐          │
│       ▼     ▼     ▼          │
│   Products Orders Payments   │
│   Search   Place  Generate   │
│       └─────┼─────┘          │
│             ▼                │
│    AI formats final reply    │
└──────────────────────────────┘
        │
        ▼  JSON: { success, reply, action, data }
Platform displays reply`}</CodeBlock>
          </CardContent>
        </Card>

        {/* Base URL & Auth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Endpoint &amp; Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-2">All requests are <Badge variant="secondary">POST</Badge> to one URL:</p>
              <CodeBlock>{BASE_URL}</CodeBlock>
            </div>
            <div>
              <p className="text-muted-foreground mb-2">Include the <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">apikey</code> header:</p>
              <CodeBlock>{`curl -X POST "${BASE_URL}" \\
  -H "apikey: ${ANON_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"hello","session_id":"wa-977XXXXXXXXXX","platform":"whatsapp"}'`}</CodeBlock>
            </div>
          </CardContent>
        </Card>

        {/* Unified Response Format */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5" /> Unified Response Format</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">Every response follows the same structure:</p>
            <CodeBlock>{`{
  "success": true,
  "reply": "Human-readable AI response text",
  "action": "message | product_search | order | order_status | payment | credit_request",
  "data": { /* structured result data */ },
  "products": [ /* included when products found */ ],
  "timestamp": "2026-03-14T12:00:00.000Z"
}`}</CodeBlock>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>reply</strong> — Always present. AI-formatted text ready to display in chat.</li>
              <li><strong>action</strong> — What the AI decided to do (auto-detected from message).</li>
              <li><strong>data</strong> — Structured result (order details, payment URL, products, etc.).</li>
              <li><strong>products</strong> — Array of product cards (when products are found).</li>
            </ul>
          </CardContent>
        </Card>

        {/* Session & Platform */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Session &amp; Platform</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Include these fields for conversation memory:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>session_id</strong> — Unique per user (e.g. <code className="bg-muted px-1 rounded text-foreground">whatsapp-977XXXXXXXXXX</code>). Required for context.</li>
              <li><strong>platform</strong> — Source identifier: <code className="bg-muted px-1 rounded text-foreground">"whatsapp"</code>, <code className="bg-muted px-1 rounded text-foreground">"telegram"</code>, <code className="bg-muted px-1 rounded text-foreground">"web"</code> (default).</li>
            </ul>
            <p>All messages stored for <strong>15 days</strong>, then auto-cleaned.</p>
          </CardContent>
        </Card>

        {/* Primary: Just Send a Message */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <Badge className="bg-primary text-primary-foreground">Primary Usage</Badge>
              — Just Send a Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">Send the user's message. The AI automatically detects intent and handles everything. <strong>No action field needed.</strong></p>
            
            <div>
              <p className="font-medium text-foreground mb-1">Example 1: Product Search (auto-detected)</p>
              <CodeBlock>{`curl -X POST "${BASE_URL}" \\
  -H "apikey: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "diamon pakage price",
    "session_id": "whatsapp-9779708562001",
    "platform": "whatsapp"
  }'

# Response:
{
  "success": true,
  "reply": "💎 Here are our Free Fire Diamond packages:\\n• 110 Diamonds — NPR 120\\n• 310 Diamonds — NPR 310\\n...",
  "action": "product_search",
  "data": { "found": true, "products": [...], "count": 6 },
  "products": [
    { "name": "110 Diamonds", "price": 120, "package_id": "ff-110", ... }
  ],
  "timestamp": "..."
}`}</CodeBlock>
            </div>

            <div>
              <p className="font-medium text-foreground mb-1">Example 2: Order Placement (auto-detected)</p>
              <CodeBlock>{`curl -X POST "${BASE_URL}" \\
  -H "apikey: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "I want to buy 110 diamonds, my email is ram@example.com, player id 123456",
    "session_id": "whatsapp-9779708562001",
    "platform": "whatsapp"
  }'

# Response:
{
  "success": true,
  "reply": "✅ Order placed! Order number: ram-a1b. 120 credits deducted. Your new balance is NPR 380.",
  "action": "order",
  "data": {
    "success": true,
    "order_number": "ram-a1b",
    "product": "110 Diamonds",
    "price": 120,
    "new_balance": 380
  },
  "timestamp": "..."
}`}</CodeBlock>
            </div>

            <div>
              <p className="font-medium text-foreground mb-1">Example 3: Order Status (auto-detected)</p>
              <CodeBlock>{`curl -X POST "${BASE_URL}" \\
  -H "apikey: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "check my order ram-a1b",
    "session_id": "whatsapp-9779708562001",
    "platform": "whatsapp"
  }'

# Response:
{
  "success": true,
  "reply": "📦 Order ram-a1b: Free Fire 110 Diamonds — Status: confirmed ✅",
  "action": "order_status",
  "data": {
    "found": true,
    "orders": [{ "order_number": "ram-a1b", "status": "confirmed", ... }]
  },
  "timestamp": "..."
}`}</CodeBlock>
            </div>

            <div>
              <p className="font-medium text-foreground mb-1">Example 4: General Chat</p>
              <CodeBlock>{`curl -X POST "${BASE_URL}" \\
  -H "apikey: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "hello, what can you do?",
    "session_id": "whatsapp-9779708562001",
    "platform": "whatsapp"
  }'

# Response:
{
  "success": true,
  "reply": "👋 Hi! I can help you with:\\n• Browse products and prices\\n• Place orders\\n• Generate payment links\\n• Check order status\\n• Request credit top-ups\\n\\nJust tell me what you need!",
  "action": "message",
  "data": {},
  "timestamp": "..."
}`}</CodeBlock>
            </div>
          </CardContent>
        </Card>

        {/* Explicit Actions (Backward Compat) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Explicit Actions (Backward Compatible)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              You can still use explicit <code className="bg-muted px-1 rounded text-foreground">action</code> fields for structured/programmatic calls. These bypass AI intent detection and execute directly.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4 font-medium text-foreground">Action</th>
                    <th className="py-2 pr-4 font-medium text-foreground">Required Fields</th>
                    <th className="py-2 font-medium text-foreground">Purpose</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><Badge variant="outline">order</Badge></td>
                    <td className="py-2 pr-4">email, package_id</td>
                    <td className="py-2">Place order directly</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><Badge variant="outline">order-status</Badge></td>
                    <td className="py-2 pr-4">order_id</td>
                    <td className="py-2">Check order status</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><Badge variant="outline">initiate-payment</Badge></td>
                    <td className="py-2 pr-4">email, amount</td>
                    <td className="py-2">Generate payment link</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><Badge variant="outline">payment-status</Badge></td>
                    <td className="py-2 pr-4">identifier</td>
                    <td className="py-2">Check payment status</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><Badge variant="outline">credit-request</Badge></td>
                    <td className="py-2 pr-4">name, email, amount</td>
                    <td className="py-2">Submit credit request</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><Badge variant="outline">submit-feedback</Badge></td>
                    <td className="py-2 pr-4">message_id, session_id, rating</td>
                    <td className="py-2">Rate bot response</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4"><Badge variant="outline">test-connection</Badge></td>
                    <td className="py-2 pr-4">none</td>
                    <td className="py-2">Verify AI provider</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Explicit Order Example</p>
              <CodeBlock>{`{
  "action": "order",
  "email": "user@example.com",
  "package_id": "ff-110",
  "player_id": "123456789"
}

# Response:
{
  "success": true,
  "reply": "Order placed successfully! Order number: user-a1b. 120 credits deducted.",
  "action": "order",
  "data": {
    "success": true,
    "order_number": "user-a1b",
    "price": 120,
    "new_balance": 380
  },
  "timestamp": "..."
}`}</CodeBlock>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp / n8n Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" /> WhatsApp / n8n Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Simplest possible integration — one HTTP node in n8n:</p>
            <ol className="list-decimal list-inside space-y-3">
              <li><strong>WhatsApp webhook receives message</strong> → triggers n8n workflow</li>
              <li><strong>HTTP Request node</strong> → POST to this API with the message</li>
              <li><strong>Read response.reply</strong> → send back via WhatsApp</li>
            </ol>
            <p>That's it. <strong>One HTTP call handles everything.</strong> The AI decides whether to search products, place orders, generate payment links, or just chat.</p>
            <CodeBlock>{`# n8n HTTP Request node config:
# Method: POST
# URL: ${BASE_URL}
# Headers: apikey: YOUR_KEY, Content-Type: application/json
# Body:
{
  "message": "{{ $json.message.text }}",
  "session_id": "whatsapp-{{ $json.message.from }}",
  "platform": "whatsapp"
}

# Response contains:
# reply → text to send back to WhatsApp
# action → what the AI did (message, product_search, order, etc.)
# data → structured result data`}</CodeBlock>

            <div className="bg-muted/50 rounded-lg p-3 mt-3">
              <p className="font-medium text-foreground mb-1">Complete Conversation Example</p>
              <CodeBlock>{`# User: "show me roblox packages"
→ AI searches products, returns package list with prices

# User: "I want 1000 robux, email ram@mail.com"  
→ AI places order automatically, deducts credits

# User: "check order ram-a1b"
→ AI looks up order status

# User: "I need to add 500 credits, my name is Ram"
→ AI submits credit request

# All from the SAME endpoint, SAME request format.`}</CodeBlock>
            </div>
          </CardContent>
        </Card>

        {/* Full curl examples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5" /> Quick Test cURL</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <CodeBlock>{`# Test the AI brain - just send a message:
curl -X POST "${BASE_URL}" \\
  -H "apikey: ${ANON_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "What products do you have?",
    "session_id": "test-001",
    "platform": "whatsapp"
  }'

# Test product search:
curl -X POST "${BASE_URL}" \\
  -H "apikey: ${ANON_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "free fire diamond price",
    "session_id": "test-001",
    "platform": "whatsapp"
  }'

# Test connection:
curl -X POST "${BASE_URL}" \\
  -H "apikey: ${ANON_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{"action": "test-connection"}'`}</CodeBlock>
          </CardContent>
        </Card>

        {/* Error Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Error Codes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4 font-medium text-foreground">Status</th>
                    <th className="py-2 pr-4 font-medium text-foreground">Error</th>
                    <th className="py-2 font-medium text-foreground">Description</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><Badge variant="outline">400</Badge></td>
                    <td className="py-2 pr-4">Bad Request</td>
                    <td className="py-2">Missing or invalid message field</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><Badge variant="outline">402</Badge></td>
                    <td className="py-2 pr-4">insufficient_credits</td>
                    <td className="py-2">User doesn't have enough credits for order</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><Badge variant="outline">404</Badge></td>
                    <td className="py-2 pr-4">Not Found</td>
                    <td className="py-2">User account or package not found</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><Badge variant="outline">429</Badge></td>
                    <td className="py-2 pr-4">Rate Limited</td>
                    <td className="py-2">Too many requests (15/min per session)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4"><Badge variant="outline">500</Badge></td>
                    <td className="py-2 pr-4">Server Error</td>
                    <td className="py-2">Internal error or AI service unavailable</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>API key validation on every request</li>
              <li>Rate limiting: 15 requests/minute per session</li>
              <li>Input validation: messages capped at 2000 characters</li>
              <li>Prompt injection protection via system prompt design</li>
              <li>Database RLS policies on all tables</li>
              <li>Atomic credit deduction prevents double-spending</li>
              <li>Chat history auto-purged after 15 days</li>
            </ul>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ApiDocs;
