export type ModelPricingStatus =
  | 'FREE'
  | 'FREE_TIER'
  | 'PAID'
  | 'REQUIRES_CREDITS'
  | 'UNKNOWN'
  | 'UNAVAILABLE';

export interface ZeroCostPolicyState {
  enabled: boolean;
  allowFreeTierModels: boolean;
  blockUnknownPricing: boolean;
  dailyFreeRequestCap: number;
}

export const DEFAULT_ZERO_COST_POLICY: ZeroCostPolicyState = {
  enabled: true,
  allowFreeTierModels: true,
  blockUnknownPricing: true,
  dailyFreeRequestCap: 500,
};

export interface ZeroCostEvaluationResult {
  allowed: boolean;
  pricingStatus: ModelPricingStatus;
  reasonCode?: 'ZERO_COST_MODE_BLOCKED' | 'MODEL_UNAVAILABLE' | 'FREE_QUOTA_EXCEEDED';
  message: string;
}

export function formatPricingLabel(status: ModelPricingStatus): string {
  switch (status) {
    case 'FREE':
      return 'FREE';
    case 'FREE_TIER':
      return 'FREE TIER';
    case 'PAID':
      return 'PAID';
    case 'REQUIRES_CREDITS':
      return 'REQUIRES CREDITS';
    case 'UNAVAILABLE':
      return 'UNAVAILABLE';
    default:
      return 'UNKNOWN';
  }
}

export function isPricingZeroCostEligible(
  status: ModelPricingStatus,
  policy: ZeroCostPolicyState = DEFAULT_ZERO_COST_POLICY
): boolean {
  if (status === 'FREE') return true;
  if (status === 'FREE_TIER') return policy.allowFreeTierModels;
  if (status === 'UNKNOWN') return !policy.blockUnknownPricing;
  return false;
}

export function evaluateZeroCostAccess(params: {
  modelId: string;
  pricingStatus: ModelPricingStatus;
  policy?: ZeroCostPolicyState;
  requestsToday?: number;
}): ZeroCostEvaluationResult {
  const policy = params.policy || DEFAULT_ZERO_COST_POLICY;
  const status = params.pricingStatus;

  if (status === 'UNAVAILABLE') {
    return {
      allowed: false,
      pricingStatus: status,
      reasonCode: 'MODEL_UNAVAILABLE',
      message: `Model "${params.modelId}" is currently unavailable.`,
    };
  }

  if (
    typeof params.requestsToday === 'number' &&
    policy.dailyFreeRequestCap > 0 &&
    params.requestsToday >= policy.dailyFreeRequestCap
  ) {
    return {
      allowed: false,
      pricingStatus: status,
      reasonCode: 'FREE_QUOTA_EXCEEDED',
      message: `Daily Zero Cost quota (${policy.dailyFreeRequestCap} requests) reached.`,
    };
  }

  if (!policy.enabled) {
    return {
      allowed: true,
      pricingStatus: status,
      message: 'Zero Cost Mode disabled by administrator.',
    };
  }

  if (!isPricingZeroCostEligible(status, policy)) {
    return {
      allowed: false,
      pricingStatus: status,
      reasonCode: 'ZERO_COST_MODE_BLOCKED',
      message: `Zero Cost Mode is active: "${params.modelId}" (${formatPricingLabel(status)}) is blocked to guarantee zero spending.`,
    };
  }

  return {
    allowed: true,
    pricingStatus: status,
    message: `Allowed under Zero Cost Mode (${formatPricingLabel(status)}).`,
  };
}
