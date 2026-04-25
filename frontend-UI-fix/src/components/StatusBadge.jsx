import React from 'react';

const variants = {
  pending:   'bg-yellow-100 text-yellow-800',
  accepted:  'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-800',
  selesai:   'bg-gray-100 text-gray-700',
  online:    'bg-blue-100 text-blue-700',
  offline:   'bg-purple-100 text-purple-700',
  aktif:     'bg-green-100 text-green-700',
  'perlu perhatian': 'bg-red-100 text-red-700',
  'sangat aktif': 'bg-indigo-100 text-indigo-700',
  cukup:     'bg-blue-100 text-blue-700',
  'tidak aktif': 'bg-gray-100 text-gray-600',
  reschedule: 'bg-orange-100 text-orange-700',
  dikonfirmasi: 'bg-teal-100 text-teal-700',
};

export function StatusBadge({ status, label }) {
  const key = (label || status || '').toLowerCase();
  const cls = variants[key] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
      {label || status}
    </span>
  );
}
