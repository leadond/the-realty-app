import { prisma } from "@/lib/db";

export type IntegrationDef = {
  name: string;
  displayName: string;
  description: string;
  category: "data" | "signature" | "email" | "social" | "notification";
  canImport: boolean;
  canSync: boolean;
  requiresCredentials: boolean;
  supportLevel: "OFFICIAL" | "BETA" | "COMMUNITY";
};

export const INTEGRATIONS: IntegrationDef[] = [
  {
    name: "csv",
    displayName: "CSV Import",
    description: "Import leads or properties from any CRM export — Follow Up Boss, kvCORE, Chime, spreadsheets, anything.",
    category: "data",
    canImport: true,
    canSync: false,
    requiresCredentials: false,
    supportLevel: "OFFICIAL",
  },
  {
    name: "slack",
    displayName: "Slack",
    description: "Get notified in Slack when a new lead comes in, a showing is scheduled, or a contract is signed.",
    category: "notification",
    canImport: false,
    canSync: false,
    requiresCredentials: true,
    supportLevel: "OFFICIAL",
  },
  {
    name: "zillow",
    displayName: "Zillow / Realtor.com",
    description: "Sync active listings and buyer inquiries. Requires a Zillow developer account (client ID/secret).",
    category: "data",
    canImport: true,
    canSync: true,
    requiresCredentials: true,
    supportLevel: "BETA",
  },
  {
    name: "docusign",
    displayName: "DocuSign",
    description: "Import previously signed contracts. Requires a DocuSign developer account (client ID/secret).",
    category: "signature",
    canImport: true,
    canSync: true,
    requiresCredentials: true,
    supportLevel: "BETA",
  },
  {
    name: "meta",
    displayName: "Facebook / Instagram",
    description: "Auto-publish scheduled social posts to your business pages. Requires a Meta developer app.",
    category: "social",
    canImport: false,
    canSync: true,
    requiresCredentials: true,
    supportLevel: "BETA",
  },
  {
    name: "tiktok",
    displayName: "TikTok",
    description: "Auto-publish scheduled posts to TikTok. Requires a TikTok developer app.",
    category: "social",
    canImport: false,
    canSync: true,
    requiresCredentials: true,
    supportLevel: "BETA",
  },
  {
    name: "linkedin",
    displayName: "LinkedIn",
    description: "Auto-publish scheduled posts to LinkedIn. Requires a LinkedIn developer app.",
    category: "social",
    canImport: false,
    canSync: true,
    requiresCredentials: true,
    supportLevel: "BETA",
  },
];

/** Idempotently syncs the static integration registry into the database. */
export async function ensureIntegrationsSeeded() {
  for (const def of INTEGRATIONS) {
    await prisma.appIntegration.upsert({
      where: { name: def.name },
      update: {
        displayName: def.displayName,
        description: def.description,
        category: def.category,
        canImport: def.canImport,
        canSync: def.canSync,
        requiresCredentials: def.requiresCredentials,
        supportLevel: def.supportLevel,
      },
      create: {
        name: def.name,
        displayName: def.displayName,
        description: def.description,
        category: def.category,
        canImport: def.canImport,
        canSync: def.canSync,
        requiresCredentials: def.requiresCredentials,
        supportLevel: def.supportLevel,
      },
    });
  }
}

/** Env vars that, if set, mean a credentialed integration is actually usable. */
export function isIntegrationConfigured(name: string): boolean {
  switch (name) {
    case "csv":
      return true;
    case "slack":
      return true; // configured per-user via webhook URL, not env vars
    case "zillow":
      return Boolean(process.env.ZILLOW_CLIENT_ID && process.env.ZILLOW_CLIENT_SECRET);
    case "docusign":
      return Boolean(process.env.DOCUSIGN_CLIENT_ID && process.env.DOCUSIGN_CLIENT_SECRET);
    case "meta":
      return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
    case "tiktok":
      return Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET);
    case "linkedin":
      return Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
    default:
      return false;
  }
}
