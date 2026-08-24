'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
const MIN_INVESTMENT = 5000;

export function JoinSection() {
  const [form, setForm] = useState<JoinFormState>(INITIAL_FORM);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [amountError, setAmountError] = useState<string | null>(null);

  const handleChange =
    (field: keyof JoinFormState) => (e: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (field === 'amount') setAmountError(null);
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // amount is a free-text string server-side (no numeric validation there
    // per the onboarding API), so the ₹5,000 minimum is enforced here only.
    const numericAmount = Number(form.amount.replace(/[^0-9.]/g, ''));
    if (!numericAmount || numericAmount < MIN_INVESTMENT) {
      setAmountError(`Minimum investment amount is ₹${MIN_INVESTMENT.toLocaleString('en-IN')}`);
      return;
    }

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

        <motion.div
          className="mx-auto max-w-md rounded-2xl bg-card p-8 shadow-2xl md:p-10"
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="join-name" className="mb-1.5 block text-sm font-bold text-foreground">
                Name
              </label>
              <input
                id="join-name"
                required
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange('name')}
                className="w-full rounded-lg border border-primary/25 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="join-email" className="mb-1.5 block text-sm font-bold text-foreground">
                Email
              </label>
              <input
                id="join-email"
                required
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange('email')}
                className="w-full rounded-lg border border-primary/25 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="join-phone" className="mb-1.5 block text-sm font-bold text-foreground">
                Mobile Number
              </label>
              <input
                id="join-phone"
                required
                type="tel"
                placeholder="Mobile Number"
                value={form.phone}
                onChange={handleChange('phone')}
                className="w-full rounded-lg border border-primary/25 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="join-amount" className="mb-1.5 block text-sm font-bold text-foreground">
                Investment Amount <span className="font-normal text-muted-foreground">(min ₹5,000)</span>
              </label>
              <input
                id="join-amount"
                required
                type="text"
                inputMode="numeric"
                placeholder="Investment Amount (₹)"
                value={form.amount}
                onChange={handleChange('amount')}
                aria-invalid={!!amountError}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 ${
                  amountError
                    ? 'border-destructive focus:border-destructive focus:ring-destructive'
                    : 'border-primary/25 focus:border-primary focus:ring-primary'
                }`}
              />
              {amountError && <p className="mt-1.5 text-xs font-medium text-destructive">{amountError}</p>}
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

            <AnimatePresence mode="wait">
              {status === 'success' && (
                <motion.p
                  key="success"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-sm font-medium text-green-600"
                >
                  Thank you! We will contact you soon.
                </motion.p>
              )}
              {status === 'error' && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-sm font-medium text-destructive"
                >
                  Something went wrong. Please try again.
                </motion.p>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
