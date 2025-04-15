import { BaseBadgeStrategy } from "./badgeStrategy";

export class SelfVerificationStrategy extends BaseBadgeStrategy {

    async getValue(eoas: string[]): Promise<boolean> {
        return false;
    }
}