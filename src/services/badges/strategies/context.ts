
import { BadgeStrategy } from './badgeStrategy';
import { CeloGenesisStrategy } from './celoGenesisStrategy';



export class BadgeStrategyContext {
    static getBadgeStrategy(badgeName: string): BadgeStrategy {
        switch (badgeName) {

            case "Celo Genesis":
                return new CeloGenesisStrategy()
            default:
                throw new Error(`Badge strategy ${badgeName} not found`);
        }
    }


}