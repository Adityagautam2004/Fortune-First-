'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import type { StockSearchResult } from '../types';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddStockModal({ isOpen, onClose, onSuccess }: AddStockModalProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 350);
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [selected, setSelected] = useState<StockSearchResult | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!debouncedQuery.trim() || selected) {
      setResults([]);
      return;
    }
    setSearching(true);
    api
      .get('/board/stocks/search', { params: { q: debouncedQuery } })
      .then((res) => setResults(res.data.data || []))
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, [debouncedQuery, selected]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetForm = () => {
    setQuery('');
    setResults([]);
    setSelected(null);
    setQuantity(1);
    setPrice(0);
    setError('');
  };

  const handleSelect = (result: StockSearchResult) => {
    setSelected(result);
    setQuery(`${result.symbol} — ${result.name}`);
    setShowResults(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      setError('Search for a stock and select it from the list first.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.post('/board/portfolio', {
        symbol: selected.symbol,
        companyName: selected.name,
        quantity,
        price,
      });
      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to add stock.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); resetForm(); }} title="Add Stock" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div ref={containerRef} className="relative">
          <label className="mb-1 block text-sm font-semibold text-foreground">Stock</label>
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              required
              placeholder="Search by company name or symbol"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              className="w-full rounded-lg border border-brand-border py-2.5 pl-9 pr-9 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {searching && (
              <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          {showResults && results.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-brand-border bg-card shadow-lg">
              {results.map((result) => (
                <li key={result.symbol}>
                  <button
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="flex w-full flex-col items-start px-3.5 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span className="font-semibold text-foreground">{result.symbol}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {result.name} {result.exchange && `· ${result.exchange}`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Quantity</label>
            <input
              type="number"
              min={0.0001}
              step="any"
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded-lg border border-brand-border px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Price per share (₹)</label>
            <input
              type="number"
              min={0.01}
              step="any"
              required
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full rounded-lg border border-brand-border px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => { onClose(); resetForm(); }}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            Add Stock
          </Button>
        </div>
      </form>
    </Modal>
  );
}
