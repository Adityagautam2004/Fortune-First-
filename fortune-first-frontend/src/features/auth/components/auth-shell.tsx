'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface AuthShellProps {
  children: React.ReactNode;
  backHref?: string;
}

export function AuthShell({ children, backHref = '/' }: AuthShellProps) {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/Hero_image.png"
          alt="Fortune First Background"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      <button
        onClick={() => router.push(backHref)}
        className="absolute left-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/30"
        aria-label="Go back"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="relative z-10 mx-4 my-6 w-full max-w-[380px]">
        <div className="rounded-2xl bg-card px-7 py-8 shadow-2xl">
          <div className="mb-4 flex flex-col items-center gap-1.5">
            <Image
              src="/logo_circle.png"
              alt="Fortune First Logo"
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-contain"
            />
            <span className="text-sm font-semibold tracking-wide text-foreground">Fortune First</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
