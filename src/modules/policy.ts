import { CronJob } from 'cron';
import { Base, Initializable } from '../base';
import Policies from '../mongodb/models/Policies';
import { NegativeCache } from '../utils/negativeCache';

export class PolicyModule extends Base implements Initializable<never> {
    private cache: NegativeCache<string> = new NegativeCache();

    async setMessageContentOptOutStatus(userId: string, optOut: boolean) {
        if (optOut) {
            this.cache.invalidateValue(userId);
        } else {
            this.cache.store(userId);
        }

        await Policies.findOneAndUpdate({
            userId
        }, {
            $set: {
                messageContent: optOut
            }
        }, {
            upsert: true
        });
    }

    async hasUserOptedOutOfMessageContent(userId: string): Promise<boolean> {
        if (this.cache.isnt(userId)) return false;

        const result = await Policies.findOne({ userId });

        if (!result) {
            this.cache.store(userId);
            return false;
        }

        if (result.messageContent) {
            this.cache.invalidateValue(userId);
        } else {
            this.cache.store(userId);
        }
        
        return result.messageContent;
    }

    initialize() {
        new CronJob('0 * * * *', this.cleanup.bind(this), null, true);

        return true;
    }

    cleanup() {
        this.cache.invalidate();
    }
}