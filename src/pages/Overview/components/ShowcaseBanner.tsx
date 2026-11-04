import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

interface ShowcaseBannerProps {
  userId?: string;
}

export function ShowcaseBanner({ userId }: ShowcaseBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="relative overflow-hidden bg-bg-surface border border-border-subtle p-5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl -z-10" />

      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-accent-primary to-accent-red rounded-xl flex items-center justify-center shadow-lg shadow-accent-primary/20">
          <Clock className="text-white w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-black text-text-main tracking-tight uppercase">Public Showcase</h4>
          <p className="text-xs text-text-muted font-medium">Your curated Gallery is broadcasting to the world.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <Link
          to="/dashboard/showcase"
          className="w-full sm:w-auto px-6 py-2 bg-accent-primary text-white border border-accent-primary rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 text-center"
        >
          Manage Showcases
        </Link>
        <a
          href={`/publicshowcase/${userId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-6 py-2 bg-bg-card hover:bg-accent-primary hover:text-white border border-border-subtle rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 text-center"
        >
          View Exhibition Archive
        </a>
      </div>
    </motion.div>
  );
}
