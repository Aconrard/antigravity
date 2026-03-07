'use client';

import React from 'react';
import { StudentReport, SMCRequirement } from '@/types';

interface SMCReportProps {
    report: StudentReport;
}

const AGE_GROUPS = ['Newborn', 'Infant', 'Toddler', 'Preschool', 'Preadolescent', 'Adolescent', 'Adult', 'Geriatric'];

export default function SMCReport({ report }: SMCReportProps) {
    const {
        student_name, course_number, competencies, rotation_sites,
        age_by_site, adult_pediatric_by_site, cohen_ccmc_pediatric
    } = report;

    const renderStatus = (completed: boolean) => (
        completed
            ? <svg className="text-[#35b779] inline-block w-6 h-6 md:w-7 md:h-7 drop-shadow-sm transition-transform hover:scale-110" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
            : <svg className="text-[#d32f2f] inline-block w-6 h-6 md:w-7 md:h-7 drop-shadow-sm opacity-80" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:m-0 print:max-w-full font-sans pb-24 text-black">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#440154] via-[#31688e] to-[#26828e] text-white p-6 md:p-8 rounded-t-2xl shadow-lg relative overflow-hidden print:bg-white print:text-black print:border-b-4 print:border-[#440154] print:shadow-none print:rounded-none">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-10 w-24 h-24 bg-[#fde725] opacity-10 rounded-full blur-2xl"></div>
                <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight relative z-10">SMC Progress Report</h1>
                <div className="flex justify-between items-center mt-6 relative z-10">
                    <p className="text-lg md:text-xl font-medium tracking-wide bg-black/20 px-4 py-1.5 rounded-lg border border-white/10 shadow-inner">
                        Student: <span className="font-bold text-[#fde725]">{student_name}</span>
                    </p>
                    {course_number && <p className="text-lg font-bold bg-white/10 px-4 py-1.5 rounded-lg border border-white/10 shadow-inner">Course: #{course_number}</p>}
                </div>
            </div>

            {/* Main Competencies Table */}
            <div className="mt-8 bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 transition-all hover:shadow-2xl print:shadow-none print:border-none">
                <div className="bg-gradient-to-r from-[#31688e] to-[#26828e] text-white px-6 py-5 print:bg-gray-100 print:text-[#31688e]">
                    <h2 className="text-xl font-extrabold tracking-wide">Student Minimum Competencies (SMC)</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#f5f5f5]">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Competency Area</th>
                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Count</th>
                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Required</th>
                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Success</th>
                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">% Rate</th>
                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100 print:divide-gray-300">
                            {Object.values(competencies).map((comp: SMCRequirement, idx) => (
                                <tr key={comp.name} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-gradient-to-r hover:from-[#f5f5f5] hover:to-white transition-colors duration-200`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">{comp.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-black text-[#26828e] md:text-base border-x border-gray-50 bg-[#26828e]/5">{comp.count}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-500 bg-gray-50/30">{comp.minimum}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                        {comp.requires_success_tracking ? <span className="text-[#35b779] font-bold bg-[#35b779]/10 px-3 py-1 rounded-md">{comp.successful_count}</span> : <span className="text-gray-300">-</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-600">
                                        {comp.requires_success_tracking ? `${comp.percent_successful}%` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-lg">
                                        {renderStatus(comp.completed)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                {/* Rotation Sites */}
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 transition-all hover:shadow-2xl print:shadow-none print:break-inside-avoid flex flex-col">
                    <div className="bg-gradient-to-r from-[#26828e] to-[#35b779] text-white px-6 py-5 print:bg-gray-100 print:text-[#26828e]">
                        <h2 className="text-xl font-extrabold tracking-wide drop-shadow-sm">Encounters by Rotation Site</h2>
                    </div>
                    <ul className="divide-y divide-gray-100 flex-1">
                        {Object.entries(rotation_sites).length > 0 ? Object.entries(rotation_sites).map(([site, count]) => (
                            <li key={site} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50/80 transition-colors">
                                <span className="text-gray-800 font-bold">{site}</span>
                                <span className="font-black text-lg text-[#31688e] bg-[#31688e]/10 px-3 py-1 rounded-md">{count}</span>
                            </li>
                        )) : <li className="px-6 py-4 text-gray-500 italic">No encounters recorded.</li>}
                    </ul>
                </div>

                {/* CCMC / Quick Stats */}
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 transition-all hover:shadow-2xl print:shadow-none print:break-inside-avoid flex flex-col">
                    <div className="bg-gradient-to-r from-[#fde725] to-[#fbc02d] text-[#440154] px-6 py-5 print:bg-gray-100 print:text-[#26828e]">
                        <h2 className="text-xl font-extrabold tracking-wide drop-shadow-sm">Special Program Tracking</h2>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-center p-5 bg-gradient-to-br from-white to-[#f5f5f5] rounded-xl shadow-inner border border-gray-200">
                            <span className="text-gray-800 font-bold uppercase tracking-widest text-sm flex-1 mr-4">Cohen CCMC Pediatric Encounters</span>
                            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#440154] to-[#31688e] drop-shadow-sm">{cohen_ccmc_pediatric}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-6 font-medium leading-relaxed uppercase tracking-wider">
                            * The Cohen CCMC variable tracks specific demographic minimums for designated pediatric clinical rotation sites.
                        </p>
                    </div>
                </div>
            </div>

            {/* Adult / Pediatric By Site */}
            <div className="mt-8 bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 transition-all hover:shadow-2xl print:shadow-none print:break-inside-avoid">
                <div className="bg-gradient-to-r from-[#31688e] to-[#440154] text-white px-6 py-5 print:bg-gray-100 print:text-[#31688e]">
                    <h2 className="text-xl font-extrabold tracking-wide drop-shadow-sm">Demographics Overview by Site</h2>
                </div>
                <div className="p-6 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-[#f5f5f5] rounded-t-lg">
                            <tr>
                                <th className="px-5 py-4 text-left font-bold text-gray-600 uppercase tracking-widest">Site</th>
                                <th className="px-5 py-4 text-center font-bold text-gray-600 uppercase tracking-widest">Pediatric</th>
                                <th className="px-5 py-4 text-center font-bold text-gray-600 uppercase tracking-widest">Adult</th>
                                <th className="px-5 py-4 text-center font-bold text-gray-600 uppercase tracking-widest">Geriatric</th>
                                <th className="px-5 py-4 text-center font-bold text-gray-600 uppercase tracking-widest">Unknown / Specific</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {Object.entries(adult_pediatric_by_site).map(([site, cats]) => (
                                <tr key={site} className="hover:bg-gray-50/80 transition-colors duration-150">
                                    <td className="px-5 py-4 font-bold text-gray-900 border-r border-gray-50">{site}</td>
                                    <td className="px-5 py-4 text-center font-black text-lg text-[#35b779] bg-[#35b779]/5 border-r border-white">{cats['Pediatric'] || 0}</td>
                                    <td className="px-5 py-4 text-center font-black text-lg text-[#31688e] bg-[#31688e]/5 border-r border-white">{cats['Adult'] || 0}</td>
                                    <td className="px-5 py-4 text-center font-black text-lg text-[#440154] bg-[#440154]/5 border-r border-white">{cats['Geriatric'] || 0}</td>
                                    <td className="px-5 py-4 text-center text-gray-400 font-medium bg-gray-50/30">{cats['Unknown'] || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Age Group Breakdown by Site */}
            <div className="mt-8 bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 transition-all hover:shadow-2xl print:shadow-none print:break-inside-avoid">
                <div className="bg-gradient-to-r from-[#26828e] to-[#440154] text-white px-6 py-5 print:bg-gray-100 print:text-[#26828e]">
                    <h2 className="text-xl font-extrabold tracking-wide drop-shadow-sm">Detailed Age Groups by Site</h2>
                </div>
                <div className="p-6 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-[#f5f5f5] rounded-t-lg">
                            <tr>
                                <th className="px-5 py-4 text-left font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">Site</th>
                                {AGE_GROUPS.map(age => (
                                    <th key={age} className="px-3 py-4 text-center font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">{age}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {Object.entries(age_by_site).map(([site, cats]) => (
                                <tr key={site} className="hover:bg-gray-50/80 transition-colors duration-150">
                                    <td className="px-5 py-4 font-bold text-gray-900 border-r border-gray-50 whitespace-nowrap">{site}</td>
                                    {/* Note: using `age` string as React key is perfectly safe here as the array is static and items are globally unique within this row */}
                                    {AGE_GROUPS.map(age => (
                                        <td key={age} className={`px-3 py-4 text-center font-bold text-base border-r border-white ${cats[age] ? 'text-[#31688e] bg-[#31688e]/5' : 'text-gray-300 font-normal'}`}>
                                            {cats[age] || 0}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
