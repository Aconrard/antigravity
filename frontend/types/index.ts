export interface JotFormSubmission {
  id: string;
  created_at: string;
  answers: {
    [key: string]: {
      name: string;
      text: string;
      answer: unknown;
      type?: string;
    };
  }; // JotForm specific answers structure
}

export interface ProcessedEncounter {
  submission_id: string;
  submission_date: string;
  course_number?: number;
  rotation_site?: string;
  student_name?: string;
  patient_age_yrs?: number;
  patient_age_months?: number;
  performed_interview?: string;
  performed_exam?: string;
  procedure_performed_airway?: string;
  airway_procedure?: string;
  airway_procedure_attempt?: string;
  performed_12_lead?: string;
  interpreted_12_lead?: string;
  ecg_interpreted?: string;
  procedure_performed_cardiac?: string;
  cardiac_procedure?: string;
  venous_access?: string;
  venous_procedure?: string;
  venous_attempts?: string | number;
  attempt_successful?: string;
  treatment_medication_performed?: string;
  administered_through?: string;
  primary_impression?: string;
  secondary_impression?: string;
  patient_complaint?: string;
  student_email?: string;
  rhythm?: string;

  // Computed flags and categories
  is_encounter: boolean;
  age_category: string;
  age_group_simple: 'Pediatric' | 'Adult' | 'Geriatric' | 'Unknown';
}

export interface SMCCompetency {
  name: string;
  minimum: number;
  requires_success_tracking: boolean;
}

export interface SMCRequirement extends SMCCompetency {
  count: number;
  successful_count?: number;
  percent_successful?: number;
  completed: boolean;
}

export interface StudentReport {
  student_name: string;
  course_number?: number;
  competencies: Record<string, SMCRequirement>;
  rotation_sites: Record<string, number>;
  age_by_site: Record<string, Record<string, number>>; // Site -> Age Category -> Count
  adult_pediatric_by_site: Record<string, Record<string, number>>;
  cohen_ccmc_pediatric: number;
}
