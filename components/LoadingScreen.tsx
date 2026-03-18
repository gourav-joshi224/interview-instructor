"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

type LoadingScreenProps = {
  title: string;
  messages: string[];
  subtitle?: string;
};

export function LoadingScreen({
  title,
  messages,
  subtitle,
}: LoadingScreenProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % messages.length);
    }, 1800);

    return () => window.clearInterval(interval);
  }, [messages]);

  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card flex w-full max-w-2xl flex-col items-center gap-6 px-8 py-14 text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
          className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full border border-[rgba(65,105,67,0.14)] bg-[var(--color-surface-light)]"
        >
          <div className="absolute inset-3 rounded-full border border-[rgba(65,105,67,0.25)]" />
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY }}
            className="absolute inset-6 rounded-full bg-[rgba(176,236,112,0.55)]"
          />
          <Logo mode="icon" tone="dark" ariaLabel="BackendGym loading logo" />
        </motion.div>

        <div className="space-y-2">
          <p className="section-kicker">{title}</p>
          <div className="relative h-8 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={messages[activeIndex]}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="text-type-h3 text-[var(--color-text-primary)]"
              >
                {messages[activeIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
          {subtitle ? (
            <p className="mx-auto max-w-lg text-sm leading-7 text-[var(--color-text-secondary)]">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{
                duration: 1,
                delay: dot * 0.18,
                repeat: Number.POSITIVE_INFINITY,
              }}
              className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
