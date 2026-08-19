'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';

import api from '@/lib/api';
import { Button } from '@/components/ui/Button';

interface JoinFormState {
  name: string;
  email: string;
  phone: string;
  amount: string;
}

const INITIAL_FORM: JoinFormState = { name: '', email: '', phone: '', amount: '' };

export function JoinSection() {
  const [form, setForm] = useState<JoinFormState>(INITIAL_FORM);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleChange =
    (field: keyof JoinFormState) => (e: ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      await api.post('/public/join-request', { ...form, message: '' });
      setForm(INITIAL_FORM);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="join" className="bg-secondary py-16 md:py-20">
      <div className="container-max px-4">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-2xl font-bold text-white md:text-4xl">Join Fortune First</h2>
          <p className="mx-auto max-w-md text-sm text-gray-300 md:text-base">
            Become a part of our growing family and start your wealth journey today.
          </p>
        </div>

        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-2xl md:p-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="join-name" className="mb-1.5 block text-sm font-bold text-gray-800">
                Name
              </label>
              <input
                id="join-name"
                required
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange('name')}
                className="w-full rounded-lg border border-primary/25 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="join-email" className="mb-1.5 block text-sm font-bold text-gray-800">
                Email
              </label>
              <input
                id="join-email"
                required
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange('email')}
                className="w-full rounded-lg border border-primary/25 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="join-phone" className="mb-1.5 block text-sm font-bold text-gray-800">
                Mobile Number
              </label>
              <input
                id="join-phone"
                required
                type="tel"
                placeholder="Mobile Number"
                value={form.phone}
                onChange={handleChange('phone')}
                className="w-full rounded-lg border border-primary/25 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="join-amount" className="mb-1.5 block text-sm font-bold text-gray-800">
                Investment Amount
              </label>
              <input
                id="join-amount"
                required
                type="text"
                inputMode="numeric"
                placeholder="Investment Amount (₹)"
                value={form.amount}
                onChange={handleChange('amount')}
                className="w-full rounded-lg border border-primary/25 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="pt-2 text-center">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={status === 'submitting'}
                className="rounded-lg"
              >
                Join Now <ArrowRight size={20} />
              </Button>
            </div>

            {status === 'success' && (
              <p className="text-center text-sm font-medium text-green-600">
                Thank you! We will contact you soon.
              </p>
            )}
            {status === 'error' && (
              <p className="text-center text-sm font-medium text-destructive">
                Something went wrong. Please try again.
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
