import { FileText, FileSpreadsheet } from 'lucide-react';

interface DownloadReportCardProps {
  onDownloadPdf: () => void;
  downloading: boolean;
}

export function DownloadReportCard({ onDownloadPdf, downloading }: DownloadReportCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-brand-border bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Download Report</h3>
        <p className="mt-1 text-sm text-gray-500">Download your report in the format you need.</p>
      </div>

      <div className="flex shrink-0 gap-3">
        <button
          onClick={onDownloadPdf}
          disabled={downloading}
          className="inline-flex flex-col items-center justify-center gap-0.5 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-2">
            <FileText size={16} />
            {downloading ? 'Preparing...' : 'Download PDF'}
          </span>
          <span className="text-[10px] font-normal text-gray-300">(Recommended)</span>
        </button>

        <button
          disabled
          title="Excel export is coming soon"
          className="inline-flex cursor-not-allowed flex-col items-center justify-center gap-0.5 rounded-lg border border-brand-border px-5 py-2.5 text-sm font-semibold text-gray-400"
        >
          <span className="inline-flex items-center gap-2">
            <FileSpreadsheet size={16} />
            Download Excel
          </span>
          <span className="text-[10px] font-normal text-gray-400">(Coming soon)</span>
        </button>
      </div>
    </div>
  );
}
