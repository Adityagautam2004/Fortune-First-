'use client';

import { useState } from 'react';

import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn, getErrorMessage } from '@/lib/utils';
import api from '@/lib/api';
import type { StockPosition } from '../types';

interface PositionActionModalProps {
  position: StockPosition | null;
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = 'sell' | 'buy';

export function PositionActionModal({ position, onClose, onSuccess }: PositionActionModalProps) {
  const [mode, setMode] = useState<Mode>('sell');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!position) return null;

  const resetAndClose = () => {
    setMode('sell');
    setQuantity(1);
    setPrice(0);
    setError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'sell' && quantity > position.quantity) {
      setError(`Cannot sell ${quantity} shares — only ${position.quantity} currently held.`);
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/board/portfolio/${position.id}/${mode === 'sell' ? 'sell' : 'buy'}`, { quantity, price });
      onSuccess();
      resetAndClose();
    } catch (err) {
      setError(getErrorMessage(err, `Failed to ${mode === 'sell' ? 'sell' : 'add to'} position.`));
    } finally {
      setSubmitting(false);
    }
  };

  const estimatedPnl = mode === 'sell' ? (price - position.average_price) * quantity : null;

  return (
    <Modal isOpen={!!position} onClose={resetAndClose} title={`${position.symbol} — ${position.company_name}`} size="md">
      <div className="-mt-4 mb-5 grid grid-cols-3 gap-3 rounded-xl bg-muted p-3 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Held</p>
          <p className="text-sm font-bold text-foreground">{position.quantity}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Avg. Price</p>
          <p className="text-sm font-bold text-foreground">₹{position.average_price.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Live Price</p>
          <p className="text-sm font-bold text-foreground">
            {position.current_price !== null ? `₹${position.current_price.toLocaleString('en-IN')}` : '—'}
          </p>
        </div>
      </div>

      <div className="mb-4 flex rounded-lg border border-brand-border p-1">
        <button
          type="button"
          onClick={() => setMode('sell')}
          className={cn(
            'flex-1 rounded-md py-1.5 text-sm font-semibold transition-colors',
            mode === 'sell' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Sell
        </button>
        <button
          type="button"
          onClick={() => setMode('buy')}
          className={cn(
            'flex-1 rounded-md py-1.5 text-sm font-semibold transition-colors',
            mode === 'buy' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Add More
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">
              Quantity {mode === 'sell' && `(max ${position.quantity})`}
            </label>
            <input
              type="number"
              min={0.0001}
              max={mode === 'sell' ? position.quantity : undefined}
              step="any"
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded-lg border border-brand-border px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">
              {mode === 'sell' ? 'Sell price' : 'Buy price'} (₹)
            </label>
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

        {mode === 'sell' && price > 0 && (
          <p className={cn('text-sm font-semibold', (estimatedPnl ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600')}>
            Estimated {(estimatedPnl ?? 0) >= 0 ? 'profit' : 'loss'}: ₹{Math.abs(estimatedPnl ?? 0).toLocaleString('en-IN')}
          </p>
        )}
        {mode === 'buy' && price > 0 && (
          <p className="text-sm text-muted-foreground">
            New average price will be ₹
            {(((position.quantity * position.average_price) + quantity * price) / (position.quantity + quantity)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting} variant={mode === 'sell' ? 'danger' : 'primary'}>
            {mode === 'sell' ? 'Confirm Sell' : 'Confirm Purchase'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
