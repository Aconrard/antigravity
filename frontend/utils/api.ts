import { JotFormSubmission } from '@/types';

// API routes are handled securely server-side
const INTERNAL_API_URL = '/api/submissions';
const BATCH_SIZE = 750;
const DELAY_MS = 500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetches all submissions from the JotForm API with batching and delay to avoid rate limits.
 */
export async function fetchAllSubmissions(
    onProgress?: (totalFetched: number, batchSize: number) => void
): Promise<JotFormSubmission[]> {
    const allSubmissions: JotFormSubmission[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        const url = `${INTERNAL_API_URL}?limit=${BATCH_SIZE}&offset=${offset}&orderby=created_at`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`JotForm API HTTP error: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.responseCode !== 200) {
                throw new Error(result.message || 'JotForm API returned an error code');
            }

            const submissions = (result.content || []) as JotFormSubmission[];

            if (submissions.length === 0) {
                hasMore = false;
                break;
            }

            allSubmissions.push(...submissions);
            offset += BATCH_SIZE;

            if (onProgress) {
                onProgress(allSubmissions.length, submissions.length);
            }

            if (submissions.length < BATCH_SIZE) {
                hasMore = false; // Last batch
            } else {
                await delay(DELAY_MS); // Wait before next batch completely
            }

        } catch (error) {
            console.error('Failed to fetch JotForm submissions in batch:', error);
            throw error;
        }
    }

    return allSubmissions;
}
