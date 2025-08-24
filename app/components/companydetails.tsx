"use client"

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface CompanyDetailsProps {
    ticker: string;
}

interface CompanyInfo {
    longName: string;
    sector: string;
    industry: string;
    longBusinessSummary: string;
    country: string;
    website: string;
    marketCap: number;
    dividendYield: number;
    trailingPE: number;
}

export default function CompanyDetails({ ticker }: CompanyDetailsProps) {
    const [details, setDetails] = useState<CompanyInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const response = await axios.get<CompanyInfo>(`/api/company-details`, {
                    params: { ticker: ticker },
                });
                setDetails(response.data);
            } catch (error) {
                console.error("Error fetching company details:", error);
                setDetails(null);
            } finally {
                setLoading(false);
            }
        };

        if (ticker) {
            fetchDetails();
        }
    }, [ticker]);

    if (loading) {
        return <div className="p-5 text-gray-400">Loading company details...</div>;
    }

    if (!details) {
        return <div className="p-5 text-gray-400">Company details not available.</div>;
    }

    const formatMarketCap = (cap: number): string => {
        if (!cap) return 'N/A';
        if (cap >= 1e12) {
            return (cap / 1e12).toFixed(2) + 'T';
        }
        if (cap >= 1e9) {
            return (cap / 1e9).toFixed(2) + 'B';
        }
        return cap.toString();
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <h3 className='text-xl font-bold mb-3'>About {details.longName}</h3>
            <div className='flex-grow overflow-y-auto pr-3 custom-scrollbar'>
                <p className='text-sm text-gray-400 mb-4'>
                    {details.longBusinessSummary}
                </p>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div className="flex flex-col">
                        <span className="text-gray-400">Sector</span>
                        <span className="text-white font-semibold">{details.sector}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-400">Industry</span>
                        <span className="text-white font-semibold">{details.industry}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-400">Country</span>
                        <span className="text-white font-semibold">{details.country}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-400">Market Cap</span>
                        <span className="text-white font-semibold">{formatMarketCap(details.marketCap)}</span>
                    </div>
                    {details.trailingPE && (
                        <div className="flex flex-col">
                            <span className="text-gray-400">Trailing P/E</span>
                            <span className="text-white font-semibold">{details.trailingPE.toFixed(2)}</span>
                        </div>
                    )}
                    {details.dividendYield && (
                        <div className="flex flex-col">
                            <span className="text-gray-400">Dividend Yield</span>
                            <span className="text-white font-semibold">{(details.dividendYield * 100).toFixed(2)}%</span>
                        </div>
                    )}
                </div>
            </div>
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #3f3f46;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #52525b;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #71717a;
                }
            `}</style>
        </div>
    );
}