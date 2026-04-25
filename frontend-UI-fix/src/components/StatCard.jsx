import React from 'react';

export function StatCard({ icon: Icon, value, label, borderColor = 'border-[#4A1D8F]', iconBg = 'bg-purple-100', iconColor = 'text-[#4A1D8F]' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-5 border border-gray-100 border-t-4 ${borderColor}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`${iconBg} p-2 rounded-lg`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}
