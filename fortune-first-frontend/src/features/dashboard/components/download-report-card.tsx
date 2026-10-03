import { FileText, FileSpreadsheet } from 'lucide-react';

interface DownloadReportCardProps {
  /** Human-readable period being downloaded, e.g. "March 2026" or "FY 2025–26". */
  periodLabel: string;
  onDownloadPdf: () => void;
  downloading: boolean;
  error?: string;
}

export function DownloadReportCard({ periodLabel, onDownloadPdf, downloading, error }: DownloadReportCardProps) {
  return (
    <div className="rounded-2xl border border-brand-border bg-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Download Report</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your official statement for <span className="font-semibold text-foreground">{periodLabel}</span> — with your
            details, a summary of the period, monthly payouts and capital movements.
          </p>
        </div>

        <div className="flex shrink-0 gap-3">
          <button
            onClick={onDownloadPdf}
            disabled={downloading}
            className="inline-flex flex-col items-center justify-center gap-0.5 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
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
            className="inline-flex cursor-not-allowed flex-col items-center justify-center gap-0.5 rounded-lg border border-brand-border px-5 py-2.5 text-sm font-semibold text-muted-foreground"
          >
            <span className="inline-flex items-center gap-2">
              <FileSpreadsheet size={16} />
              Download Excel
            </span>
            <span className="text-[10px] font-normal text-muted-foreground">(Coming soon)</span>
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
