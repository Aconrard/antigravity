import { isExcludedField, parseJotFormDate, isBlankAnswer, extractAndFlattenSubmission } from '../utils/extract';
import { JotFormSubmission } from '../types';

describe('JotForm Extraction Utilities', () => {

    describe('isExcludedField', () => {
        it('should exclude specific field names', () => {
            expect(isExcludedField('submit')).toBe(true);
            expect(isExcludedField('calculation')).toBe(true);
            expect(isExcludedField('formSubmission')).toBe(true);
        });

        it('should exclude based on patterns', () => {
            expect(isExcludedField('some_input_field')).toBe(true);
            expect(isExcludedField('pageBreak_12')).toBe(true);
            expect(isExcludedField('divider_line')).toBe(true);
        });

        it('should not exclude valid data fields', () => {
            expect(isExcludedField('patientAge')).toBe(false);
            expect(isExcludedField('studentName')).toBe(false);
            expect(isExcludedField('experienceSite')).toBe(false);
        });
    });

    describe('parseJotFormDate', () => {
        it('should parse dictionary format correctly', () => {
            expect(parseJotFormDate({ year: '2023', month: '5', day: '4' })).toBe('05-04-2023');
            expect(parseJotFormDate({ year: '2023', month: '10', day: '15' })).toBe('10-15-2023');
        });

        it('should parse string format correctly', () => {
            expect(parseJotFormDate('05-20-2023')).toBe('05-20-2023');
        });

        it('should return null for invalid date structures', () => {
            expect(parseJotFormDate(null)).toBeNull();
            expect(parseJotFormDate({})).toBeNull();
        });
    });

    describe('isBlankAnswer', () => {
        it('should identify basic blank values', () => {
            expect(isBlankAnswer(null, 'Question?')).toBe(true);
            expect(isBlankAnswer(undefined, 'Question?')).toBe(true);
            expect(isBlankAnswer('', 'Question?')).toBe(true);
            expect(isBlankAnswer('   ', 'Question?')).toBe(true);
        });

        it('should identify empty objects and arrays', () => {
            expect(isBlankAnswer({}, 'Question?')).toBe(true);
            expect(isBlankAnswer([], 'Question?')).toBe(true);
        });

        it('should identify when answer equals question text', () => {
            expect(isBlankAnswer('What is your name?', 'What is your name?')).toBe(true);
        });

        it('should not flag valid answers as blank', () => {
            expect(isBlankAnswer('John Doe', 'What is your name?')).toBe(false);
            expect(isBlankAnswer(0, 'Age?')).toBe(false); // 0 is valid
            expect(isBlankAnswer({ a: 1 }, 'Object?')).toBe(false);
        });
    });

    describe('extractAndFlattenSubmission', () => {
        it('should correctly flatten API structure and exclude fields', () => {
            const mockSubmission: JotFormSubmission = {
                id: '12345',
                created_at: '2023-10-01 12:00:00',
                answers: {
                    '1': { name: 'studentName', text: 'Student Name', answer: 'Jane Doe' },
                    '2': { name: 'submit', text: 'Submit', answer: 'Submit' }, // Excluded
                    '3': { name: 'patientAge', text: 'Patient Age', answer: '25' },
                    '4': { name: 'blankField', text: 'Blank Field', answer: '' }, // Should be null
                    '5': { name: 'encounterDate', text: 'Date', answer: { year: '2023', month: '1', day: '2' }, type: 'control_datetime' }
                }
            };

            const flattened = extractAndFlattenSubmission(mockSubmission);

            expect(flattened).toEqual({
                id: '12345',
                created_at: '2023-10-01 12:00:00',
                studentName: 'Jane Doe',
                patientAge: '25',
                blankField: null,
                encounterDate: '01-02-2023'
            });

            expect(flattened.submit).toBeUndefined();
        });
    });
});
