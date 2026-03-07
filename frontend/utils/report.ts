import { ProcessedEncounter, SMCCompetency, SMCRequirement, StudentReport } from '@/types';

export const REQUIRED_COMPETENCIES: SMCCompetency[] = [
    { name: 'Newborn', minimum: 2, requires_success_tracking: false },
    { name: 'Infant', minimum: 2, requires_success_tracking: false },
    { name: 'Toddler', minimum: 2, requires_success_tracking: false },
    { name: 'Preschool', minimum: 2, requires_success_tracking: false },
    { name: 'Preadolescent', minimum: 2, requires_success_tracking: false },
    { name: 'Adolescent', minimum: 2, requires_success_tracking: false },
    { name: 'Pediatric', minimum: 40, requires_success_tracking: false },
    { name: 'Adult', minimum: 60, requires_success_tracking: false },
    { name: 'Geriatric', minimum: 18, requires_success_tracking: false },
    { name: 'Intravenous (IV)', minimum: 27, requires_success_tracking: true },
    { name: 'Intraosseous (IO)', minimum: 6, requires_success_tracking: false },
    { name: 'IV/IO Bolus (IVB)', minimum: 12, requires_success_tracking: false },
    { name: 'IV Drip (IVD)', minimum: 4, requires_success_tracking: false },
    { name: 'Intramuscular (IM)', minimum: 4, requires_success_tracking: false },
    { name: 'Manual Ventilation (PPV w/BVM)', minimum: 14, requires_success_tracking: false },
    { name: 'Orotracheal Intubation', minimum: 12, requires_success_tracking: true },
    { name: 'Endotracheal Suctioning', minimum: 4, requires_success_tracking: false },
    { name: 'Foreign Body Removal (Magill Forceps)', minimum: 4, requires_success_tracking: false },
    { name: 'Cricothyrotomy', minimum: 4, requires_success_tracking: false },
    { name: 'Supraglottic Airway', minimum: 12, requires_success_tracking: false },
    { name: 'Needle Decompression/Thoracotomy', minimum: 4, requires_success_tracking: false },
    { name: 'Synchronized Cardioversion', minimum: 4, requires_success_tracking: false },
    { name: 'Defibrillation', minimum: 4, requires_success_tracking: false },
    { name: 'Transcutaneous Pacing', minimum: 4, requires_success_tracking: false },
    { name: 'Chest Compressions', minimum: 4, requires_success_tracking: false },
    { name: 'Rhythms Interpreted (No RSR)', minimum: 16, requires_success_tracking: false },
    { name: 'Cardiac Arrest Patients', minimum: 5, requires_success_tracking: false },
    { name: 'Trauma Patients', minimum: 27, requires_success_tracking: false },
    { name: 'Psych/Behavioral Patients', minimum: 18, requires_success_tracking: false },
    { name: 'Obstetrical Patients', minimum: 6, requires_success_tracking: false },
    { name: 'Distressed Neonate Patients', minimum: 4, requires_success_tracking: false },
    { name: 'Cardiac Patients', minimum: 18, requires_success_tracking: false },
    { name: 'Neuro Patients', minimum: 12, requires_success_tracking: false },
    { name: 'Respiratory Patients', minimum: 12, requires_success_tracking: false },
    { name: 'Other Patients', minimum: 18, requires_success_tracking: false }
];

const TRAUMA_IMPRESSIONS = ['Trauma-Abdominal', 'Trauma-Chest', 'Trauma-Extremities', 'Trauma-Head', 'Trauma-Multisystem', 'Trauma-Neck/Back', 'Trauma-Unspecified'];
const PSYCH_IMPRESSIONS = ['Mental Health/Psychiatric', 'Behavioral/Psychiatric'];
const CARDIAC_IMPRESSIONS = ['Cardiac-Acute Coronary Syndrome', 'Cardiac-Other', 'Chest Pain', 'Palpitations'];
const NEURO_IMPRESSIONS = ['Altered Mental Status', 'Syncope/Fainting', 'Neuro-Seizure', 'Neuro-Stroke/CVA', 'Neuro-TIA', 'Neuro-Other', 'AMS', 'Change in Responsiveness', 'Dizziness', 'Weakness', 'Headache/Blurred Vision'];
const RESPIRATORY_IMPRESSIONS = ['Smoke Inhalation', 'Respiratory Emergency', 'Choking', 'Breathing Problem'];
const OTHER_IMPRESSIONS = [
    'Abdominal Pain/Problems', 'Allergic Reaction/Anaphylaxis', 'Burns', 'Diabetic Emergency',
    'Electrocution', 'GI Bleed', 'Healthy Screening/Physical', 'Hypovolemic/Shock', 'ObviousDeath',
    'Overdose/Poisoning', 'Sepsis/Infection', 'Stings/Envenomation', 'Other-Not Specified',
    'Bleeding', 'Device/Equipment Problem', 'Fever', 'Malaise', 'Pain', 'Rash/Itching',
    'Abdominal Pain', 'Diarrhea', 'Drainage/Discharge', 'Mass/Lesion', 'Nausea/Vomitin', 'Wound' // Intentional typo matching JotForm
];

