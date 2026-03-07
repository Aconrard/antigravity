import { ProcessedEncounter } from '@/types';

export function removeEmptyColumns(submissions: Record<string, unknown>[]): Record<string, unknown>[] {
    if (submissions.length === 0) return [];

    // Single pass to find all keys that have at least one valid value
    const nonEmptyKeys = new Set<string>();

    for (const sub of submissions) {
        for (const key in sub) {
            if (!nonEmptyKeys.has(key)) {
                const val = sub[key];
                const isEmpty = val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val));
                if (!isEmpty) {
                    nonEmptyKeys.add(key);
                }
            }
        }
    }

    // Secondary pass to rebuild objects containing only valid keys
    return submissions.map(sub => {
        const cleaned: Record<string, unknown> = {};
        for (const key of nonEmptyKeys) {
            if (key in sub) {
                cleaned[key] = sub[key];
            }
        }
        return cleaned;
    });
}

export function filterByDateRange(submissions: Record<string, unknown>[], startStr?: string, endStr?: string): Record<string, unknown>[] {
    if (!submissions || submissions.length === 0) return [];
    if (!startStr && !endStr) return submissions;

    const start = startStr ? new Date(startStr).getTime() : 0;
    const end = endStr ? new Date(endStr).getTime() : Infinity;

    return submissions.filter(sub => {
        if (!sub['created_at']) return false;
        const current = new Date(sub['created_at'] as string).getTime();
        if (isNaN(current)) {
            console.warn(`Encounter id ${sub['id'] || 'unknown'} has an unparseable created_at date. Dropping it from report.`);
            return false;
        }

        return current >= start && current <= end;
    });
}

export const COLUMNS_MAP: Record<string, string> = {
    'experienceSite': 'rotation_site',
    'patientHistoryPerformed': 'performed_interview',
    'patientExamPerformed': 'performed_exam',
    'patientAgeYear': 'patient_age_yrs',
    'patientAgeYears': 'patient_age_yrs',
    'PatientAgeMonth': 'patient_age_months',
    'patientAgeMonths': 'patient_age_months',
    'performedAirway': 'procedure_performed_airway',
    'procedureAirway': 'airway_procedure',
    'AirwaySuccessful': 'airway_procedure_attempt',
    'PerformedTwelveLead': 'performed_12_lead',
    'InterpretedTwelveLead': 'interpreted_12_lead',
    'rhythmInterpreted': 'ecg_interpreted',
    'PerformedCardiacProcedures': 'procedure_performed_cardiac',
    'CardiacProcedures': 'cardiac_procedure',
    'VenousPerformed': 'venous_access',
    'VenousProcedure': 'venous_procedure',
    'VenousAttempts': 'venous_attempts',
    'VenousSuccess': 'attempt_successful',
    'MedicationPerformed': 'treatment_medication_performed',
    'routeAdministered': 'administered_through',
    'primaryImpression': 'primary_impression',
    'secondaryImpression': 'secondary_impression',
    'patientComplaint': 'patient_complaint',
    'studentEmail': 'student_email',
    'created_at': 'submission_date'
};

export function renameColumns(submissions: Record<string, unknown>[]): Record<string, unknown>[] {
    return submissions.map(sub => {
        const renamed: Record<string, unknown> = {};
        for (const [oldKey, value] of Object.entries(sub)) {
            const newKey = COLUMNS_MAP[oldKey] || oldKey;
            // Don't overwrite if multiple keys map to same destination and we already have a value.
            // e.g., patientAgeYear vs patientAgeYears. We take the first non-null one.
            if (renamed[newKey] !== undefined && (value === null || value === undefined || value === '')) {
                continue;
            }
            renamed[newKey] = value;
        }
        return renamed;
    });
}

