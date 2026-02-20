import { sendMarketingEmail } from './email';

export interface CampaignBatchOptions {
    batchSize?: number;
    delayMs?: number;
}

export class MarketingService {
    /**
     * Sends a marketing campaign to a list of recipients in controlled batches.
     */
    static async sendCampaign(
        recipients: { email: string; name?: string }[],
        campaignData: {
            subject: string;
            title: string;
            body: string;
            ctaLink?: string;
            ctaText?: string;
            products?: any[];
            showStock?: boolean;
            couponCode?: string;
            couponDiscount?: string;
        },
        options: CampaignBatchOptions = {}
    ) {
        const { batchSize = 50, delayMs = 1000 } = options;

        const results = {
            total: recipients.length,
            sent: 0,
            failed: 0
        };

        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);

            const batchResults = await Promise.all(
                batch.map(async (recipient) => {
                    try {
                        const result = await sendMarketingEmail(
                            recipient.email,
                            campaignData.subject,
                            campaignData.title,
                            campaignData.body,
                            campaignData.ctaLink,
                            campaignData.ctaText,
                            campaignData.products || [],
                            !!campaignData.showStock,
                            recipient.name,
                            campaignData.couponCode,
                            campaignData.couponDiscount
                        );
                        return result?.success || false;
                    } catch (error) {
                        console.error(`Failed to send email to ${recipient.email}:`, error);
                        return false;
                    }
                })
            );

            batchResults.forEach(success => {
                if (success) results.sent++;
                else results.failed++;
            });

            // Delay between batches to respect SMTP rate limits
            if (i + batchSize < recipients.length) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        return results;
    }
}
