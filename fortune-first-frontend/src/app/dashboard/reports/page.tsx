'use client';

import { useState } from 'react';
import api from '@/lib/api';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // Tell Axios we expect a binary file buffer back
      const response = await api.get('/customer/report/full', { responseType: 'blob' });
      
      // Create a temporary link to trigger the browser's download behavior
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Fortune_First_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to download report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Investment Reports</h1>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-brand-border text-center">
        <h2 className="text-xl font-bold text-brand-navy mb-2">Full History Report</h2>
        <p className="text-gray-500 mb-6">Download a complete PDF statement of all your investments and monthly payouts.</p>
        
        <button 
          onClick={handleDownload} 
          disabled={loading}
          className="bg-brand-orange text-white px-6 py-3 rounded-md font-bold hover:bg-opacity-90 disabled:opacity-50"
        >
          {loading ? 'Generating PDF...' : 'Download Statement'}
        </button>
      </div>
    </div>
  );
}