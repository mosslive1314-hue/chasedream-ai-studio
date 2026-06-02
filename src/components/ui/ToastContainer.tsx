"use client";
import { useUIStore } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import Link from 'next/link';

const ICON_MAP = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLOR_MAP = {
  success: { bg: '#ECFDF5', border: '#10B981', icon: '#10B981', text: '#065F46' },
  error: { bg: '#FEF2F2', border: '#EF4444', icon: '#EF4444', text: '#991B1B' },
  warning: { bg: '#FFFBEB', border: '#F59E0B', icon: '#F59E0B', text: '#92400E' },
  info: { bg: '#EFF6FF', border: '#3B82F6', icon: '#3B82F6', text: '#1E40AF' },
};

export function ToastContainer() {
  const toasts = useUIStore(state => state.toasts);
  const removeToast = useUIStore(state => state.removeToast);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => {
          const Icon = ICON_MAP[toast.type];
          const colors = COLOR_MAP[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="pointer-events-auto rounded-lg shadow-lg p-3 flex items-start gap-3"
              style={{
                background: colors.bg,
                border: `1px solid ${colors.border}30`,
                backdropFilter: 'blur(8px)'
              }}
            >
              <Icon size={18} style={{ color: colors.icon, flexShrink: 0, marginTop: 1 }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: colors.text }}>{toast.title}</p>
                {toast.message && (
                  <p className="text-xs mt-0.5 opacity-75" style={{ color: colors.text }}>{toast.message}</p>
                )}
                {toast.link && (
                  <Link
                    href={toast.link.href}
                    className="text-xs font-medium mt-1 inline-block hover:underline"
                    style={{ color: colors.icon }}
                    onClick={() => removeToast(toast.id)}
                  >
                    {toast.link.label} &rarr;
                  </Link>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-40 hover:opacity-100 transition-opacity flex-shrink-0"
                style={{ color: colors.text }}
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