const EXCLUDED_SITE_OR = 'Bioskills/Operating Room';
const SITE_LAB_SESSION = 'Lab Session';
const RHYTHM_RSR = 'Regular Sinus Rhythm';

// Helper to strictly match impression tokens against predefined lists
const strictMatch = (arr: string[], ...vals: (string | undefined)[]) => {
    for (const val of vals) {
        if (!val) continue;
        // For comma separated or single strings, check exact tokens
        const tokens = String(val).split(',').map(x => x.trim());
        if (tokens.some(t => arr.includes(t))) return true;
    }
    return false;
};

export function generateStudentReport(studentName: string, encounters: ProcessedEncounter[]): StudentReport {

    const competencies: Record<string, SMCRequirement> = {};
    REQUIRED_COMPETENCIES.forEach(comp => {
        competencies[comp.name] = {
            ...comp,
            count: 0,
            successful_count: comp.requires_success_tracking ? 0 : undefined,
            percent_successful: comp.requires_success_tracking ? 0 : undefined,
            completed: false
        };
    });

    const rotation_sites: Record<string, number> = {};
    const age_by_site: Record<string, Record<string, number>> = {};
    const adult_pediatric_by_site: Record<string, Record<string, number>> = {};
    let cohen_ccmc_pediatric = 0;
    let course_number: number | undefined = undefined;

    // Filter ONLY encounters for this particular student
    const studentEncounters = encounters.filter(e => e.student_name === studentName);

    studentEncounters.forEach(e => {
        if (!course_number && e.course_number) {
            course_number = e.course_number;
        }

        const site = e.rotation_site || 'Unknown';
        const ageCat = e.age_category || 'Unknown';
        const simpleCat = e.age_group_simple || 'Unknown';

        if (e.is_encounter) {
            if (!rotation_sites[site]) rotation_sites[site] = 0;
            rotation_sites[site]++;

            if (!age_by_site[site]) age_by_site[site] = {};
            if (!age_by_site[site][ageCat]) age_by_site[site][ageCat] = 0;
            age_by_site[site][ageCat]++;

            if (!adult_pediatric_by_site[site]) adult_pediatric_by_site[site] = {};
            if (!adult_pediatric_by_site[site][simpleCat]) adult_pediatric_by_site[site][simpleCat] = 0;
            adult_pediatric_by_site[site][simpleCat]++;

            if (competencies[ageCat]) competencies[ageCat].count++;
            if (simpleCat === 'Pediatric') competencies['Pediatric'].count++;

            // Patient type logic
            const p = e.primary_impression || '';
            const s = e.secondary_impression || '';

            const isObstetrical = strictMatch(['OB-Pregnancy Complications', 'OB-GYN', 'OB-Childbirth', 'OB-Other'], p, s) || String(p).includes('OB-') || String(s).includes('OB-');
            const isCardiacArrest = String(p).includes('Cardiac-Arrest') || String(s).includes('Cardiac-Arrest');

            if (site !== EXCLUDED_SITE_OR) {
                if (strictMatch(TRAUMA_IMPRESSIONS, p, s)) competencies['Trauma Patients'].count++;
                if (strictMatch(PSYCH_IMPRESSIONS, p, s)) competencies['Psych/Behavioral Patients'].count++;
                if (isObstetrical) competencies['Obstetrical Patients'].count++;
                if (isCardiacArrest) competencies['Cardiac Arrest Patients'].count++;
                if (strictMatch(CARDIAC_IMPRESSIONS, p, s)) competencies['Cardiac Patients'].count++;
                if (strictMatch(NEURO_IMPRESSIONS, p, s)) competencies['Neuro Patients'].count++;
                if (strictMatch(RESPIRATORY_IMPRESSIONS, p, s)) competencies['Respiratory Patients'].count++;
                if (strictMatch(OTHER_IMPRESSIONS, p, s)) competencies['Other Patients'].count++;

                // Distressed neonate
                // Per spec: 0yrs 0mo automatically routes into Distressed Neonate.
                // This overlaps unconditionally with the `Newborn` demographic.
                if (e.patient_age_yrs === 0 && e.patient_age_months === 0) {
                    competencies['Distressed Neonate Patients'].count++;
                }
            }

            // Cohen CCMC Pediatric logic
            if ((site.includes('Cohen') || site.includes('CCMC')) && simpleCat === 'Pediatric') {
                cohen_ccmc_pediatric++;
            }
        } // CLOSE IS_ENCOUNTER

        // Skills (not encounter scoped)
        const v_proc = e.venous_procedure || e.venous_access;
        if (v_proc === 'Intravenous (IV)' || v_proc === 'Intravenous (IV) with Blood Draw') {
            competencies['Intravenous (IV)'].count++;
            if (e.attempt_successful === 'Yes') {
                competencies['Intravenous (IV)'].successful_count!++;
            }
        }
        if (v_proc === 'Intraosseous (IO)') competencies['Intraosseous (IO)'].count++;

        if (e.administered_through === 'IV/IO Bolus (IVB)') {
            competencies['IV/IO Bolus (IVB)'].count++;
        }
        if (e.administered_through === 'IV Drip (IVD)') competencies['IV Drip (IVD)'].count++;
        if (e.administered_through === 'Intramuscular (IM)') competencies['Intramuscular (IM)'].count++;

        // Airway and ventilation
        if (e.airway_procedure === 'Manual Ventilation (PPV w/BVM)') competencies['Manual Ventilation (PPV w/BVM)'].count++;
        if (e.airway_procedure === 'Orotracheal Intubation') {
            competencies['Orotracheal Intubation'].count++;
            if (e.airway_procedure_attempt === 'Yes') {
                competencies['Orotracheal Intubation'].successful_count!++;
            }
        }
        if (e.airway_procedure === 'Endotracheal Suctioning') competencies['Endotracheal Suctioning'].count++;
        if (e.airway_procedure === 'Foreign Body Removal (Magill Forceps)') competencies['Foreign Body Removal (Magill Forceps)'].count++;
        if (e.airway_procedure === 'Cricothyrotomy') competencies['Cricothyrotomy'].count++;
        if (e.airway_procedure === 'Supraglottic Airway') competencies['Supraglottic Airway'].count++;

        // Needle Decompression can be logged as either an Airway or Cardiac procedure depending on iteration
        // The OR operator `||` intentionally merges these logically so a single encounter only increments the counter once
        if (e.airway_procedure === 'Needle Decompression/Thoracotomy' || e.cardiac_procedure === 'Needle Decompression/Thoracotomy') {
            competencies['Needle Decompression/Thoracotomy'].count++;
        }

        // Cardiac procedures
        const rhythm = e.rhythm || e.ecg_interpreted;
        if (rhythm && rhythm !== RHYTHM_RSR && rhythm !== 'Yes' && rhythm !== 'No' && site !== SITE_LAB_SESSION) {
            competencies['Rhythms Interpreted (No RSR)'].count++;
        }

        if (e.cardiac_procedure === 'Synchronized Cardioversion') competencies['Synchronized Cardioversion'].count++;
        if (e.cardiac_procedure === 'Defibrillation') competencies['Defibrillation'].count++;
        if (e.cardiac_procedure === 'Transcutaneous Pacing') competencies['Transcutaneous Pacing'].count++;
        if (e.cardiac_procedure === 'Chest Compressions') competencies['Chest Compressions'].count++;
    });

    // Calculate percentages and completion status
    Object.values(competencies).forEach(comp => {
        if (comp.requires_success_tracking) {
            if (comp.count > 0) {
                comp.percent_successful = Math.round((comp.successful_count! / comp.count) * 100);
            }
            comp.completed = comp.successful_count! >= comp.minimum;
        } else {
            comp.completed = comp.count >= comp.minimum;
        }
    });

    return {
        student_name: studentName,
        course_number,
        competencies,
        rotation_sites,
        age_by_site,
        adult_pediatric_by_site,
        cohen_ccmc_pediatric
    };
}
