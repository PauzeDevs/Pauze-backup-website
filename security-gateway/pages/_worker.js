const COOKIE_NAME = "__Host-pauze_verified";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const VERIFY_PATH = "/__pauze/verify";
const LOGOUT_PATH = "/__pauze/logout";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff"
};

function getSites(env) {
  try {
    const sites = JSON.parse(env.SITE_REPOS_JSON || "{}");
    return sites && typeof sites === "object" && !Array.isArray(sites) ? sites : {};
  } catch {
    return {};
  }
}

function siteForRequest(request, env) {
  const hostname = new URL(request.url).hostname.toLowerCase().replace(/\.$/, "");
  const site = getSites(env)[hostname];
  if (!site || !/^[a-z0-9.-]+$/.test(hostname)) return null;
  if (!/^[A-Za-z0-9_.-]+$/.test(site.owner || "")) return null;
  if (!/^[A-Za-z0-9_.-]+$/.test(site.repo || "")) return null;
  if (!/^[A-Za-z0-9_.-]+$/.test(site.branch || "")) return null;
  return { hostname, owner: site.owner, repo: site.repo, branch: site.branch };
}

function jsonResponse(body, status, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: Object.assign({}, JSON_HEADERS, extraHeaders || {})
  });
}

function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecodeToText(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, function (char) { return char.charCodeAt(0); });
  return new TextDecoder().decode(bytes);
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return base64UrlEncode(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function issueSession(hostname, secret) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = base64UrlEncode(new TextEncoder().encode(hostname + "|" + expires + "|v1"));
  return payload + "." + await sign(payload, secret);
}

async function hasValidSession(request, hostname, secret) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(new RegExp("(?:^|;\\s*)" + COOKIE_NAME + "=([^;]+)"));
  if (!match) return false;
  const parts = match[1].split(".");
  if (parts.length !== 2) return false;
  try {
    const payload = parts[0];
    if (!constantTimeEqual(parts[1], await sign(payload, secret))) return false;
    const decoded = base64UrlDecodeToText(payload).split("|");
    return decoded[0] === hostname &&
      decoded[2] === "v1" &&
      /^\d+$/.test(decoded[1] || "") &&
      Number(decoded[1]) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function setSessionCookie(value) {
  return COOKIE_NAME + "=" + value + "; Path=/; Max-Age=" + SESSION_TTL_SECONDS + "; Secure; HttpOnly; SameSite=Lax";
}

function clearSessionCookie() {
  return COOKIE_NAME + "=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (char) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
  });
}

