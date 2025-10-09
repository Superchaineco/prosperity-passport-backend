import { BaseBadgeStrategy } from './badgeStrategy';
import { redisService } from '../../redis.service';
import { Pool } from 'pg';
import { formatUnits, parseUnits } from 'ethers';
import { DATABASE_URL } from '@/config/superChain/constants';
import { Badge } from '../badges.service';

interface Threshold {
  amount: bigint;
  duration: number; // en milisegundos
}

export class VaultsStrategy extends BaseBadgeStrategy {
  private pool: Pool;

  constructor() {
    super();
    this.pool = new Pool({
      connectionString: DATABASE_URL,
    });
  }

  async getValue(
    eoas: string[],
    extraData: any | undefined,
    badgeData: Badge,
    enableLogs: boolean = false
  ): Promise<number> {
    const activeThresholds: Threshold[] = [
      { amount: parseUnits('10', 18), duration: 7 * 24 * 3600 * 1000 }, // 10 CELO for 7 days
      { amount: parseUnits('100', 18), duration: 7 * 24 * 3600 * 1000 }, // 100 CELO for 7 days
      { amount: parseUnits('1000', 18), duration: 7 * 24 * 3600 * 1000 }, // 1000 CELO for 7 days
      { amount: parseUnits('10000', 18), duration: 7 * 24 * 3600 * 1000 }, // 10000 CELO for 7 days
      { amount: parseUnits('10000', 18), duration: 28 * 24 * 3600 * 1000 }, // 10000 CELO for 28 days
    ];
    const { account } = extraData
    const cacheKey = `vaults_transactions-${account}`;
    const ttl = 3600; // 1 hora

    const fetchFunction = async () => {
      const client = await this.pool.connect();
      try {
        const query = `SELECT * FROM vaults_transactions WHERE account = $1 ORDER BY block_time ASC`;
        const result = await client.query(query, [account]);
        const transactions = result.rows;

        const log = enableLogs ? console.log : () => { };

        log(
          `Processing ${transactions.length} transactions for account ${account}`
        );
        if (transactions.length > 0) {
          const firstTx = new Date(transactions[0].block_time);
          const lastTx = new Date(
            transactions[transactions.length - 1].block_time
          );
          const totalDays =
            (lastTx.getTime() - firstTx.getTime()) / (24 * 3600 * 1000);
          log(
            `📅 First tx: ${firstTx.toISOString()}, Last tx: ${lastTx.toISOString()}, Total span: ${totalDays.toFixed(
              2
            )} days`
          );
          log('');
        }

        // Helper function to evaluate a single threshold
        const evaluateThreshold = (threshold: Threshold) => {
          const periods: { start: Date; end: Date }[] = [];
          let currentBalance = BigInt(0);
          let periodStart: Date | null = null;
          let inCount = 0;
          let outCount = 0;

          const thresholdAmount = threshold.amount;
          const days = threshold.duration / (24 * 3600 * 1000);

          log('');
          log(
            `📊 Evaluating threshold: ${formatUnits(
              thresholdAmount, 18
            )} CELO for ${days} days`
          );

          for (const tx of transactions) {
            const txTime = new Date(tx.block_time);
            const amount = BigInt(tx.amount);

            if (tx.direction === 'in') {
              currentBalance += amount;
              inCount++;
            } else if (tx.direction === 'out') {
              currentBalance -= amount;
              outCount++;
            }

            if (currentBalance < BigInt(0)) {
              currentBalance = BigInt(0);
            }

            log(
              `🔁 TX ${tx.direction.toUpperCase()}: ${formatUnits(
                amount, 18
              )} CELO at ${txTime.toISOString()} → balance: ${formatUnits(
                currentBalance, 18
              )} CELO`
            );

            if (currentBalance >= thresholdAmount) {
              if (!periodStart) {
                periodStart = txTime;
                log(
                  `▶️ Period started at ${txTime.toISOString()} (balance ${formatUnits(
                    currentBalance, 18
                  )} CELO)`
                );
              }
            } else {
              if (periodStart) {
                const candidateEnd = txTime;
                const durationMs =
                  candidateEnd.getTime() - periodStart.getTime();
                if (durationMs >= threshold.duration) {
                  periods.push({ start: periodStart, end: candidateEnd });
                  log(
                    `✅ Period satisfied: ${periodStart.toISOString()} - ${candidateEnd.toISOString()} (closed by tx)`
                  );
                } else {
                  log(
                    `⚠️ Observed period too short: ${periodStart.toISOString()} - ${candidateEnd.toISOString()} => ${(
                      durationMs /
                      (24 * 3600 * 1000)
                    ).toFixed(2)} days (required ${days} days)`
                  );
                }
              }
              periodStart = null;
            }
          }

          if (periodStart) {
            const now = new Date();
            const durationMs = now.getTime() - periodStart.getTime();
            if (durationMs >= threshold.duration) {
              periods.push({ start: periodStart, end: now });
              log(
                `🎉 Period satisfied (open until now): ${periodStart.toISOString()} - ${now.toISOString()}`
              );
            } else {
              log(
                `⏳ Open period not long enough: ${periodStart.toISOString()} - ${now.toISOString()} => ${(
                  durationMs /
                  (24 * 3600 * 1000)
                ).toFixed(2)} days (required ${days} days)`
              );
            }
          }

          log(
            `💸 Deposits: ${inCount}, Withdrawals: ${outCount}, Final balance: ${formatUnits(
              currentBalance, 18
            )} CELO`
          );
          const met = periods.length > 0;
          if (!met) {
            log(
              `❌ No continuous periods found meeting ${days} days for this threshold`
            );
          } else {
            log(`✅ Threshold met with ${periods.length} periods`);
          }
          log(`📈 Total periods found for this threshold: ${periods.length}`);
          log('');

          return met;
        };

        const results = activeThresholds.map(evaluateThreshold);

        log('\n📋 Summary for ${account}:');
        if (enableLogs) {
          console.table(
            activeThresholds.map((t, i) => ({
              'Threshold (CELO)': formatUnits(t.amount, 18),
              'Duration (days)': t.duration / (24 * 3600 * 1000),
              Met: results[i] ? 'Yes' : 'No',
            }))
          );
        }

        const highestTier = results.lastIndexOf(true) + 1;
        return highestTier;
      } finally {
        client.release();
      }
    };

    return await redisService.getCachedDataWithCallback(
      cacheKey,
      fetchFunction,
      ttl
    );
  }
}
