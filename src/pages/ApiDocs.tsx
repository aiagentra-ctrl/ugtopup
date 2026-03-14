import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Code, Key, Zap, MessageSquare, ShoppingCart, CreditCard, Search, AlertTriangle, Smartphone, DollarSign, CheckCircle } from "lucide-react";

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
            Send a message, get a structured reply. Place orders and process payments programmatically.
          </p>
        </div>

        {/* Architecture */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> Architecture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>All platforms use the same endpoint. The API handles AI responses, product search, order placement, payments, and credit requests.</p>
            <CodeBlock>{`External Platform (WhatsApp, Telegram, etc.)
        │
        ▼  POST /chatbot-api
┌──────────────────────────┐
│   Chatbot API (Edge Fn)  │
│  ┌────────┐ ┌──────────┐ │
│  │ AI/LLM │ │ Products │ │
│  └────────┘ └──────────┘ │
│  ┌────────┐ ┌──────────┐ │
│  │ Orders │ │ Payments │ │
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
            <p>Conversations are stored for <strong>15 days</strong> and then automatically cleaned up.</p>
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
  "timestamp": "2026-03-08T12:00:00.000Z"
}`}</CodeBlock>
            </div>
          </CardContent>
        </Card>

        {/* Endpoint: order */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <Badge>action: "order"</Badge>
              — Place an Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">Place an order using the user's credit balance. The system atomically checks balance, deducts credits, and creates the order.</p>
            <div>
              <p className="font-medium text-foreground mb-1">Request</p>
              <CodeBlock>{`{
  "action": "order",
  "email": "user@example.com",
  "package_id": "ff-110",
  "player_id": "123456789",
  "zone_id": "",
  "product_name": "Free Fire Diamond"
}`}</CodeBlock>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Success Response</p>
              <CodeBlock>{`{
  "success": true,
  "message": "Order placed successfully! Order number: user-a1b. 120 credits deducted.",
  "order_number": "user-a1b",
  "order_id": "uuid-...",
  "product": "110 Diamonds",
  "price": 120,
  "new_balance": 380,
  "timestamp": "2026-03-08T12:00:00.000Z"
}`}</CodeBlock>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Insufficient Credits Response (402)</p>
              <CodeBlock>{`{
  "error": "insufficient_credits",
  "message": "Insufficient credits. You have NPR 50 but need NPR 120.",
  "balance": 50,
  "required": 120,
  "top_up_url": "https://ugtopups.lovable.app/#/dashboard"
}`}</CodeBlock>
            </div>
          </CardContent>
        </Card>

        {/* Endpoint: initiate-payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <Badge>action: "initiate-payment"</Badge>
              — Generate Payment Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">Generate a payment link for credit top-up. Share the returned URL with the user to complete payment.</p>
            <div>
              <p className="font-medium text-foreground mb-1">Request</p>
              <CodeBlock>{`{
  "action": "initiate-payment",
  "email": "user@example.com",
  "amount": 500
}`}</CodeBlock>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Response</p>
              <CodeBlock>{`{
  "success": true,
  "payment_method": "online",
  "payment_url": "https://apinepal.com/checkout/...",
  "identifier": "UGa1b2cklm3n4o5",
  "message": "Payment link generated. Complete payment of NPR 500 using this link.",
  "timestamp": "2026-03-08T12:00:00.000Z"
}`}</CodeBlock>
            </div>
          </CardContent>
        </Card>

        {/* Endpoint: payment-status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <Badge>action: "payment-status"</Badge>
              — Check Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">Check the status of a payment transaction using the identifier returned from <code className="bg-muted px-1 rounded text-foreground">initiate-payment</code>.</p>
            <div>
              <p className="font-medium text-foreground mb-1">Request</p>
              <CodeBlock>{`{
  "action": "payment-status",
  "identifier": "UGa1b2cklm3n4o5"
}`}</CodeBlock>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Response</p>
              <CodeBlock>{`{
  "identifier": "UGa1b2cklm3n4o5",
  "amount": 500,
  "credits": 500,
  "status": "completed",
  "payment_gateway": "khalti",
  "created_at": "2026-03-08T12:00:00Z",
  "completed_at": "2026-03-08T12:05:00Z",
  "timestamp": "2026-03-08T12:10:00.000Z"
}`}</CodeBlock>
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
            <p className="text-muted-foreground">Submit a credit/wallet top-up request on behalf of a user (manual payment flow).</p>
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

        {/* WhatsApp Integration Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" /> WhatsApp Integration Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Step-by-step: Connect your WhatsApp bot to this API</p>
            <ol className="list-decimal list-inside space-y-3">
              <li>
                <strong>Set up a WhatsApp Business API</strong> — Use a provider like Twilio, WhatsApp Cloud API (Meta), or WATI. Configure your webhook URL to point to your bot server.
              </li>
              <li>
                <strong>Create a webhook handler</strong> — When a user sends a WhatsApp message, your server receives it. Extract the message text and the user's phone number.
              </li>
              <li>
                <strong>Forward to our API</strong> — Send a POST request to this chatbot API with the user's message. Use the phone number as <code className="bg-muted px-1 rounded text-foreground">session_id</code> and set <code className="bg-muted px-1 rounded text-foreground">platform: "whatsapp"</code>.
              </li>
              <li>
                <strong>Parse the response</strong> — The API returns <code className="bg-muted px-1 rounded text-foreground">reply</code> (text) and optionally <code className="bg-muted px-1 rounded text-foreground">products</code> (array). Format as needed for WhatsApp (e.g., list messages, buttons).
              </li>
              <li>
                <strong>Send reply back</strong> — Use your WhatsApp API provider to send the formatted response back to the user.
              </li>
            </ol>
            <div className="bg-muted/50 rounded-lg p-3 mt-3">
              <p className="font-medium text-foreground mb-1">Example WhatsApp Bot Flow</p>
              <CodeBlock>{`# 1. User sends "I want Free Fire diamonds" on WhatsApp
# 2. Your webhook receives the message
# 3. Your server calls our API:

curl -X POST "${BASE_URL}" \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "message",
    "session_id": "wa-9779708562001",
    "platform": "whatsapp",
    "message": "I want Free Fire diamonds"
  }'

# 4. API returns product list + AI reply
# 5. Your server formats and sends back via WhatsApp API`}</CodeBlock>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="font-medium text-foreground mb-1">Complete Purchase Flow via WhatsApp</p>
              <CodeBlock>{`# Step 1: User browses products
POST → action: "message", message: "show me free fire diamonds"
# → Returns product list with package_ids

# Step 2: User places order
POST → action: "order", email: "user@mail.com", package_id: "ff-110", player_id: "123456"
# → Returns order confirmation OR insufficient_credits error

# Step 3: If insufficient credits, generate payment link
POST → action: "initiate-payment", email: "user@mail.com", amount: 500
# → Returns payment_url to share with user

# Step 4: Check payment status
POST → action: "payment-status", identifier: "UGa1b2..."
# → Returns current status (pending/completed/failed)

# Step 5: After payment, retry order
POST → action: "order", email: "user@mail.com", package_id: "ff-110", player_id: "123456"
# → Order placed successfully!`}</CodeBlock>
            </div>
          </CardContent>
        </Card>

        {/* Full curl example */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5" /> Full curl Examples</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
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

# Place an order
curl -X POST "${BASE_URL}" \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "order",
    "email": "user@example.com",
    "package_id": "ff-110",
    "player_id": "123456789"
  }'

# Generate payment link
curl -X POST "${BASE_URL}" \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "initiate-payment",
    "email": "user@example.com",
    "amount": 500
  }'

# Check payment status
curl -X POST "${BASE_URL}" \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "payment-status",
    "identifier": "UGa1b2cklm3n4o5"
  }'`}</CodeBlock>
          </CardContent>
        </Card>

        {/* Error Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Error Codes Reference</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4 font-medium text-foreground">HTTP Status</th>
                    <th className="py-2 pr-4 font-medium text-foreground">Error Code</th>
                    <th className="py-2 font-medium text-foreground">Description</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><Badge variant="outline">400</Badge></td>
                    <td className="py-2 pr-4">Bad Request</td>
                    <td className="py-2">Missing required fields (message, email, package_id, etc.)</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><Badge variant="outline">402</Badge></td>
                    <td className="py-2 pr-4">insufficient_credits</td>
                    <td className="py-2">User doesn't have enough credits to place the order</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><Badge variant="outline">404</Badge></td>
                    <td className="py-2 pr-4">Not Found</td>
                    <td className="py-2">User email not registered, package not found, or transaction not found</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><Badge variant="outline">429</Badge></td>
                    <td className="py-2 pr-4">Rate Limited</td>
                    <td className="py-2">AI provider rate limit reached — retry after a few seconds</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4"><Badge variant="outline">500</Badge></td>
                    <td className="py-2 pr-4">Server Error</td>
                    <td className="py-2">Internal error — contact support if persistent</td>
                  </tr>
                </tbody>
              </table>
            </div>
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
              <li>Conversation logs are stored for <strong>15 days</strong> and then automatically purged.</li>
              <li>The API uses the Supabase anon key for authentication — no user credentials are required.</li>
              <li>Order placement requires a registered user email with sufficient credit balance.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Available Actions Summary */}
        <Card>
          <CardHeader>
            <CardTitle>All Actions Summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4 font-medium text-foreground">Action</th>
                    <th className="py-2 pr-4 font-medium text-foreground">Purpose</th>
                    <th className="py-2 font-medium text-foreground">Required Fields</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><code className="bg-muted px-1 rounded text-foreground">message</code></td>
                    <td className="py-2 pr-4">Chat / product search</td>
                    <td className="py-2">message</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><code className="bg-muted px-1 rounded text-foreground">order</code></td>
                    <td className="py-2 pr-4">Place an order</td>
                    <td className="py-2">email, package_id</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><code className="bg-muted px-1 rounded text-foreground">order-status</code></td>
                    <td className="py-2 pr-4">Track orders</td>
                    <td className="py-2">order_id</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><code className="bg-muted px-1 rounded text-foreground">initiate-payment</code></td>
                    <td className="py-2 pr-4">Generate payment link</td>
                    <td className="py-2">email, amount</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><code className="bg-muted px-1 rounded text-foreground">payment-status</code></td>
                    <td className="py-2 pr-4">Check payment status</td>
                    <td className="py-2">identifier</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4"><code className="bg-muted px-1 rounded text-foreground">credit-request</code></td>
                    <td className="py-2 pr-4">Manual credit top-up</td>
                    <td className="py-2">name, email, amount</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ApiDocs;