function challengePage(siteKey, hostname) {
  const configured = Boolean(siteKey && !siteKey.startsWith("REPLACE_"));
  const key = escapeHtml(siteKey || "");
  const domain = escapeHtml(hostname);
  const widget = configured
    ? '<div class="cf-turnstile" data-sitekey="' + key + '" data-theme="dark" data-action="site_access" data-callback="pauzeVerified" data-error-callback="pauzeVerificationError" data-expired-callback="pauzeVerificationExpired"></div>'
    : '<p class="error" role="alert">Verification is not configured yet. Please try again later.</p>';
  const script = configured
    ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>'
    : "";

  const markup = '<!doctype html>\n' +
'<html lang="en"><head>\n' +
'<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' +
'<meta name="theme-color" content="#07090d"><meta name="robots" content="noindex,nofollow">\n' +
'<title>Verify access · PAUZE</title>\n' +
'<style>\n' +
':root{color-scheme:dark;--bg:#07090d;--panel:#10141b;--line:#2b323d;--text:#e8edf3;--muted:#9aa6b5;--accent:#a9ddf5}*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{min-height:100vh;display:grid;place-items:center;padding:24px;overflow:hidden}body:before{content:"";position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 30%,#a9ddf512,transparent 52%),linear-gradient(transparent 97%,#a9ddf508 98%);background-size:auto,100% 34px}.card{position:relative;width:min(100%,460px);padding:clamp(26px,6vw,44px);border:1px solid #ffffff18;border-radius:26px;background:linear-gradient(145deg,#121821f5,#0c1016f8);box-shadow:0 28px 100px #0009;backdrop-filter:blur(24px);text-align:center}.brand{display:flex;justify-content:center;align-items:center;gap:10px;margin:0 0 34px;font-size:14px;font-weight:800;letter-spacing:.16em}.mark{display:grid;place-items:center;width:30px;height:30px;border:1px solid #a9ddf55c;border-radius:10px;color:var(--accent);font-size:15px;letter-spacing:-.1em}.eyebrow{margin:0 0 12px;color:var(--accent);font-size:10px;font-weight:700;letter-spacing:.19em;text-transform:uppercase}h1{margin:0;font-size:clamp(29px,7vw,38px);line-height:1.08;letter-spacing:-.055em;font-weight:650}.copy{margin:15px auto 24px;max-width:310px;color:var(--muted);font-size:14px;line-height:1.7}.widget-wrap{display:flex;justify-content:center;min-height:66px;margin:10px 0 18px}.status{min-height:22px;margin:12px 0 0;color:var(--muted);font-size:12px;line-height:1.5}.error{margin:10px 0;color:#ffb5b5;font-size:12px}.footer{display:flex;justify-content:space-between;gap:12px;border-top:1px solid var(--line);margin-top:26px;padding-top:18px;color:#758190;font-size:10px;letter-spacing:.08em;text-transform:uppercase}@media(max-width:420px){.card{border-radius:20px}.footer{font-size:9px}}\n' +
'</style>' + script + '</head><body>\n' +
'<main class="card"><div class="brand"><span class="mark" aria-hidden="true">P/</span><span>PAUZE</span></div>\n' +
'<p class="eyebrow">SECURITY CHECK</p><h1>Verify you are human.</h1>\n' +
'<p class="copy">Complete this quick check to continue to the PAUZE website.</p>\n' +
'<div class="widget-wrap" id="widget">' + widget + '</div>\n' +
'<p class="status" id="status" role="status" aria-live="polite">' + (configured ? "Your verification is processed securely." : "The site owner needs to finish setup.") + '</p>\n' +
'<div class="footer"><span>PAUZE / ACCESS CONTROL</span><span>' + domain + '</span></div></main>\n' +
'<script>\n' +
'(function(){var status=document.getElementById("status");function showError(message){status.textContent=message;status.style.color="#ffb5b5";}window.pauzeVerificationError=function(){showError("The security check could not load. Refresh the page and try again.");};window.pauzeVerificationExpired=function(){status.textContent="Check expired. Please complete it again.";};window.pauzeVerified=async function(token){status.textContent="Checking verification…";try{var response=await fetch("/__pauze/verify",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({token:token})});var result=await response.json().catch(function(){return {};});if(!response.ok||result.ok!==true){showError(result.error||"Verification failed. Please try again.");if(window.turnstile)window.turnstile.reset();return;}status.style.color="#a9ddf5";status.textContent="Verified. Opening the website…";window.location.replace("/");}catch(e){showError("The verification service is unavailable. Access remains blocked.");if(window.turnstile)window.turnstile.reset();}};})();\n' +
'</script></body></html>';

  return new Response(markup, {
    status: configured ? 200 : 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "x-robots-tag": "noindex, nofollow"
    }
  });
}

function contentTypeFor(path) {
  const lower = path.toLowerCase();
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html; charset=utf-8";
  if (lower.endsWith(".css")) return "text/css; charset=utf-8";
  if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "text/javascript; charset=utf-8";
  if (lower.endsWith(".json") || lower.endsWith(".webmanifest")) return "application/json; charset=utf-8";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".xml")) return "application/xml; charset=utf-8";
  if (lower.endsWith(".txt") || lower.endsWith(".md")) return "text/plain; charset=utf-8";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".ico")) return "image/x-icon";
  if (lower.endsWith(".woff")) return "font/woff";
  if (lower.endsWith(".woff2")) return "font/woff2";
  if (lower.endsWith(".ttf")) return "font/ttf";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".mp4")) return "video/mp4";
  return "application/octet-stream";
}

