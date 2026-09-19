"use strict";

/**
 * Redirect to INQUA's Participant Lookup page.
 *
 * The entire integration is a one-way redirect:
 *   GET /book?urn=<URN>  ->  302 -> ${PARTICIPANT_BASE_URL}/stay#urn=<URN>
 *
 * No auth token, no headers, no POST body, no lookup, nothing calls back to
 * us. INQUA's /stay page reads `urn` from the URL fragment itself and looks
 * the participant up. See PARTICIPANT-LOOKUP.md for the spec this implements.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const sampleUrns = require("./sample-urns");

// --- config ---------------------------------------------------------------

const PORT = Number(process.env.PORT || 4000);
// dev default is the local INQUA dev instance; production is https://inqua.cotrav.co.in
const PARTICIPANT_BASE_URL = (process.env.PARTICIPANT_BASE_URL || "https://demoinqua.cotrav.co.in").replace(/\/+$/, "");

const INDEX_PATH = path.join(__dirname, "index.html");

// --- http helpers -----------------------------------------------------------

function sendHtml(res, status, html) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  res.end(html);
}
function escapeHtml(v) {
  return String(v).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

/** Build the one redirect target this whole app exists to produce. */
function participantUrl(urn) {
  return `${PARTICIPANT_BASE_URL}/stay#urn=${encodeURIComponent(urn)}`;
}

// --- pages ---------------------------------------------------------------------

function renderIndex() {
  const rows = sampleUrns
    .listSampleUrns()
    .map(
      (r) => `<tr>
        <td><code>${escapeHtml(r.urn)}</code></td>
        <td>${escapeHtml(r.status)}</td>
        <td><a class="btn" href="/book?urn=${encodeURIComponent(r.urn)}">Book your stay</a></td>
      </tr>`
    )
    .join("\n");

  return fs
    .readFileSync(INDEX_PATH, "utf8")
    .replaceAll("{{ROWS}}", rows)
    .replaceAll("{{PARTICIPANT_BASE}}", escapeHtml(PARTICIPANT_BASE_URL))
    .replaceAll("{{PROD_BASE}}", "https://inqua.cotrav.co.in");
}

function miniPage(title, bodyHtml) {
  return `<!doctype html><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<body style="font:15px/1.5 system-ui,sans-serif;margin:40px;max-width:640px;color:#1c1e21">
<h1 style="font-size:19px">${escapeHtml(title)}</h1>
${bodyHtml}
<p><a href="/">&larr; back</a></p>`;
}

// --- server ------------------------------------------------------------------

const server = http.createServer((req, res) => {
  try {
    handle(req, res);
  } catch (err) {
    console.error("unhandled:", err);
    if (!res.headersSent) sendHtml(res, 500, miniPage("Error", "<p>Something went wrong.</p>"));
  }
});

function handle(req, res) {
  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || "localhost:" + PORT}`);
  } catch {
    return sendHtml(res, 400, miniPage("Bad request", "<p>Could not parse the URL.</p>"));
  }
  const p = url.pathname;

  if (req.method === "GET" && p === "/") {
    return sendHtml(res, 200, renderIndex());
  }

  // The entire integration: take a urn, redirect. No lookup, nothing stored.
  if (req.method === "GET" && (p === "/book" || p === "/book-your-stay")) {
    const urn = (url.searchParams.get("urn") || "").trim();
    if (!urn) {
      return sendHtml(res, 400, miniPage("URN required", "<p>Add <code>?urn=&lt;URN&gt;</code>.</p>"));
    }
    const location = participantUrl(urn);
    console.log(`GET /book urn=${urn} -> ${location}`);
    res.writeHead(302, { Location: location, "Cache-Control": "no-store" });
    return res.end();
  }

  if (req.method === "GET" && p === "/favicon.ico") {
    res.writeHead(204);
    return res.end();
  }

  sendHtml(res, 404, miniPage("Not found", "<p>No such route.</p>"));
}

server.listen(PORT, () => {
  console.log("registration -> INQUA Participant Lookup handoff");
  console.log(`  listening on       http://localhost:${PORT}`);
  console.log(`  participant lookup ${PARTICIPANT_BASE_URL}  (redirect to /stay#urn=<URN>)`);
  console.log(`  production target  https://inqua.cotrav.co.in/stay#urn=<URN>`);
});
