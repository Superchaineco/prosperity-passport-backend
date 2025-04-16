
import { BadgeStrategy } from './badgeStrategy';
import { Celo2TransactionsStrategy } from './celo2TransactionsStrategy';
import { CeloCitizenStrategy } from './celoCitizenStrategy';
import { CeloCommunityGuildStrategy } from './celoCommunityGuildStrategy';
import { CeloEventsPoapStrategy } from './celoEventsPoapStrategy';
import { CeloGenesisStrategy } from './celoGenesisStrategy';
import { CeloGovernanceGuardianStrategy } from './celoGovernanceGuardianStrategy';
import { CeloRegionalLeadStrategy } from './celoRegionalLeadStrategy';
import { CeloStewardsStrategy } from './celoStewardsStrategy';
import { CeloTransactionsStrategy } from './celoTransactionsStrategy';
import { CeloVotesStrategy } from './celoVotesStrategy';
import { EcoCreditsStrategy } from './ecoCreditsStrategy';
import { GitcoinDonationsStrategy } from './gitcoinDonationsStrategy';
import { GivethDonationsStrategy } from './givethDonationsStrategy';
import { GlodollarStrategy } from './glodollarStrategy';
import { GreenPillMemberStrategy } from './greenPillMemberStrategy';
import { ProofOfShipStrategy } from './proofOfShipStrategy';
import { ReFiDaoMemberStrategy } from './refiDaoMemberStrategy';
import { SelfVerificationStrategy } from './selfVerificationStrategy';
import { TalentScoreStrategy } from './talentScoreStrategy';



export class BadgeStrategyContext {
    static getBadgeStrategy(badgeName: string): BadgeStrategy {
        switch (badgeName.trim()) {

            case "Celo Genesis":
                return new CeloGenesisStrategy()
            case "L1 Transactions":
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
            case "ReFi DAO Member":
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
            default:
                throw new Error(`Badge strategy ${badgeName} not found`);
        }
    }


}
