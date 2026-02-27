import cron from 'node-cron';
import { runRenewalJob } from '../modules/subscriptions/jobs/renewal.job';

export class Scheduler {
  private tasks: cron.ScheduledTask[] = [];

  /**
   * Initialize all scheduled jobs
   */
  start(): void {
    console.log('[Scheduler] Initializing scheduled tasks...');

    // Daily subscription renewal at 2:00 AM
    const renewalTask = cron.schedule(
      '0 2 * * *', // Every day at 2:00 AM
      async () => {
        console.log('[Scheduler] Triggering subscription renewal job');
        await runRenewalJob();
      },
      {
        scheduled: true,
        timezone: process.env.SCHEDULER_TIMEZONE || 'America/Los_Angeles',
      }
    );

    this.tasks.push(renewalTask);
    console.log('[Scheduler] Subscription renewal job scheduled (daily at 2:00 AM)');

    // Run on startup (default: true, set RUN_RENEWAL_ON_STARTUP=false to disable)
    const runOnStartup = process.env.RUN_RENEWAL_ON_STARTUP !== 'false';
    if (runOnStartup) {
      console.log('[Scheduler] Running renewal job on startup...');
      runRenewalJob().catch(error => {
        console.error('[Scheduler] Startup renewal job failed:', error);
      });
    }
  }

  /**
   * Stop all scheduled tasks (useful for graceful shutdown)
   */
  stop(): void {
    console.log('[Scheduler] Stopping all scheduled tasks...');
    this.tasks.forEach(task => task.stop());
    this.tasks = [];
  }
}

export const scheduler = new Scheduler();
