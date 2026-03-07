'use client';

import React, { useState, useMemo } from 'react';
import { fetchAllSubmissions } from '@/utils/api';
import { extractAndFlattenSubmission } from '@/utils/extract';
import { transformSubmissionData, removeEmptyColumns, filterByDateRange, renameColumns } from '@/utils/transform';
import { generateStudentReport } from '@/utils/report';
import { ProcessedEncounter } from '@/types';
import SMCReport from '@/components/SMCReport';
import ErrorBoundary from '@/components/ErrorBoundary';

interface ReportGeneratorProps {
    instructorId: string;
    onLogout: () => void;
}

export default function ReportGenerator({ instructorId, onLogout }: ReportGeneratorProps) {
    const [loading, setLoading] = useState(false);
    const [progressMsg, setProgressMsg] = useState('');
    const [encounters, setEncounters] = useState<ProcessedEncounter[]>([]);
    const [students, setStudents] = useState<string[]>([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleFetchData = async () => {
        setLoading(true);
        setProgressMsg('Fetching submissions from JotForm (this may take a minute)...');
        try {
            let batchCounter = 0;
            const submissions = await fetchAllSubmissions((fetched, batchSize) => {
                batchCounter++;
                setProgressMsg(`Batch ${batchCounter} fetched (${batchSize} new, ${fetched} total)...`);
            });

            setProgressMsg('Extracting and flattening structured data...');
            const flattened = submissions.map(extractAndFlattenSubmission);

            setProgressMsg('Applying date filters and cleaning data...');
            let cleaned = removeEmptyColumns(flattened);
            cleaned = filterByDateRange(cleaned, startDate, endDate);

            setProgressMsg('Transforming data into encounters...');
            const renamed = renameColumns(cleaned);
            const transformed = renamed.map(transformSubmissionData);

            const uniqueStudents = Array.from(new Set(
                transformed
                    .map(e => e.student_name)
                    .filter((name): name is string => !!name)
            )).sort();

            setEncounters(transformed);
            setStudents(uniqueStudents);
            setProgressMsg('Data processing complete.');

            setTimeout(() => {
                setLoading(false);
                setProgressMsg('');
            }, 1500);

        } catch (err) {
            console.error(err);
            setProgressMsg('An error occurred during data fetching.');
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const memoizedReport = useMemo(() => {
        if (!selectedStudent) return null;
        return generateStudentReport(selectedStudent, encounters);
    }, [selectedStudent, encounters]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f5f5f5] to-[#e0e0e0] text-gray-900 font-sans print:bg-white print:m-0 print:p-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 print:hidden">
                <div className="mb-8 p-8 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#440154] via-[#31688e] to-[#26828e] mb-3 tracking-tight">
                        SMC Report Generator
                    </h1>
                    <div className="mb-8 flex items-center space-x-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-[#35b779] mr-2 animate-pulse"></span>
                            Instructor: <span className="ml-1 text-[#31688e]">{instructorId}</span>
                        </span>
                        <button onClick={onLogout} className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-bold rounded-full text-gray-700 bg-white hover:bg-red-50 hover:text-[#d32f2f] hover:border-red-200 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                            Log out
                        </button>
                    </div>

                    {students.length === 0 && !loading && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 max-w-lg mb-6">
                                <div className="w-full sm:w-1/2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Start Date (Optional)</label>
                                    <input type="date" max={endDate || undefined} value={startDate} onChange={e => setStartDate(e.target.value)} className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#26828e] focus:border-transparent sm:text-sm px-4 py-2.5 text-black transition-all hover:border-[#31688e]" />
                                </div>
                                <div className="w-full sm:w-1/2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">End Date (Optional)</label>
                                    <input type="date" min={startDate || undefined} value={endDate} onChange={e => setEndDate(e.target.value)} className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#26828e] focus:border-transparent sm:text-sm px-4 py-2.5 text-black transition-all hover:border-[#31688e]" />
                                </div>
                            </div>
                            <button onClick={handleFetchData} className="inline-flex justify-center items-center px-8 py-3.5 border border-transparent text-base font-bold rounded-xl shadow-md text-white bg-gradient-to-r from-[#31688e] to-[#26828e] hover:from-[#26828e] hover:to-[#35b779] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#26828e] transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 w-full sm:w-auto">
                                Fetch & Process Data
                            </button>
                        </div>
                    )}

                    {loading && (
                        <div className="mt-6 p-5 rounded-xl bg-gradient-to-r from-[#fffde7] to-white border border-[#fde725] relative overflow-hidden shadow-[0_4px_20px_rgb(253,231,37,0.15)] transition-all">
                            <div className="absolute top-0 left-0 w-1 bg-[#fde725] h-full animate-pulse"></div>
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="animate-spin h-6 w-6 text-[#26828e]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-sm font-bold text-[#440154]">Processing Data Pipeline</h3>
                                    <div className="mt-1 text-sm font-medium text-gray-600">
                                        <p className="animate-pulse">{progressMsg}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {students.length > 0 && !loading && (
                        <div className="flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0">
                            <div className="w-full md:w-1/3">
                                <label htmlFor="studentSelect" className="block text-sm font-bold text-gray-700 mb-2">Select Student Profile</label>
                                <select id="studentSelect" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="block w-full pl-4 pr-10 py-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#26828e] focus:border-transparent sm:text-sm text-black font-semibold transition-colors hover:border-[#31688e]">
                                    <option value="">-- Choose a student --</option>
                                    {students.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex space-x-4 w-full md:w-auto">
                                <button onClick={handlePrint} disabled={!selectedStudent} aria-label="Print Report as PDF" className="w-1/2 md:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-bold rounded-lg shadow-md text-white bg-gradient-to-r from-[#35b779] to-[#2e9c67] hover:shadow-lg hover:from-[#2e9c67] hover:to-[#26828e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#35b779] disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:-translate-y-0.5 active:translate-y-0 tracking-wide">
                                    Print PDF
                                </button>
                                <button onClick={() => { setStudents([]); setEncounters([]); setSelectedStudent(''); setProgressMsg(''); }} aria-label="Reset Application State" className="w-1/2 md:w-auto inline-flex justify-center items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-bold rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#26828e] transition-all hover:text-[#d32f2f] hover:border-[#d32f2f]">
                                    Reset App
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {memoizedReport && (
                <ErrorBoundary>
                    <SMCReport
                        report={memoizedReport}
                    />
                </ErrorBoundary>
            )}
        </div>
    );
}