export function extractCourseNumber(rawProgram: unknown): number | undefined {
    if (!rawProgram || typeof rawProgram !== 'string') return undefined;

    // Extract the number part from strings like "#1354", "Course #1234", "1354"
    const match = rawProgram.match(/#(\d+)/) || rawProgram.match(/(\d+)/);
    if (match && match[1]) {
        return parseInt(match[1], 10);
    }
    return undefined;
}

export function extractStudentName(rawStudent: unknown): string {
    if (!rawStudent) return 'Unknown Student';

    if (typeof rawStudent === 'string') {
        return rawStudent.trim();
    }
    if (typeof rawStudent === 'object' && rawStudent !== null) {
        const first = (rawStudent as { first?: string }).first || '';
        const last = (rawStudent as { last?: string }).last || '';
        return `${first} ${last}`.trim() || 'Unknown Student';
    }
    return 'Unknown Student';
}

export function parseNumericAge(rawAge: unknown): number | undefined {
    if (rawAge === null || rawAge === undefined || rawAge === '') return undefined;

    const parsed = Number(rawAge);
    if (!isNaN(parsed)) return parsed;

    // if string has non-numeric, extract digits
    if (typeof rawAge === 'string') {
        const match = rawAge.match(/(\d+)/);
        if (match && match[1]) return parseInt(match[1], 10);
    }
    return undefined;
}

/**
 * Takes a single raw API submission record (after flatten and rename)
 * and maps/casts it into the ProcessedEncounter type structure.
 */
export function transformSubmissionData(raw: Record<string, unknown>): ProcessedEncounter {
    const course_number = extractCourseNumber(raw['paramedicProgram'] || raw['paramedicProgram405']);
    const student_name = extractStudentName(raw['paramedicStudent'] || raw['paramedicStudent405']);
    const patient_age_yrs = parseNumericAge(raw['patient_age_yrs']);
    const patient_age_months = parseNumericAge(raw['patient_age_months']);

    let venous_access = raw['venous_access'];
    if (venous_access === 'Intravenous (IV) with Blood Draw') {
        venous_access = 'Intravenous (IV)';
    }

    let administered_through = raw['administered_through'];
    if (administered_through === 'IV Bolus (IVB)') {
        administered_through = 'IV/IO Bolus (IVB)';
    } else if (administered_through === 'Piggyback') {
        administered_through = 'IV Drip (IVD)';
    }

    const performed_interview = raw['performed_interview'];
    const performed_exam = raw['performed_exam'];

    // Patient encounter rule: played both performed_interview AND performed_exam
    const is_encounter = (performed_interview === 'Yes' && performed_exam === 'Yes');

    let age_category = 'Unknown';
    let age_group_simple: 'Pediatric' | 'Adult' | 'Geriatric' | 'Unknown' = 'Unknown';

    if (patient_age_yrs !== undefined || patient_age_months !== undefined) {
        const y = patient_age_yrs || 0;
        const m = patient_age_months || 0;

        if (y === 0 && m === 0) age_category = 'Newborn';
        else if (y === 0 && m >= 1 && m <= 12) age_category = 'Infant';
        // Toddler: 1-2 years OR 13-35 months.
        // If y is provided: 1 or 2 years -> Toddler
        // If m is provided and y is 0 (or not correctly calculated): 13-35 months -> Toddler
        else if (y === 1 || y === 2 || (y === 0 && m >= 13 && m <= 35)) age_category = 'Toddler';
        else if (y >= 3 && y <= 5) age_category = 'Preschool';
        else if (y >= 6 && y <= 12) age_category = 'Preadolescent';
        else if (y >= 13 && y <= 18) age_category = 'Adolescent';
        else if (y >= 19 && y <= 65) age_category = 'Adult';
        else if (y > 65) age_category = 'Geriatric';

        if (['Newborn', 'Infant', 'Toddler', 'Preschool', 'Preadolescent', 'Adolescent'].includes(age_category)) {
            age_group_simple = 'Pediatric';
        } else if (age_category === 'Adult') {
            age_group_simple = 'Adult';
        } else if (age_category === 'Geriatric') {
            age_group_simple = 'Geriatric';
        }
    }

    const processed = {
        ...raw,
        submission_id: String(raw.id || ''),
        submission_date: String(raw.submission_date || raw.created_at || ''),
        course_number,
        student_name,
        patient_age_yrs,
        patient_age_months,
        venous_access: venous_access as string | undefined,
        administered_through: administered_through as string | undefined,
        is_encounter,
        age_category,
        age_group_simple
    } as ProcessedEncounter;

    return processed;
}
