'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Position {
  id: string;
  symbol: string;
  quantity: number;
  buy_price: number;
  currentPrice: number;
  pnl: number;
}

export default function PortfolioPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [form, setForm] = useState({ symbol: '', quantity: 1, buyPrice: 0 });

  const fetchPortfolio = async () => {
    const res = await api.get('/board/portfolio');
    setPositions(res.data.data);
  };

  useEffect(() => { fetchPortfolio(); }, []);

  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/board/portfolio', form);
    setForm({ symbol: '', quantity: 1, buyPrice: 0 });
    fetchPortfolio(); // Refresh the list
  };

  const handleRemovePosition = async (id: string) => {
    if (!confirm('Are you sure you want to remove this position?')) return;
    try {
      await api.delete(`/board/portfolio/${id}`);
      fetchPortfolio();
    } catch {
      alert('Failed to remove position.');
    }
  };

  const totalPnL = positions.reduce((acc, pos) => acc + pos.pnl, 0);

  return (
    <div>
      <h1 className="text-3xl font-bold text-brand-navy mb-6">Live Portfolio Tracker</h1>
      
      {/* Summary Widget */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-border mb-8">
        <p className="text-sm text-gray-500 font-medium">Total Unrealized P&L</p>
        <p className={`text-4xl font-bold mt-2 ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ₹{totalPnL.toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {positions.map((pos) => (
              <div key={pos.id} className="bg-white p-6 rounded-xl shadow-sm border border-brand-border">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">{pos.symbol}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${pos.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pos.pnl >= 0 ? '+' : ''}₹{pos.pnl.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleRemovePosition(pos.id)}
                      className="p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                      title="Remove position"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Qty: {pos.quantity} | Avg: ₹{pos.buy_price}</p>
                <p className="text-sm text-brand-navy font-medium mt-1">LTP: ₹{pos.currentPrice}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-border h-fit">
          <h2 className="text-xl font-bold mb-4">Add Position</h2>
          <form onSubmit={handleAddPosition} className="space-y-4">
            <input required placeholder="NSE Symbol (e.g. RELIANCE)" className="w-full border p-2 rounded" value={form.symbol} onChange={e => setForm({...form, symbol: e.target.value.toUpperCase()})} />
            <input required type="number" placeholder="Quantity" className="w-full border p-2 rounded" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} />
            <input required type="number" step="0.01" placeholder="Buy Price" className="w-full border p-2 rounded" value={form.buyPrice} onChange={e => setForm({...form, buyPrice: Number(e.target.value)})} />
            <button type="submit" className="w-full bg-brand-navy text-white py-2 rounded">Add Stock</button>
          </form>
        </div>
      </div>
    </div>
  );
}