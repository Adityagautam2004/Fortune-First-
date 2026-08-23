'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/Button';

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export function HeroSection() {
  const handleCtaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.querySelector('#join')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section
      id="hero"
      className="relative flex h-screen min-h-[600px] w-full flex-col justify-center overflow-hidden"
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

      <motion.div
        className="container-max relative z-10 mt-16 px-6 lg:px-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-2xl">
          <motion.h1
            variants={itemVariants}
            className="mb-6 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl"
          >
            Grow Your <br />
            Wealth Smartly
          </motion.h1>
          <motion.p variants={itemVariants} className="mb-10 max-w-lg text-lg text-gray-200 md:text-xl">
            Manage investments, plan finances, and secure your future with Fortune First.
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row">
            <Button asChild variant="primary" size="lg" className="rounded-lg text-lg shadow-lg">
              <Link href="#join" onClick={handleCtaClick}>
                Get Started <ArrowRight size={22} />
              </Link>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
