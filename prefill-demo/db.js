"use strict";

/**
 * MongoDB layer (Mongoose) for the registration -> INQUA Participant Lookup
 * handoff.
 *
 * There is no callback API any more. INQUA's /participant page does its own
 * lookup (via their Partner Data Sharing API) once it has the URN. Our only
 * job is: given a registrationId, know that registration's urn.
 */

const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/inqua_booking_handoff";

// --- schema --------------------------------------------------------------

const registrationSchema = new mongoose.Schema(
  {
    registrationId: { type: String, required: true, unique: true },
    urn: { type: String, trim: true }, // the id INQUA's Participant Lookup expects; absent if not yet issued
    firstName: { type: String, trim: true }, // display only, on our own registrations page
    lastName: { type: String, trim: true },
    status: { type: String, enum: ["confirmed", "pending", "cancelled"], default: "pending" }, // display only, no longer gates the redirect
  },
  { timestamps: true, collection: "registrations" }
);

const Registration = mongoose.model("Registration", registrationSchema);

// --- seed ---------------------------------------------------------------------
// urn values for the first four rows are INQUA's own published test URNs, so
// clicking through actually hits their live /participant page with real data.

const SEED = [
  { registrationId: "INQUA2026-04821", urn: "UF410Z", firstName: "Basant", lastName: "Bhagat", status: "confirmed" },
  { registrationId: "INQUA2026-00002", urn: "IELVG9", firstName: "Grace", lastName: "Hopper", status: "confirmed" },
  { registrationId: "INQUA2026-07777", urn: "CEKUOP", firstName: "Meera", lastName: "Nair", status: "confirmed" },
  { registrationId: "INQUA2026-00003", urn: "6504DF", firstName: "Alan", lastName: "Turing", status: "cancelled" },
  { registrationId: "INQUA2026-00009", firstName: "Ada", lastName: "Lovelace", status: "pending" }, // no urn issued yet
];

async function connect({ seed = true } = {}) {
  mongoose.set("strictQuery", true);
  mongoose.connection.on("error", (e) => console.error("  mongo error:", e.message));
  await mongoose.connect(MONGODB_URI);
  await Registration.syncIndexes();
  if (seed && (await Registration.countDocuments()) === 0) {
    await Registration.insertMany(SEED);
    console.log(`  seeded ${SEED.length} registrations`);
  }
}

// --- data access ------------------------------------------------------------

async function getRegistration(registrationId) {
  return Registration.findOne({ registrationId }).lean();
}

async function listRegistrations() {
  return Registration.find().sort({ registrationId: 1 }).lean();
}

async function dumpAll() {
  return { registrations: await Registration.find().lean() };
}

module.exports = {
  mongoose,
  MONGODB_URI,
  Registration,
  SEED,
  connect,
  getRegistration,
  listRegistrations,
  dumpAll,
};
