import React from 'react';

// ── Table Container ─────────────────────────────────────────
interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-white/10 ${className}`}>
      <table className="w-full text-sm text-left">{children}</table>
    </div>
  );
}

// ── Table Head ──────────────────────────────────────────────
export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-white/5 border-b border-white/10">
      {children}
    </thead>
  );
}

// ── Table Header Cell ───────────────────────────────────────
export function TableHeader({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}

// ── Table Body ──────────────────────────────────────────────
export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-white/5">{children}</tbody>;
}

// ── Table Row ───────────────────────────────────────────────
export function TableRow({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      className={`transition-colors duration-200 hover:bg-white/[0.03] ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

// ── Table Cell ──────────────────────────────────────────────
export function TableCell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-6 py-4 text-gray-300 whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
}

// ── Skeleton Loader ─────────────────────────────────────────
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <Table>
      <TableHead>
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <TableHeader key={i}>
              <div className="h-3 bg-white/10 rounded w-20 animate-pulse" />
            </TableHeader>
          ))}
        </tr>
      </TableHead>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <TableRow key={rowIdx}>
            {Array.from({ length: cols }).map((_, colIdx) => (
              <TableCell key={colIdx}>
                <div className="h-3 bg-white/5 rounded w-24 animate-pulse" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
