export type Tier = 'Free' | 'Pro' | 'Premium';

const MODULE_TIERS: Record<string, Tier> = {
  leadTracker: 'Free',
  showingCalendar: 'Free',
  crmImportExport: 'Free',
  marketResearch: 'Pro',
  propertyValuation: 'Pro',
  listingGenerator: 'Pro',
  emailTemplates: 'Pro',
  aiShowingAssistant: 'Pro',
  aiPropertyMatchmaker: 'Pro',
  marketingSocial: 'Pro',
  reviewManager: 'Pro',
  mortgageCalculator: 'Pro',
  reportingDashboard: 'Pro',
  openHouseManager: 'Premium',
  transactionManagement: 'Premium',
  clientPortal: 'Premium',
  mlsFeedSync: 'Premium',
  documentGenerator: 'Premium',
};

const TIER_LEVELS: Record<Tier, number> = { Free: 0, Pro: 1, Premium: 2 };

export function hasAccess(moduleName: string, userTier: Tier): boolean {
  const required = MODULE_TIERS[moduleName];
  if (!required) return false;
  return TIER_LEVELS[userTier] >= TIER_LEVELS[required];
}

export function getAvailableModules(userTier: Tier): string[] {
  return Object.entries(MODULE_TIERS)
    .filter(([, tier]) => TIER_LEVELS[tier] <= TIER_LEVELS[userTier])
    .map(([name]) => name);
}
