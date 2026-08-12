'use client';

import { useState } from 'react';
import axios from 'axios'; // Using generic axios since we don't need the auth interceptor here

export default function JoinForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', amount: '₹5K', message: '' });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Submitting...');
    try {
      // Use standard axios to hit the public endpoint without JWT headers
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/public/join-request`, form);
      setStatus('Success! We will contact you soon.');
      setForm({ name: '', email: '', phone: '', amount: '₹5K', message: '' });
    } catch (error) {
      setStatus('Failed to submit. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input required type="text" placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border p-2 rounded" />
      <input required type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border p-2 rounded" />
      <input required type="tel" placeholder="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border p-2 rounded" />
      <select value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full border p-2 rounded">
        <option value="₹5K">₹5,000</option>
        <option value="₹10K">₹10,000</option>
        <option value="₹25K">₹25,000</option>
        <option value="₹50K">₹50,000</option>
        <option value="₹1L+">₹1,00,000+</option>
      </select>
      <textarea placeholder="Message (Optional)" value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="w-full border p-2 rounded" rows={3} />
      <button type="submit" className="w-full bg-brand-navy text-white py-2 rounded font-medium hover:bg-opacity-90">
        Submit Request
      </button>
      {status && <p className="text-sm text-center font-medium mt-2 text-brand-orange">{status}</p>}
    </form>
  );
}