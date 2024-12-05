
import { BadgeStrategy } from './badgeStrategy';
import { CeloGenesisStrategy } from './celoGenesisStrategy';
import { CeloRegionalLeadStrategy } from './celoRegionalLeadStrategy';
import { CeloStewardsStrategy } from './celoStewardsStrategy';
import { CeloTransactionsStrategy } from './celoTransactionsStrategy';
import { CeloVotesStrategy } from './celoVotesStrategy';
import { GitcoinDonationsStrategy } from './gitcoinDonationsStrategy';
import { GivethDonationsStrategy } from './givethDonationsStrategy';
import { TalentScoreStrategy } from './talentScoreStrategy';



export class BadgeStrategyContext {
    static getBadgeStrategy(badgeName: string): BadgeStrategy {
        switch (badgeName) {

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
            default:
                throw new Error(`Badge strategy ${badgeName} not found`);
        }
    }


}