function safePathFromUrl(url) {
  let decoded;
  try {
    decoded = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
  if (decoded.includes("\\") || decoded.includes("\0")) return null;
  const segments = decoded.split("/").filter(Boolean);
  if (segments.some(function (segment) { return segment === "." || segment === ".."; })) return null;
  if (segments.some(function (segment) { return segment.startsWith(".git"); })) return null;
  if (segments.length === 0) return "index.html";
  const path = segments.join("/");
  return decoded.endsWith("/") ? path + "/index.html" : path;
}

async function fetchRepositoryAsset(request, site) {
  const requestUrl = new URL(request.url);
  const path = safePathFromUrl(requestUrl);
  if (!path) return new Response("Bad Request", { status: 400 });
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const rawUrl = "https://raw.githubusercontent.com/" + site.owner + "/" + site.repo + "/" + site.branch + "/" + encodedPath;
  let upstream;
  try {
    upstream = await fetch(rawUrl, {
      method: request.method,
      headers: { "User-Agent": "PAUZE-Human-Verification-Gateway/1.0" },
      redirect: "manual"
    });
    if (upstream.status === 404 && !path.includes(".") && !path.endsWith("index.html")) {
      const fallbackPath = path.replace(/\/+$/, "") + "/index.html";
      const fallbackUrl = "https://raw.githubusercontent.com/" + site.owner + "/" + site.repo + "/" + site.branch + "/" + fallbackPath.split("/").map(encodeURIComponent).join("/");
      upstream = await fetch(fallbackUrl, {
        method: request.method,
        headers: { "User-Agent": "PAUZE-Human-Verification-Gateway/1.0" },
        redirect: "manual"
      });
    }
  } catch {
    return new Response("The website origin is temporarily unavailable.", {
      status: 502,
      headers: { "cache-control": "no-store" }
    });
  }

  if (!upstream.ok) {
    return new Response(upstream.status === 404 ? "Not Found" : "Origin unavailable", {
      status: upstream.status === 404 ? 404 : 502,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff"
      }
    });
  }

  const headers = new Headers({
    "content-type": contentTypeFor(path),
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "cache-control": path.endsWith(".html") ? "no-cache" : "public, max-age=300"
  });
  const etag = upstream.headers.get("etag");
  if (etag) headers.set("etag", etag);
  const lastModified = upstream.headers.get("last-modified");
  if (lastModified) headers.set("last-modified", lastModified);

  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers: headers
  });
}

async function verifyToken(request, site, env) {
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed." }, 405, { allow: "POST" });
  }

  const origin = request.headers.get("Origin");
  if (origin && origin !== "https://" + site.hostname) {
    return jsonResponse({ ok: false, error: "Origin check failed." }, 403);
  }

  const declaredLength = Number(request.headers.get("Content-Length") || "0");
  if (declaredLength > 4096) return jsonResponse({ ok: false, error: "Request too large." }, 413);
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonResponse({ ok: false, error: "Expected JSON." }, 415);
  }

  let body;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return jsonResponse({ ok: false, error: "Request too large." }, 413);
    body = JSON.parse(raw);
  } catch {
    return jsonResponse({ ok: false, error: "Invalid request." }, 400);
  }

  const token = typeof body.token === "string" ? body.token : "";
  if (!token || token.length > 2048) {
    return jsonResponse({ ok: false, error: "Complete the human check first." }, 400);
  }
  if (!env.TURNSTILE_SECRET_KEY || !env.SESSION_SECRET) {
    return jsonResponse({ ok: false, error: "Verification is not configured. Access remains blocked." }, 503);
  }

  let result;
  try {
    const validation = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: request.headers.get("CF-Connecting-IP") || undefined
      })
    });
    result = await validation.json();
  } catch {
    return jsonResponse({ ok: false, error: "Verification service unavailable. Please retry." }, 502);
  }

  if (result.success !== true || result.hostname !== site.hostname || result.action !== "site_access") {
    return jsonResponse({ ok: false, error: "Verification could not be confirmed. Please try again." }, 403);
  }

  const session = await issueSession(site.hostname, env.SESSION_SECRET);
  return jsonResponse({ ok: true }, 200, {
    "set-cookie": setSessionCookie(session),
    "cache-control": "no-store"
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const site = siteForRequest(request, env);
    if (!site) return new Response("Unknown host", { status: 404 });

    if (url.pathname === VERIFY_PATH) return verifyToken(request, site, env);

    if (url.pathname === LOGOUT_PATH) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: "/",
          "Set-Cookie": clearSessionCookie(),
          "Cache-Control": "no-store"
        }
      });
    }

    if (!env.TURNSTILE_SITE_KEY || env.TURNSTILE_SITE_KEY.startsWith("REPLACE_") ||
        !env.TURNSTILE_SECRET_KEY || !env.SESSION_SECRET) {
      return new Response("PAUZE verification gateway is not configured. No website content was served.", {
        status: 503,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff"
        }
      });
    }

    if (!(await hasValidSession(request, site.hostname, env.SESSION_SECRET))) {
      return challengePage(env.TURNSTILE_SITE_KEY, site.hostname);
    }

    return fetchRepositoryAsset(request, site);
  }
};
