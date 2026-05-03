// validators/stripe-price-id.validator.ts
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsStripePriceId(validationOptions?: ValidationOptions) {
  return function (object: Record<string, unknown>, propertyName: string) {
    registerDecorator({
      name: 'isStripePriceId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          // Skip validation if value is undefined or null (for optional fields)
          if (value === null || value === undefined) {
            return true;
          }

          // Must be a string
          if (typeof value !== 'string') {
            return false;
          }

          // Must match Stripe price ID format: price_[a-zA-Z0-9]{14,25}
          const stripePriceRegex = /^price_[a-zA-Z0-9]{14,25}$/;
          return stripePriceRegex.test(value);
        },

        defaultMessage(args: ValidationArguments) {
          const { property, value } = args;

          if (value === null || value === undefined) {
            return `${property} must be a valid Stripe Price ID if provided`;
          }

          if (typeof value !== 'string') {
            return `${property} must be a string in the format: price_xxxxxxxxxxxxxx`;
          }

          return `${property} must be a valid Stripe Price ID (format: price_xxxxxxxxxxxxxx). Received: ${value}`;
        },
      },
    });
  };
}
