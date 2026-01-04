// Common utility types
export type EnumValues<Type> = Type[keyof Type];

// Auth types
export const ORG_ROLE = {
  ADMIN: 'org:admin',
  MEMBER: 'org:member',
} as const;

export type OrgRole = EnumValues<typeof ORG_ROLE>;

export const ORG_PERMISSION = {
  // Add Organization Permissions here
} as const;

export type OrgPermission = EnumValues<typeof ORG_PERMISSION>;

// Subscription and billing types
export const BILLING_INTERVAL = {
  MONTH: 'month',
  YEAR: 'year',
} as const;

export type BillingInterval = EnumValues<typeof BILLING_INTERVAL>;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
} as const;

export type PricingPlan = {
  id: string;
  price: number;
  interval: BillingInterval;
  testPriceId: string;
  devPriceId: string;
  prodPriceId: string;
  features: {
    teamMember: number;
    website: number;
    storage: number;
    transfer: number;
  };
};

export type IStripeSubscription = {
  stripeSubscriptionId: string | null;
  stripeSubscriptionPriceId: string | null;
  stripeSubscriptionStatus: string | null;
  stripeSubscriptionCurrentPeriodEnd: number | null;
};

export type PlanDetails =
  | {
    isPaid: true;
    plan: PricingPlan;
    stripeDetails: IStripeSubscription;
  } | {
    isPaid: false;
    plan: PricingPlan;
    stripeDetails?: undefined;
  };
