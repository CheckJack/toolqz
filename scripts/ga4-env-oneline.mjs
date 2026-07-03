#!/usr/bin/env node
/**
 * Print GA4 env vars for Hostinger from a Google service-account JSON file.
 *
 * Usage:
 *   node scripts/ga4-env-oneline.mjs path/to/service-account.json
 *
 * Copy into Hostinger → Node.js app → Environment variables.
 * GA4_CREDENTIALS_BASE64 is the most reliable on Hostinger.
 */
import { readFileSync } from "node:fs";

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error("Usage: node scripts/ga4-env-oneline.mjs <service-account.json>");
  process.exit(1);
}

const raw = readFileSync(jsonPath, "utf8");
const creds = JSON.parse(raw);
if (!creds.client_email || !creds.private_key) {
  console.error("Invalid service account JSON — missing client_email or private_key.");
  process.exit(1);
}

const propertyId = process.env.GA4_PROPERTY_ID || "544145954";
const oneLine = JSON.stringify(creds);
const base64 = Buffer.from(oneLine, "utf8").toString("base64");

console.log("# Paste into Hostinger → Node.js → Environment variables, then redeploy.\n");
console.log("# 1. Remove these if present (they often break):");
console.log("#    GA4_PRIVATE_KEY, GA4_CLIENT_EMAIL, GA4_CREDENTIALS_JSON\n");
console.log(`GA4_PROPERTY_ID=${propertyId}`);
console.log(`GA4_CREDENTIALS_BASE64=${base64}`);
console.log("\n# Alternative (less reliable on Hostinger):");
console.log(`# GA4_CREDENTIALS_JSON=${oneLine}`);
