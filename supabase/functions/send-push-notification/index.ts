import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Base64URL encode/decode helpers
function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Create VAPID JWT
async function createVapidJwt(
  audience: string,
  subject: string,
  privateKeyBase64: string
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 86400, sub: subject };

  const headerB64 = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(header))
  );
  const payloadB64 = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import the private key
  const privateKeyBytes = base64UrlDecode(privateKeyBase64);
  const jwk = {
    kty: "EC",
    crv: "P-256",
    d: base64UrlEncode(privateKeyBytes),
    // We need x and y but they'll be derived; for signing we only need d
    // Actually we need the full JWK. Let's import as PKCS8 or raw.
  };

  // Import raw private key (32 bytes) as JWK
  // For ECDSA P-256, we need to import the key properly
  const key = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      d: base64UrlEncode(privateKeyBytes),
      x: "", // Will be filled by generateKey approach
      y: "",
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  ).catch(async () => {
    // Fallback: try importing as PKCS8
    // Build PKCS8 from raw 32-byte private key
    const pkcs8Header = new Uint8Array([
      0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86,
      0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce,
      0x3d, 0x03, 0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01,
      0x04, 0x20,
    ]);
    const pkcs8 = new Uint8Array(
      pkcs8Header.length + privateKeyBytes.length
    );
    pkcs8.set(pkcs8Header);
    pkcs8.set(privateKeyBytes, pkcs8Header.length);

    return crypto.subtle.importKey(
      "pkcs8",
      pkcs8,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign"]
    );
  });

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER signature to raw r||s format (64 bytes)
  const sigBytes = new Uint8Array(signature);
  let rawSig: Uint8Array;
  if (sigBytes.length === 64) {
    rawSig = sigBytes;
  } else {
    // DER encoded, parse it
    rawSig = derToRaw(sigBytes);
  }

  const signatureB64 = base64UrlEncode(rawSig);
  return `${unsignedToken}.${signatureB64}`;
}

function derToRaw(der: Uint8Array): Uint8Array {
  const raw = new Uint8Array(64);
  // DER: 0x30 len 0x02 rLen r 0x02 sLen s
  let offset = 2; // skip 0x30 and length
  if (der[0] !== 0x30) return der.slice(0, 64); // not DER

  // R
  offset++; // 0x02
  const rLen = der[offset++];
  const rStart = rLen > 32 ? offset + (rLen - 32) : offset;
  const rDest = rLen < 32 ? 32 - rLen : 0;
  raw.set(der.slice(rStart, offset + rLen), rDest);
  offset += rLen;

  // S
  offset++; // 0x02
  const sLen = der[offset++];
  const sStart = sLen > 32 ? offset + (sLen - 32) : offset;
  const sDest = sLen < 32 ? 32 + (32 - sLen) : 32;
  raw.set(der.slice(sStart, offset + sLen), sDest);

  return raw;
}

// Web Push content encryption (RFC 8291)
async function encryptPayload(
  payload: string,
  subscriptionPublicKey: string,
  authSecret: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const payloadBytes = new TextEncoder().encode(payload);

  // Generate ephemeral ECDH key pair
  const serverKeys = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  // Export server public key (65 bytes uncompressed)
  const serverPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", serverKeys.publicKey)
  );

  // Import subscriber's public key
  const clientPublicKey = await crypto.subtle.importKey(
    "raw",
    base64UrlDecode(subscriptionPublicKey),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: clientPublicKey },
      serverKeys.privateKey,
      256
    )
  );

  const authBytes = base64UrlDecode(authSecret);
  const clientPublicKeyBytes = base64UrlDecode(subscriptionPublicKey);

  // Generate 16-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF to derive PRK from shared secret and auth
  const authInfo = concatBuffers(
    new TextEncoder().encode("WebPush: info\0"),
    clientPublicKeyBytes,
    serverPublicKeyRaw
  );
  const prk = await hkdfExtract(authBytes, sharedSecret);
  const ikm = await hkdfExpand(prk, authInfo, 32);

  // Derive content encryption key and nonce
  const prkFinal = await hkdfExtract(salt, ikm);
  const cekInfo = new TextEncoder().encode("Content-Encoding: aes128gcm\0");
  const nonceInfo = new TextEncoder().encode("Content-Encoding: nonce\0");
  const cek = await hkdfExpand(prkFinal, cekInfo, 16);
  const nonce = await hkdfExpand(prkFinal, nonceInfo, 12);

  // Add padding (1 byte delimiter + 0 padding)
  const paddedPayload = new Uint8Array(payloadBytes.length + 1);
  paddedPayload.set(payloadBytes);
  paddedPayload[payloadBytes.length] = 2; // delimiter

  // Encrypt with AES-128-GCM
  const key = await crypto.subtle.importKey(
    "raw",
    cek,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce, tagLength: 128 },
      key,
      paddedPayload
    )
  );

  // Build aes128gcm content coding header
  // salt (16) + rs (4) + idlen (1) + keyid (65) + encrypted
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);
  const header = concatBuffers(
    salt,
    rs,
    new Uint8Array([65]),
    serverPublicKeyRaw
  );
  const ciphertext = concatBuffers(header, encrypted);

  return { ciphertext, salt, serverPublicKey: serverPublicKeyRaw };
}

