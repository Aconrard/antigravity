import { generateStudentReport } from '../utils/report';
import { ProcessedEncounter } from '../types';

describe('Edge Case Data Analytics', () => {

    it('should correctly isolate OB patients via secondary string matching', () => {
        const studentName = 'J. Doe';
        const encounters: Partial<ProcessedEncounter>[] = [
            {
                submission_id: '1',
                is_encounter: true,
                student_name: studentName,
                primary_impression: 'OB-Childbirth', // explicit OB
                rotation_site: 'Ambulance'
            },
            {
                submission_id: '2',
                is_encounter: true,
                student_name: studentName,
                secondary_impression: 'Some secondary OB-Pregnancy problem', // substring OB
                rotation_site: 'Clinic'
            }
        ];

        const report = generateStudentReport(studentName, encounters as ProcessedEncounter[]);
        expect(report.competencies['Obstetrical Patients'].count).toBe(2);
    });

    it('should correctly ignore general patients in the Operating Room / Bioskills lab', () => {
        const studentName = 'R. Surgeon';
        const encounters: Partial<ProcessedEncounter>[] = [
            {
                submission_id: '3',
                is_encounter: true,
                student_name: studentName,
                primary_impression: 'Trauma-Chest', // Normally counted
                rotation_site: 'Bioskills/Operating Room', // Bioskills blacklisted rotation
            }
        ];

        const report = generateStudentReport(studentName, encounters as ProcessedEncounter[]);
        expect(report.competencies['Trauma Patients'].count).toBe(0); // Should be 0, blocked
        // Intubations and other skills could still occur, but Patient impression mapping shouldn't
    });

});
