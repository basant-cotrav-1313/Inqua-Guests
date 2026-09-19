"use strict";

/**
 * Sample URNs for this demo page only (the table + quick links on `/`).
 * Not used by the redirect itself -- `/book?urn=<urn>` takes whatever urn
 * it's given and redirects, no lookup involved.
 */
const SAMPLE_URNS = [
  { urn: "UF410Z", status: "confirmed" },
  { urn: "IELVG9", status: "confirmed" },
  { urn: "CEKUOP", status: "confirmed" },
  { urn: "6504DF", status: "cancelled" },
];

function listSampleUrns() {
  return SAMPLE_URNS;
}

module.exports = { listSampleUrns };
