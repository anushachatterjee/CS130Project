import { subscriptionsRepo, type SubscriptionRow } from '../repositories/subscriptions.repo';

export class RenewalService {
  /**
   * Calculate next renewal date based on billing cycle
   */
  calculateNextRenewalDate(currentDate: Date, billingCycle: string): Date {
    const next = new Date(currentDate);

    switch (billingCycle) {
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'bi-weekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        throw new Error(`Unsupported billing cycle: ${billingCycle}`);
    }

    return next;
  }

  /**
   * Process a single subscription renewal
   */
  async renewSubscription(subscription: SubscriptionRow): Promise<void> {
    if (!subscription.next_renewal_date) {
      throw new Error('Cannot renew subscription without renewal date');
    }

    const currentRenewalDate = new Date(subscription.next_renewal_date);
    const nextRenewalDate = this.calculateNextRenewalDate(
      currentRenewalDate,
      subscription.billing_cycle
    );

    await subscriptionsRepo.updateRenewalDate(
      subscription.subscription_id,
      nextRenewalDate
    );

    console.log(
      `Renewed subscription ${subscription.subscription_id} ` +
      `(${subscription.subscription_title}) from ` +
      `${currentRenewalDate.toISOString().split('T')[0]} to ` +
      `${nextRenewalDate.toISOString().split('T')[0]}`
    );
  }

  /**
   * Process all due renewals
   */
  async processRenewals(): Promise<{
    processed: number;
    failed: number;
    errors: Array<{ subscriptionId: string; error: string }>;
  }> {
    const startTime = Date.now();
    console.log('[Renewal Job] Starting subscription renewal process...');

    let processed = 0;
    let failed = 0;
    const errors: Array<{ subscriptionId: string; error: string }> = [];

    try {
      const dueSubscriptions = await subscriptionsRepo.findDueRenewals();
      console.log(`[Renewal Job] Found ${dueSubscriptions.length} subscriptions due for renewal`);

      for (const subscription of dueSubscriptions) {
        try {
          await this.renewSubscription(subscription);
          processed++;
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push({
            subscriptionId: subscription.subscription_id,
            error: errorMessage,
          });
          console.error(
            `[Renewal Job] Failed to renew subscription ${subscription.subscription_id}:`,
            errorMessage
          );
        }
      }

      const duration = Date.now() - startTime;
      console.log(
        `[Renewal Job] Completed in ${duration}ms. ` +
        `Processed: ${processed}, Failed: ${failed}`
      );

      return { processed, failed, errors };
    } catch (error) {
      console.error('[Renewal Job] Critical error during renewal process:', error);
      throw error;
    }
  }
}

export const renewalService = new RenewalService();
