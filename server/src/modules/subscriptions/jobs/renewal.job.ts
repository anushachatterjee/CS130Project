import { renewalService } from '../services/renewal.service';

export async function runRenewalJob(): Promise<void> {
  try {
    await renewalService.processRenewals();
  } catch (error) {
    console.error('[Renewal Job] Job execution failed:', error);
  }
}
