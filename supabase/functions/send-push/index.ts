// Supabase Edge Function: send-push
// Sends Web Push Notifications to a specific user's subscriptions
//
// Usage:
//   POST /functions/v1/send-push
//   Headers: { "Authorization": "Bearer <anon_key_or_service_role_key>" }
//   Body: { "userId": "<uuid>", "title": "...", "body": "...", "url": "/assignments" }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================
// Web Push Crypto Helpers
// ============================

function base64UrlToUint8Array(base64Url: string): Uint8Array {
    const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
    const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function uint8ArrayToBase64Url(uint8Array: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < uint8Array.byteLength; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64UrlToBase64(base64Url: string): string {
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padding = (4 - (base64.length % 4)) % 4;
    base64 += "=".repeat(padding);
    return base64;
}

// Create JWT for VAPID authentication
async function createVapidJwt(
    audience: string,
    subject: string,
    privateKeyBase64Url: string,
    expiration: number
): Promise<string> {
    const header = { typ: "JWT", alg: "ES256" };
    const payload = {
        aud: audience,
        exp: expiration,
        sub: subject,
    };

    const headerB64 = uint8ArrayToBase64Url(
        new TextEncoder().encode(JSON.stringify(header))
    );
    const payloadB64 = uint8ArrayToBase64Url(
        new TextEncoder().encode(JSON.stringify(payload))
    );

    const unsignedToken = `${headerB64}.${payloadB64}`;

    // Import the private key
    const privateKeyBytes = base64UrlToUint8Array(privateKeyBase64Url);
    const key = await crypto.subtle.importKey(
        "pkcs8",
        convertRawKeyToPkcs8(privateKeyBytes),
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign(
        { name: "ECDSA", hash: "SHA-256" },
        key,
        new TextEncoder().encode(unsignedToken)
    );

    // Convert DER signature to raw (r || s) format
    const rawSignature = derToRaw(new Uint8Array(signature));
    const signatureB64 = uint8ArrayToBase64Url(rawSignature);

    return `${unsignedToken}.${signatureB64}`;
}

function convertRawKeyToPkcs8(rawKey: Uint8Array): ArrayBuffer {
    // PKCS8 wrapper for EC P-256 private key
    const pkcs8Header = new Uint8Array([
        0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48,
        0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
        0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20,
    ]);
    const pkcs8 = new Uint8Array(pkcs8Header.length + rawKey.length);
    pkcs8.set(pkcs8Header);
    pkcs8.set(rawKey, pkcs8Header.length);
    return pkcs8.buffer;
}

function derToRaw(der: Uint8Array): Uint8Array {
    // If already raw (64 bytes), return as-is
    if (der.length === 64) return der;

    const raw = new Uint8Array(64);
    // Parse DER sequence
    let offset = 2; // skip SEQUENCE tag and length

    // Parse r
    if (der[offset] !== 0x02) throw new Error("Invalid DER signature");
    offset++;
    const rLen = der[offset++];
    const rStart = offset + (rLen > 32 ? rLen - 32 : 0);
    const rDest = rLen < 32 ? 32 - rLen : 0;
    raw.set(der.slice(rStart, offset + rLen), rDest);
    offset += rLen;

    // Parse s
    if (der[offset] !== 0x02) throw new Error("Invalid DER signature");
    offset++;
    const sLen = der[offset++];
    const sStart = offset + (sLen > 32 ? sLen - 32 : 0);
    const sDest = 32 + (sLen < 32 ? 32 - sLen : 0);
    raw.set(der.slice(sStart, offset + sLen), sDest);

    return raw;
}

// Encrypt payload using ECDH + HKDF + AES-GCM (RFC 8291)
async function encryptPayload(
    subscription: { endpoint: string; keys_p256dh: string; keys_auth: string },
    payload: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
    const payloadBytes = new TextEncoder().encode(payload);

    // Generate local ECDH key pair
    const localKeyPair = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveBits"]
    );

    // Export local public key
    const localPublicKeyRaw = new Uint8Array(
        await crypto.subtle.exportKey("raw", localKeyPair.publicKey)
    );

    // Import subscriber's public key
    const subscriberPublicKeyBytes = base64UrlToUint8Array(subscription.keys_p256dh);
    const subscriberPublicKey = await crypto.subtle.importKey(
        "raw",
        subscriberPublicKeyBytes,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        []
    );

    // Derive shared secret via ECDH
    const sharedSecret = new Uint8Array(
        await crypto.subtle.deriveBits(
            { name: "ECDH", public: subscriberPublicKey },
            localKeyPair.privateKey,
            256
        )
    );

    // Auth secret
    const authSecret = base64UrlToUint8Array(subscription.keys_auth);

    // Generate 16-byte salt
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // HKDF extract with auth as salt and shared secret as IKM
    const authInfo = new TextEncoder().encode("Content-Encoding: auth\0");
    const prkKey = await crypto.subtle.importKey(
        "raw",
        authSecret,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const prk = new Uint8Array(
        await crypto.subtle.sign("HMAC", prkKey, sharedSecret)
    );

    // Build key info and nonce info
    const keyInfo = buildInfo("aesgcm", subscriberPublicKeyBytes, localPublicKeyRaw);
    const nonceInfo = buildInfo("nonce", subscriberPublicKeyBytes, localPublicKeyRaw);

    // Derive content encryption key (CEK) - 16 bytes
    const cek = await hkdfExpand(prk, keyInfo, 16);

    // Derive nonce - 12 bytes
    const nonce = await hkdfExpand(prk, nonceInfo, 12);

    // Add padding (2 bytes for padding length + 0 bytes padding)
    const paddedPayload = new Uint8Array(2 + payloadBytes.length);
    paddedPayload.set([0, 0]); // padding length = 0
    paddedPayload.set(payloadBytes, 2);

    // Derive encryption key with salt
    const saltKey = await crypto.subtle.importKey(
        "raw",
        salt,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const saltPrk = new Uint8Array(
        await crypto.subtle.sign("HMAC", saltKey, prk)
    );

    const finalCek = await hkdfExpand(saltPrk, keyInfo, 16);
    const finalNonce = await hkdfExpand(saltPrk, nonceInfo, 12);

    // Encrypt with AES-128-GCM
    const aesKey = await crypto.subtle.importKey(
        "raw",
        finalCek,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
    );

    const encrypted = new Uint8Array(
        await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: finalNonce },
            aesKey,
            paddedPayload
        )
    );

    return { ciphertext: encrypted, salt, localPublicKey: localPublicKeyRaw };
}

function buildInfo(
    type: string,
    subscriberPublicKey: Uint8Array,
    localPublicKey: Uint8Array
): Uint8Array {
    const enc = new TextEncoder();
    const label = enc.encode(`Content-Encoding: ${type}\0P-256\0`);
    const info = new Uint8Array(label.length + 2 + subscriberPublicKey.length + 2 + localPublicKey.length);
    let offset = 0;
    info.set(label, offset); offset += label.length;
    info[offset++] = 0; info[offset++] = subscriberPublicKey.length;
    info.set(subscriberPublicKey, offset); offset += subscriberPublicKey.length;
    info[offset++] = 0; info[offset++] = localPublicKey.length;
    info.set(localPublicKey, offset);
    return info;
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
    const input = new Uint8Array(info.length + 1);
    input.set(info);
    input[info.length] = 1;
    const output = new Uint8Array(await crypto.subtle.sign("HMAC", key, input));
    return output.slice(0, length);
}

// Send a single push notification
async function sendWebPush(
    subscription: { endpoint: string; keys_p256dh: string; keys_auth: string },
    payload: string,
    vapidPublicKey: string,
    vapidPrivateKey: string,
    vapidSubject: string
): Promise<Response> {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12 hours

    const jwt = await createVapidJwt(audience, vapidSubject, vapidPrivateKey, expiration);

    const { ciphertext, salt, localPublicKey } = await encryptPayload(subscription, payload);

    const response = await fetch(subscription.endpoint, {
        method: "POST",
        headers: {
            "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
            "Content-Encoding": "aesgcm",
            "Encryption": `salt=${uint8ArrayToBase64Url(salt)}`,
            "Crypto-Key": `dh=${uint8ArrayToBase64Url(localPublicKey)};p256ecdsa=${vapidPublicKey}`,
            "Content-Type": "application/octet-stream",
            "TTL": "86400",
            "Urgency": "normal",
        },
        body: ciphertext,
    });

    return response;
}

// ============================
// Main Handler
// ============================

serve(async (req: Request) => {
    // CORS headers
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-push-secret",
    };

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    try {
        const {
            userId,
            title,
            body,
            url,
            icon,
            iconName,
            notificationId,
            dedupeKey,
        } = await req.json();

        if (!userId || !title || !body) {
            return new Response(
                JSON.stringify({ error: "userId, title, dan body wajib diisi" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!supabaseUrl || !supabaseServiceKey) {
            return new Response(
                JSON.stringify({ error: "Supabase function environment is not configured" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const internalSecret = Deno.env.get("PUSH_INTERNAL_SECRET");
        const isInternalRequest = Boolean(
            internalSecret && req.headers.get("x-push-secret") === internalSecret
        );

        if (!isInternalRequest) {
            const authorization = req.headers.get("Authorization");

            if (!authorization || !supabaseAnonKey) {
                return new Response(
                    JSON.stringify({ error: "Unauthorized" }),
                    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const authClient = createClient(supabaseUrl, supabaseAnonKey, {
                global: {
                    headers: { Authorization: authorization },
                },
            });

            const { data: { user }, error: authError } = await authClient.auth.getUser();

            if (authError || !user) {
                return new Response(
                    JSON.stringify({ error: "Unauthorized" }),
                    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            if (user.id !== userId) {
                return new Response(
                    JSON.stringify({ error: "Forbidden" }),
                    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
        }

        // Get VAPID keys from environment
        const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
        const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
        const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@jadwal.app";

        if (!vapidPublicKey || !vapidPrivateKey) {
            return new Response(
                JSON.stringify({ error: "VAPID keys not configured" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Create Supabase client with service role
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get all subscriptions for the user
        const { data: subscriptions, error: fetchError } = await supabase
            .from("push_subscriptions")
            .select("*")
            .eq("user_id", userId);

        if (fetchError) {
            throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`);
        }

        if (!subscriptions || subscriptions.length === 0) {
            if (notificationId) {
                await supabase.from("notification_delivery_logs").insert({
                    notification_id: notificationId,
                    user_id: userId,
                    status: "no_subscription",
                    error: "User has no active push subscriptions",
                });
            }

            return new Response(
                JSON.stringify({ message: "No subscriptions found for user", sent: 0, total: 0 }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Build push payload
        const payload = JSON.stringify({
            id: notificationId,
            notificationId,
            dedupeKey,
            title,
            body,
            icon: icon || "/ITERA.png",
            iconName: iconName || "notifications",
            url: url || "/",
            timestamp: Date.now(),
        });

        // Send push to all subscriptions
        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                try {
                    const response = await sendWebPush(
                        sub,
                        payload,
                        vapidPublicKey,
                        vapidPrivateKey,
                        vapidSubject
                    );

                    // If subscription is expired or invalid, delete it
                    if (response.status === 404 || response.status === 410) {
                        await supabase
                            .from("push_subscriptions")
                            .delete()
                            .eq("endpoint", sub.endpoint);
                        return { endpoint: sub.endpoint, status: "expired_removed" };
                    }

                    if (!response.ok) {
                        const errorText = await response.text();
                        return { endpoint: sub.endpoint, status: "failed", error: errorText };
                    }

                    return { endpoint: sub.endpoint, status: "sent" };
                } catch (err) {
                    return { endpoint: sub.endpoint, status: "error", error: (err as Error).message };
                }
            })
        );

        const sent = results.filter(
            (r) => r.status === "fulfilled" && r.value.status === "sent"
        ).length;

        const deliveryLogs = results.map((result) => {
            const value = result.status === "fulfilled"
                ? result.value
                : { endpoint: null, status: "error", error: String(result.reason) };

            return {
                notification_id: notificationId || null,
                user_id: userId,
                endpoint: value.endpoint,
                status: value.status,
                error: value.error || null,
            };
        });

        if (deliveryLogs.length > 0) {
            await supabase.from("notification_delivery_logs").insert(deliveryLogs);
        }

        if (notificationId && sent > 0) {
            await supabase
                .from("notifications")
                .update({ sent_at: new Date().toISOString() })
                .eq("id", notificationId)
                .eq("user_id", userId);
        }

        return new Response(
            JSON.stringify({
                message: `Push sent to ${sent}/${subscriptions.length} subscriptions`,
                sent,
                total: subscriptions.length,
                results,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
