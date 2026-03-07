import { generateStudentReport } from '../utils/report';
import { ProcessedEncounter } from '../types';

describe('Report Generation utilities', () => {

    it('should correctly count demographics and track completion status', () => {
        const studentName = 'Test Student';

        // Mock encounters
        const encounters: ProcessedEncounter[] = [
            // Valid adult encounter with trauma
            {
                submission_id: '1',
                submission_date: '2023-01-01',
                course_number: 101,
                student_name: studentName,
                is_encounter: true,
                age_category: 'Adult',
                age_group_simple: 'Adult',
                rotation_site: 'Clinical Site-Hospital/Clinic',
                performed_interview: 'Yes',
                performed_exam: 'Yes',
                primary_impression: 'Trauma-Head',
                venous_access: 'Intravenous (IV)',
                attempt_successful: 'Yes',
                rhythm: 'Atrial Fibrillation'
            },
            // Valid pediatric encounter with IO 
            {
                submission_id: '2',
                submission_date: '2023-01-02',
                course_number: 101,
                student_name: studentName,
                is_encounter: true,
                age_category: 'Preschool',
                age_group_simple: 'Pediatric',
                rotation_site: 'Ambulance Rotation',
                performed_interview: 'Yes',
                performed_exam: 'Yes',
                primary_impression: 'Fever',
                venous_procedure: 'Intraosseous (IO)',
                rhythm: 'Regular Sinus Rhythm' // Should not count towards rhythms
            },
            // Invalid encounter (no exam)
            {
                submission_id: '3',
                submission_date: '2023-01-03',
                course_number: 101,
                student_name: studentName,
                is_encounter: false,
                age_category: 'Adult',
                age_group_simple: 'Adult',
                rotation_site: 'Ambulance Rotation',
                performed_interview: 'Yes',
                performed_exam: '',
                primary_impression: 'Chest Pain',
                cardiac_procedure: 'Defibrillation'
            }
        ];

        const report = generateStudentReport(studentName, encounters);

        expect(report.student_name).toBe(studentName);

        // Test Demographics
        expect(report.competencies['Adult'].count).toBe(1);
        expect(report.competencies['Pediatric'].count).toBe(1);
        expect(report.competencies['Preschool'].count).toBe(1);

        // Test Impression Classification
        expect(report.competencies['Trauma Patients'].count).toBe(1); // From encounter 1
        expect(report.competencies['Cardiac Patients'].count).toBe(0); // From encounter 3 (ignored because is_encounter=false)

        // Test Skill Counting
        expect(report.competencies['Intravenous (IV)'].count).toBe(1);
        expect(report.competencies['Intravenous (IV)'].successful_count).toBe(1);
        expect(report.competencies['Intraosseous (IO)'].count).toBe(1);
        expect(report.competencies['Defibrillation'].count).toBe(1); // Skills track even on invalid encounters

        // Test Rotation Sites
        expect(report.rotation_sites['Clinical Site-Hospital/Clinic']).toBe(1);
        expect(report.rotation_sites['Ambulance Rotation']).toBe(1);

        // Test Rhythms (No RSR)
        expect(report.competencies['Rhythms Interpreted (No RSR)'].count).toBe(1); // Atrial Fib counts, RSR ignored
    });

    it('should cleanly handle empty sets', () => {
        const report = generateStudentReport('Empty Student', []);

        // Check structural integrity on 0 items
        expect(report.competencies['Adult'].count).toBe(0);
        expect(report.competencies['Pediatric'].count).toBe(0);
        expect(report.cohen_ccmc_pediatric).toBe(0);
        expect(Object.keys(report.rotation_sites).length).toBe(0);
    });
});
