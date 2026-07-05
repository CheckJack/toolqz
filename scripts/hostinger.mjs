#!/usr/bin/env node
/**
 * Hostinger API CLI — manage websites, Node.js builds, and deploy logs.
 *
 * Requires HOSTINGER_API_TOKEN in .env (see .env.example).
 * Optional: HOSTINGER_DOMAIN (default toolqz.com)
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { loadEnv } from "./load-env.mjs";

loadEnv();

const BASE = "https://developers.hostinger.com";
const token = process.env.HOSTINGER_API_TOKEN;
const defaultDomain = process.env.HOSTINGER_DOMAIN || "toolqz.com";

function usage() {
  console.log(`Usage: node scripts/hostinger.mjs <command>

Commands:
  websites              List hosting websites
  builds [domain]       List Node.js builds (default: HOSTINGER_DOMAIN)
  logs [uuid] [domain]  Show build logs (latest build if uuid omitted)
  setup-mcp             Write .cursor/mcp.json for Cursor (from .env token)

Env:
  HOSTINGER_API_TOKEN   Bearer token from hPanel → Profile → API
  HOSTINGER_DOMAIN      Primary site domain (default: toolqz.com)
`);
}

async function api(path, options = {}) {
  if (!token) {
    throw new Error("HOSTINGER_API_TOKEN is not set. Add it to .env — see .env.example.");
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const msg =
      typeof body === "object" && body?.error
        ? body.error
        : `HTTP ${res.status}: ${text.slice(0, 200)}`;
    throw new Error(msg);
  }

  return body;
}

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

async function listWebsites() {
  const data = await api("/api/hosting/v1/websites");
  const sites = unwrapList(data);
  if (sites.length === 0) {
    console.log("No websites found.");
    return sites;
  }
  for (const site of sites) {
    const domain = site.domain ?? site.name ?? "?";
    const user = site.username ?? site.account ?? "?";
    const enabled = site.is_enabled ?? site.enabled;
    console.log(`- ${domain} (user: ${user}${enabled === false ? ", disabled" : ""})`);
  }
  return sites;
}

async function findWebsite(domain) {
  const sites = await listWebsites();
  const match = sites.find(
    (s) =>
      (s.domain ?? s.name ?? "").toLowerCase() === domain.toLowerCase() ||
      (s.domain ?? "").toLowerCase().endsWith(domain.toLowerCase())
  );
  if (!match) {
    throw new Error(`Website not found for domain "${domain}". Set HOSTINGER_DOMAIN or pass domain as argument.`);
  }
  const username = match.username ?? match.account;
  const siteDomain = match.domain ?? match.name;
  if (!username || !siteDomain) {
    throw new Error("Website record missing username or domain.");
  }
  return { username, domain: siteDomain };
}

async function listBuilds(domain = defaultDomain) {
  const { username, domain: siteDomain } = await findWebsite(domain);
  console.log(`\nNode.js builds for ${siteDomain}:\n`);
  const data = await api(
    `/api/hosting/v1/accounts/${encodeURIComponent(username)}/websites/${encodeURIComponent(siteDomain)}/nodejs/builds`
  );
  const builds = unwrapList(data);
  if (builds.length === 0) {
    console.log("No builds yet.");
    return builds;
  }
  for (const build of builds) {
    const uuid = build.uuid ?? build.id ?? "?";
    const status = build.status ?? build.state ?? "?";
    const created = build.created_at ?? build.createdAt ?? "";
    console.log(`- ${uuid}  ${status}  ${created}`);
  }
  return builds;
}

async function showLogs(uuid, domain = defaultDomain) {
  const { username, domain: siteDomain } = await findWebsite(domain);
  let buildId = uuid;
  if (!buildId) {
    const builds = await api(
      `/api/hosting/v1/accounts/${encodeURIComponent(username)}/websites/${encodeURIComponent(siteDomain)}/nodejs/builds`
    );
    const list = unwrapList(builds);
    buildId = list[0]?.uuid ?? list[0]?.id;
    if (!buildId) throw new Error("No builds found.");
    console.log(`Using latest build: ${buildId}\n`);
  }
  const data = await api(
    `/api/hosting/v1/accounts/${encodeURIComponent(username)}/websites/${encodeURIComponent(siteDomain)}/nodejs/builds/${encodeURIComponent(buildId)}/logs`
  );
  const logs = data?.logs ?? data?.data ?? data;
  if (typeof logs === "string") console.log(logs);
  else console.log(JSON.stringify(logs, null, 2));
}

function setupMcp() {
  if (!token) {
    throw new Error("HOSTINGER_API_TOKEN is not set in .env");
  }

  const config = {
    mcpServers: {
      "hostinger-hosting": {
        command: "npx",
        args: ["-y", "hostinger-hosting-mcp"],
        env: {
          HOSTINGER_API_TOKEN: token,
        },
      },
      "hostinger-api": {
        command: "npx",
        args: ["-y", "hostinger-api-mcp"],
        env: {
          HOSTINGER_API_TOKEN: token,
        },
      },
    },
  };

  const outPath = resolve(process.cwd(), ".cursor/mcp.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`Wrote ${outPath}`);
  console.log("Restart Cursor (or reload MCP servers) to enable Hostinger tools.");
}

async function main() {
  const [command, arg1, arg2] = process.argv.slice(2);

  if (!command || command === "help" || command === "-h") {
    usage();
    process.exit(command ? 0 : 1);
  }

  try {
    switch (command) {
      case "websites":
        await listWebsites();
        break;
      case "builds":
        await listBuilds(arg1 || defaultDomain);
        break;
      case "logs":
        await showLogs(arg1, arg2 || defaultDomain);
        break;
      case "setup-mcp":
        setupMcp();
        break;
      default:
        console.error(`Unknown command: ${command}\n`);
        usage();
        process.exit(1);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
