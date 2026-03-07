import { removeEmptyColumns, filterByDateRange, transformSubmissionData, renameColumns } from '../utils/transform';

describe('Transform Utilities', () => {
    describe('removeEmptyColumns', () => {
        it('should remove columns that are empty across all submissions', () => {
            const submissions = [
                { id: '1', A: 'value', B: null, C: '' },
                { id: '2', A: 'value2', B: undefined, C: 'not empty' }
            ];

            const cleaned = removeEmptyColumns(submissions);

            expect(cleaned[0]).not.toHaveProperty('B');
            expect(cleaned[1]).not.toHaveProperty('B');

            expect(cleaned[0]).toHaveProperty('A');
            expect(cleaned[0]).toHaveProperty('C'); // C is not empty in id:2, so kept for all
        });
    });

    describe('filterByDateRange', () => {
        it('should correctly filter dates', () => {
            const submissions = [
                { id: '1', created_at: '2023-10-01' },
                { id: '2', created_at: '2023-10-15' },
                { id: '3', created_at: '2023-11-01' }
            ];

            const filtered = filterByDateRange(submissions, '2023-10-10', '2023-10-20');
            expect(filtered.length).toBe(1);
            expect(filtered[0].id).toBe('2');
        });
    });

    describe('transformSubmissionData', () => {
        it('should correctly transform all required fields', () => {
            const raw = {
                id: '123',
                created_at: '2023-10-01',
                paramedicProgram405: 'Course #1234',
                paramedicStudent405: { first: 'John', last: 'Doe' },
                patientAgeYear: '25',
                venous_access: 'Intravenous (IV) with Blood Draw',
                administered_through: 'Piggyback',
                patientHistoryPerformed: 'Yes',
                patientExamPerformed: 'Yes'
            };

            const renamed = renameColumns([raw])[0];
            const result = transformSubmissionData(renamed);

            expect(result.course_number).toBe(1234);
            expect(result.student_name).toBe('John Doe');
            expect(result.patient_age_yrs).toBe(25);
            expect(result.age_category).toBe('Adult');
            expect(result.age_group_simple).toBe('Adult');
            expect(result.venous_access).toBe('Intravenous (IV)');
            expect(result.administered_through).toBe('IV Drip (IVD)');
            expect(result.is_encounter).toBe(true);
            expect(result.performed_interview).toBe('Yes');
        });

        it('should properly handle pediatric age categorization', () => {
            const raw = {
                patientAgeYear: '0',
                PatientAgeMonth: '6',
            };

            const renamed = renameColumns([raw])[0];
            const result = transformSubmissionData(renamed);
            expect(result.age_category).toBe('Infant');
            expect(result.age_group_simple).toBe('Pediatric');
        });

        it('should properly handle geriatric age categorization', () => {
            const raw = {
                patientAgeYear: '68',
            };

            const renamed = renameColumns([raw])[0];
            const result = transformSubmissionData(renamed);
            expect(result.age_category).toBe('Geriatric');
            expect(result.age_group_simple).toBe('Geriatric');
        });
    });
});
