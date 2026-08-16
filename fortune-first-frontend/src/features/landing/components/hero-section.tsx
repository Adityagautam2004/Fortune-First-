'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/Button';

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative flex h-[450px] w-full flex-col justify-center overflow-hidden sm:h-[520px] md:h-[600px] lg:h-[650px]"
    >
      <div className="absolute inset-0 z-0">
        <Image
          src="/Hero_image.png"
          alt="Fortune First Hero Background"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40 md:bg-gradient-to-r md:from-black/80 md:to-transparent" />
      </div>

      <div className="container-max relative z-10 mt-16 px-6 lg:px-6">
        <div className="max-w-2xl">
          <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
            Grow Your <br />
            Wealth Smartly
          </h1>
          <p className="mb-10 max-w-lg text-lg text-gray-200 md:text-xl">
            Manage investments, plan finances, and secure your future with Fortune First.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild variant="primary" size="lg" className="rounded-lg text-lg shadow-lg">
              <Link href="/login">
                Get Started <ArrowRight size={22} />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
