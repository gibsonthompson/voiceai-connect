// middleware/planGate.js
// Express middleware for plan-based feature gating

const PLAN_LIMITS = {
  starter: {
    maxClients: 15,
    customDomain: false,
    marketingSite: false,
    demoPhoneNumber: false,
    sampleRecordings: false,
    whitelabelEmails: false,
    tollFreeNumbers: false,
    numberPorting: false,
    advancedAnalytics: false,
    callVolumeTrends: false,
    customReports: false,
    apiAccess: false,
    webhooks: false,
    crmIntegrations: false,
    zapierIntegration: false,
    customIntegrations: false,
    invoiceCustomization: false,
    prioritySupport: false,
    phoneSupport: false,
    dedicatedSuccessManager: false,
    slaGuarantee: false,
  },
  professional: {
    maxClients: 100,
    customDomain: true,
    marketingSite: true,
    demoPhoneNumber: true,
    sampleRecordings: true,
    whitelabelEmails: false,
    tollFreeNumbers: true,
    numberPorting: true,
    advancedAnalytics: true,
    callVolumeTrends: true,
    customReports: false,
    apiAccess: true,
    webhooks: true,
    crmIntegrations: true,
    zapierIntegration: true,
    customIntegrations: false,
    invoiceCustomization: true,
    prioritySupport: true,
    phoneSupport: false,
    dedicatedSuccessManager: false,
    slaGuarantee: false,
  },
  scale: {
    maxClients: Infinity,
    customDomain: true,
    marketingSite: true,
    demoPhoneNumber: true,
    sampleRecordings: true,
    whitelabelEmails: true,
    tollFreeNumbers: true,
    numberPorting: true,
    advancedAnalytics: true,
    callVolumeTrends: true,
    customReports: true,
    apiAccess: true,
    webhooks: true,
    crmIntegrations: true,
    zapierIntegration: true,
    customIntegrations: true,
    invoiceCustomization: true,
    prioritySupport: true,
    phoneSupport: true,
    dedicatedSuccessManager: true,
    slaGuarantee: true,
  },
};

const PLAN_HIERARCHY = ['starter', 'professional', 'scale'];

/**
 * Middleware to require a minimum plan level
 * @param {string} minimumPlan - 'starter', 'professional', or 'scale'
 */
function requirePlan(minimumPlan) {
  return (req, res, next) => {
    const agencyPlan = req.agency?.plan || 'starter';
    const agencyLevel = PLAN_HIERARCHY.indexOf(agencyPlan);
    const requiredLevel = PLAN_HIERARCHY.indexOf(minimumPlan);
    
    if (agencyLevel < requiredLevel) {
      return res.status(403).json({
        error: 'Plan upgrade required',
        message: `This feature requires the ${minimumPlan} plan or higher`,
        required_plan: minimumPlan,
        current_plan: agencyPlan,
        upgrade_url: '/agency/settings/billing'
      });
    }
    next();
  };
}

/**
 * Middleware to require a specific feature
 * @param {string} feature - Feature key from PLAN_LIMITS
 */
function requireFeature(feature) {
  return (req, res, next) => {
    const plan = req.agency?.plan || 'starter';
    const hasFeature = PLAN_LIMITS[plan]?.[feature];
    
    if (!hasFeature) {
      // Find the minimum plan that has this feature
      let requiredPlan = 'scale';
      for (const planName of PLAN_HIERARCHY) {
        if (PLAN_LIMITS[planName][feature]) {
          requiredPlan = planName;
          break;
        }
      }
      
      return res.status(403).json({
        error: 'Feature not available',
        message: `This feature requires the ${requiredPlan} plan or higher`,
        feature: feature,
        required_plan: requiredPlan,
        current_plan: plan,
        upgrade_url: '/agency/settings/billing'
      });
    }
    next();
  };
}

/**
 * Middleware to check client limit before creating new client
 */
function checkClientLimit(req, res, next) {
  const plan = req.agency?.plan || 'starter';
  const currentClients = req.agency?.client_count || 0;
  const limit = PLAN_LIMITS[plan].maxClients;
  
  if (currentClients >= limit) {
    let upgradePlan = null;
    if (plan === 'starter') upgradePlan = 'professional';
    else if (plan === 'professional') upgradePlan = 'scale';
    
    return res.status(403).json({
      error: 'Client limit reached',
      message: `You've reached the maximum of ${limit} clients for your ${plan} plan`,
      limit: limit,
      current: currentClients,
      current_plan: plan,
      upgrade_plan: upgradePlan,
      upgrade_url: '/agency/settings/billing'
    });
  }
  next();
}

/**
 * Get plan limits for an agency
 */
function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.starter;
}

/**
 * Check if a plan has access to a feature
 */
function canAccessFeature(plan, feature) {
  return !!PLAN_LIMITS[plan]?.[feature];
}

/**
 * Get client limit for a plan
 */
function getClientLimit(plan) {
  return PLAN_LIMITS[plan]?.maxClients || 15;
}

/**
 * Check if agency is at client limit
 */
function isAtClientLimit(plan, currentClients) {
  return currentClients >= getClientLimit(plan);
}

module.exports = {
  PLAN_LIMITS,
  PLAN_HIERARCHY,
  requirePlan,
  requireFeature,
  checkClientLimit,
  getPlanLimits,
  canAccessFeature,
  getClientLimit,
  isAtClientLimit,
};