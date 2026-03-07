'use client';

import React, { useState } from 'react';

interface AuthGateProps {
    onAuthenticated: (instructorId: string) => void;
}

export default function AuthGate({ onAuthenticated }: AuthGateProps) {
    const [universalId, setUniversalId] = useState('');
    const [employeeNum, setEmployeeNum] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    universalId: universalId.trim(),
                    employeeNum: employeeNum.trim()
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                onAuthenticated(data.instructorId);
            } else {
                setError(data.error || 'Authentication failed. Please try again.');
            }
        } catch {
            setError('System error during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1e1e2e] via-[#440154] to-[#1e1e2e] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#fde725] to-[#35b779] tracking-tight">
                    SMC Report Generator
                </h2>
                <p className="mt-2 text-center text-sm text-[#f5f5f5] opacity-80 uppercase tracking-widest font-medium">
                    Instructor Authentication
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white/95 backdrop-blur-sm py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/20 transition-all hover:shadow-[#31688e]/10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="universalId" className="block text-sm font-semibold text-gray-700">
                                Universal ID
                            </label>
                            <div className="mt-1">
                                <input
                                    id="universalId"
                                    name="universalId"
                                    type="text"
                                    required
                                    value={universalId}
                                    onChange={e => setUniversalId(e.target.value)}
                                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#26828e] focus:border-transparent transition-all sm:text-sm text-black"
                                    placeholder="e.g. jdoe"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="employeeNum" className="block text-sm font-semibold text-gray-700">
                                Employee Number
                            </label>
                            <div className="mt-1">
                                <input
                                    id="employeeNum"
                                    name="employeeNum"
                                    type="password"
                                    required
                                    value={employeeNum}
                                    onChange={e => setEmployeeNum(e.target.value)}
                                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#26828e] focus:border-transparent transition-all sm:text-sm text-black"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-[#d32f2f] text-sm text-center font-medium">
                                    {error}
                                </p>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-gradient-to-r from-[#31688e] to-[#26828e] hover:from-[#26828e] hover:to-[#35b779] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#26828e] transform transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Authenticating...' : 'Secure Login'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
