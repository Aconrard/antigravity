import { JotFormSubmission } from '@/types';

const HOSPITAL_SITE_QUESTION_ID = '210';

export function isExcludedField(name: string): boolean {
    if (!name) return true;

    const exactExclusions = ['submit', 'calculation', 'formSubmission'];
    if (exactExclusions.includes(name)) return true;

    const patternExclusions = ['input', 'divider', 'pagebreak', 'submit', 'calculation'];
    const lowerName = name.toLowerCase();

    return patternExclusions.some(pattern => lowerName.includes(pattern));
}

/**
 * Parses a JotForm date object or string into a standard mm-dd-yyyy format.
 */
export function parseJotFormDate(answer: unknown): string | null {
    if (!answer) return null;

    // Dictionary format: { year: '2023', month: '10', day: '25' }
    if (typeof answer === 'object' && answer !== null && 'year' in answer && 'month' in answer && 'day' in answer) {
        const d = answer as Record<string, string>;
        return `${d.month.toString().padStart(2, '0')}-${d.day.toString().padStart(2, '0')}-${d.year}`;
    }

    // String format
    if (typeof answer === 'string') {
        return answer.trim();
    }

    return null;
}

/**
 * Identifies if an answer is effectively blank.
 */
export function isBlankAnswer(answer: unknown, questionText?: string): boolean {
    if (answer === null || answer === undefined) return true;

    if (typeof answer === 'string') {
        if (answer.trim() === '') return true;
        if (questionText && answer.trim() === questionText.trim()) return true;
    }
    if (typeof answer === 'number' && isNaN(answer)) return true;

    // Arrays or objects that are empty
    if (Array.isArray(answer) && answer.length === 0) return true;
    if (typeof answer === 'object' && Object.keys(answer).length === 0) return true;

    return false;
}

/**
 * Extracts answers from the nested JotForm structure and flattens them.
 * Excludes fields based on specific patterns or specific names.
 */
export function extractAndFlattenSubmission(submission: JotFormSubmission): Record<string, unknown> {
    const flat: Record<string, unknown> = {
        id: submission.id,
        created_at: submission.created_at
    };

    const answers = submission.answers || {};

    for (const key in answers) {
        const answerObj = answers[key];
        if (!answerObj || !answerObj.name) continue;

        const fieldName = answerObj.name;
        const questionText = answerObj.text || '';

        if (isExcludedField(fieldName)) continue;

        let answerValue = answerObj.answer;

        if (answerObj.type === 'control_datetime') {
            answerValue = parseJotFormDate(answerValue);
        }

        if (isBlankAnswer(answerValue, questionText)) {
            flat[fieldName] = null;
        } else {
            flat[fieldName] = answerValue;
        }
    }

    if (flat['experienceSite'] === 'Clinical Site-Hospital/Clinic') {
        const hSite = answers[HOSPITAL_SITE_QUESTION_ID]?.answer;
        if (hSite) flat['experienceSite'] += ` - ${hSite}`;
    }

    return flat;
}
