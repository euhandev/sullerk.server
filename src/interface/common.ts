import { IGenericErrorMessage } from '@/error/error';

export type IGenericResponse<T> = {
  meta: {
    page: number;
    limit: number;
    total: number;
  };
  data: T;
};

export type IGenericErrorResponse = {
  statusCode: number;
  message: string;
  errorMessages: IGenericErrorMessage[];
};

export type ISubscriptionSection =
  | 'CUSTOMER_SUBSCRIPTION'
  | 'BROKER_FIRM_SUBSCRIPTION'
  | 'PROPERTY_BOOSTING';

export type IPropertySubscriptionStripeMetaData = {
  section: ISubscriptionSection;
  propertySubscriptionId: string;
  customerId: string;
  propertySubscriptionPlanId: string;
  propertyId: string;
};

export type IBrokerFirmStripeSubscriptionMetaData = {
  section: ISubscriptionSection;
  brokerFirmId: string;
  brokerFirmSubscriptionPlanId: string;
};

export type IPropertyBoostingStripeSubscriptionMetaData = {
  section: ISubscriptionSection;
  propertyId: string;
  boostingId: string;
};
