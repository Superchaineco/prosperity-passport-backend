
import { BadgeStrategy } from './badgeStrategy';
import { Celo2TransactionsStrategy } from './celo2TransactionsStrategy';
import { CeloCitizenStrategy } from './celoCitizenStrategy';
import { CeloCommunityGuildStrategy } from './celoCommunityGuildStrategy';
import { CeloEventsPoapStrategy } from './celoEventsPoapStrategy';
import { CeloGenesisStrategy } from './celoGenesisStrategy';
import { CeloGovernanceGuardianStrategy } from './celoGovernanceGuardianStrategy';
import { CeloRegionalLeadStrategy } from './celoRegionalLeadStrategy';
import { CeloSeasonedTransactionsStrategy } from './celoSeasonedTransactions';
import { CeloStewardsStrategy } from './celoStewardsStrategy';
import { CeloTransactionsStrategy } from './celoTransactionsStrategy';
import { CeloVotesStrategy } from './celoVotesStrategy';
import { EcoCreditsStrategy } from './ecoCreditsStrategy';
import { FarcasterConnectionStrategy } from './farcasterConnectionStrategy';
import { GitcoinDonationsStrategy } from './gitcoinDonationsStrategy';
import { GivethDonationsStrategy } from './givethDonationsStrategy';
import { GlodollarStrategy } from './glodollarStrategy';
import { GovContributorStrategy } from './govContributorStrategy';
import { GreenPillMemberStrategy } from './greenPillMemberStrategy';
import { LetsGrowDaoStrategy } from './letsGrowDaoStrategy';
import { ProofOfShipStrategy } from './proofOfShipStrategy';
import { ReFiDaoMemberStrategy } from './refiDaoMemberStrategy';
import { SelfVerificationStrategy } from './selfVerificationStrategy';
import { TalentScoreStrategy } from './talentScoreStrategy';
import { TDFContributorStrategy } from './tdfContributorStrategy';



export class BadgeStrategyContext {
  static getBadgeStrategy(badgeName: string): BadgeStrategy {
    switch (badgeName.trim()) {

      case "Celo Genesis":
        return new CeloGenesisStrategy()
      case "CEL1 Transactions":
        return new CeloTransactionsStrategy()
      case "CEL2 Transactions":
        return new Celo2TransactionsStrategy()
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
      case "ReFi DAO Contributor":
        return new ReFiDaoMemberStrategy()
      case "Community Guild":
        return new CeloCommunityGuildStrategy()
      case "Governance Guardian":
        return new CeloGovernanceGuardianStrategy()
      case "Proof of Ship":
        return new ProofOfShipStrategy()
      case "Eco Credit Retirement":
        return new EcoCreditsStrategy()
      case "Self verification":
        return new SelfVerificationStrategy()
      case "GreenPill Member":
        return new GreenPillMemberStrategy()
      case "Celo Citizen":
        return new CeloCitizenStrategy()
      case "Celo Event POAPs":
        return new CeloEventsPoapStrategy()
      case "Farcaster Connection":
        return new FarcasterConnectionStrategy()
      case "Let’s Grow Contributor":
        return new LetsGrowDaoStrategy()
      case "S1 Transactions":
        return new CeloSeasonedTransactionsStrategy("S1")
      case "S0 Gov Contributor":
        return new GovContributorStrategy("S0")
      case "TDF Contributor":
        return new TDFContributorStrategy()
      default:
        throw new Error(`Badge strategy ${badgeName} not found`);
    }
  }


}
