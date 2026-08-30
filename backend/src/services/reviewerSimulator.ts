import { db } from '../db/memoryDb';

const REVIEWER_DELAY_MS = 8_000; // 8 seconds for demo
const NUM_REVIEWERS = 5;
const CLAP_COINS_PER_APPROVAL = 500;

export const REVIEWER_AVATARS = [
  { id: 'reviewer-1', handle: '@maya_r', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maya' },
  { id: 'reviewer-2', handle: '@tom_v', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tom' },
  { id: 'reviewer-3', handle: '@sara_k', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sara' },
  { id: 'reviewer-4', handle: '@john_d', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john' },
  { id: 'reviewer-5', handle: '@nina_p', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nina' },
];

function randomScore(): number {
  // Generates rating 4 or 5
  return Math.random() > 0.3 ? 5 : 4;
}

/**
 * Simulates reviewer votes on an AI_PASSED submission.
 */
export function runReviewerSimulation(
  submissionId: string,
  creatorId: string,
  bountyTitle: string,
  payoutCents: number
): void {
  console.log(`[reviewer] Starting automated reviewer simulation for submission ${submissionId}`);

  setTimeout(() => {
    try {
      const sub = db.getSubmission(submissionId);
      if (!sub) return;

      // Only simulate if still in AI_PASSED or IN_REVIEW
      if (sub.status !== 'AI_PASSED' && sub.status !== 'IN_REVIEW') return;

      // Update submission to SCORED
      db.updateSubmission(submissionId, {
        status: 'SCORED',
      });

      // Update creator trust score (+5) and ClapCoins
      const user = db.getUser(creatorId);
      if (user) {
        const newTrust = Math.min(user.trustScore + 5, 200);
        const newBalance = user.clapCoinsBalance + CLAP_COINS_PER_APPROVAL;

        db.updateUser(creatorId, {
          trustScore: newTrust,
          clapCoinsBalance: newBalance,
        });

        // Record in ledger
        db.addLedgerEntry({
          userId: creatorId,
          amount: CLAP_COINS_PER_APPROVAL,
          type: 'earn',
          description: `Approved: "${bountyTitle}" — Payout $${(payoutCents / 100).toFixed(2)} + ${CLAP_COINS_PER_APPROVAL} ClapCoins`,
        });

        console.log(`[reviewer] Simulation complete: Creator ${creatorId} received ${CLAP_COINS_PER_APPROVAL} ClapCoins`);
      }
    } catch (err) {
      console.error('[reviewer] Simulation error:', err);
    }
  }, REVIEWER_DELAY_MS);
}