async function hkdfExtract(
  salt: Uint8Array,
  ikm: Uint8Array
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    salt.length ? salt : new Uint8Array(32),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, ikm));
}

async function hkdfExpand(
  prk: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    prk,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const infoWithCounter = concatBuffers(info, new Uint8Array([1]));
  const output = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, infoWithCounter)
  );
  return output.slice(0, length);
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    result.set(buf, offset);
    offset += buf.length;
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, notification_id, direct_payload } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("VAPID keys not configured");
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get notification details - either from direct_payload or notification_id
    let title = "UGTOPUPS";
    let body = "You have a new notification";
    let icon = "/icon-192x192.png";
    let url = "/";

    if (direct_payload) {
      // Direct payload from admin triggers - no DB lookup needed
      title = direct_payload.title || title;
      body = direct_payload.body || body;
      icon = direct_payload.icon || icon;
      url = direct_payload.url || url;
    } else if (notification_id) {
      const { data: notification } = await supabase
        .from("notifications")
        .select("title, message, image_url")
        .eq("id", notification_id)
        .single();

      if (notification) {
        title = notification.title;
        body = notification.message;
        if (notification.image_url) icon = notification.image_url;
      }
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No push subscriptions found for user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({
      title,
      body,
      icon,
      url,
      notificationId: notification_id,
    });

    const results = [];

    for (const sub of subscriptions) {
      try {
        // Get the push service audience (origin of the endpoint)
        const endpointUrl = new URL(sub.endpoint);
        const audience = endpointUrl.origin;

        // Create VAPID authorization
        const jwt = await createVapidJwt(
          audience,
          "mailto:admin@ugtopups.com",
          vapidPrivateKey
        );

        // Encrypt the payload
        const { ciphertext } = await encryptPayload(
          payload,
          sub.p256dh,
          sub.auth
        );

        // Send the push message
        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            Authorization: `vapid t=${jwt},k=${vapidPublicKey}`,
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            TTL: "86400",
            Urgency: "high",
          },
          body: ciphertext,
        });

        if (response.status === 201 || response.status === 200) {
          results.push({ endpoint: sub.endpoint, success: true });
        } else if (response.status === 404 || response.status === 410) {
          // Subscription expired, remove it
          console.log("Removing expired subscription:", sub.endpoint);
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
          results.push({
            endpoint: sub.endpoint,
            success: false,
            reason: "expired",
          });
        } else {
          const responseText = await response.text();
          console.error(
            `Push failed for ${sub.endpoint}: ${response.status} ${responseText}`
          );
          results.push({
            endpoint: sub.endpoint,
            success: false,
            reason: `HTTP ${response.status}`,
          });
        }
      } catch (error) {
        console.error(`Push error for ${sub.endpoint}:`, error);
        results.push({
          endpoint: sub.endpoint,
          success: false,
          reason: error.message,
        });
      }
    }

    console.log("Push notification results:", results);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Send push notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
