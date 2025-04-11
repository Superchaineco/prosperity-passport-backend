
import { BadgeStrategy } from './badgeStrategy';
import { CeloCommunityGuildStrategy } from './celoCommunityGuildStrategy';
import { CeloGenesisStrategy } from './celoGenesisStrategy';
import { CeloGovernanceGuardianStrategy } from './celoGovernanceGuardianStrategy';
import { CeloRegionalLeadStrategy } from './celoRegionalLeadStrategy';
import { CeloStewardsStrategy } from './celoStewardsStrategy';
import { CeloTransactionsStrategy } from './celoTransactionsStrategy';
import { CeloVotesStrategy } from './celoVotesStrategy';
import { GitcoinDonationsStrategy } from './gitcoinDonationsStrategy';
import { GivethDonationsStrategy } from './givethDonationsStrategy';
import { GlodollarStrategy } from './glodollarStrategy';
import { ProofOfShipStrategy } from './proofOfShipStrategy';
import { ReFiDaoMemberStrategy } from './refiDaoMemberStrategy';
import { TalentScoreStrategy } from './talentScoreStrategy';



export class BadgeStrategyContext {
  static getBadgeStrategy(badgeName: string): BadgeStrategy {
    switch (badgeName.trim()) {

      case "Celo Genesis":
        return new CeloGenesisStrategy()
      case "Celo User":
        return new CeloTransactionsStrategy()
      case "Giveth Donor":
        return new GivethDonationsStrategy()
      case "Gitcoin Donor":
        return new GitcoinDonationsStrategy()
      case "Talent Protocol Score":
        return new TalentScoreStrategy()
      case "Celo Voter":
        return new CeloVotesStrategy()
      case "CeloPG Steward":
        return new CeloStewardsStrategy()
      case "Regional DAO Lead":
        return new CeloRegionalLeadStrategy()
      case "USD GLO tiers":
        return new GlodollarStrategy()
      case "ReFi DAO Member":
        return new ReFiDaoMemberStrategy()
      case "Community Guild":
        return new CeloCommunityGuildStrategy()
      case "Governance Guardian":
        return new CeloGovernanceGuardianStrategy()
      case "Proof of Ship":
        return new ProofOfShipStrategy()
      default:
        throw new Error(`Badge strategy ${badgeName} not found`);
    }
  }


}
