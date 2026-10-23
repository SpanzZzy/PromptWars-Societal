import React from 'react';
import { AlertTriangle, PhoneCall } from 'lucide-react';

interface EmergencyBannerProps {
  advisory?: string;
  isDismissible?: boolean;
}

export function EmergencyBanner({ advisory }: EmergencyBannerProps) {
  return (
    <div
      role="alert"
      className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-md my-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 text-sm text-red-900">
          <h2 className="font-bold text-red-950 text-base mb-1">
            Emergency Notice & Civic Safety Protocol
          </h2>
          <p className="mb-2">
            {advisory ||
              'If there is immediate danger to human life (severe fire, gas leak, building collapse, or sparking electrical wires), alert emergency services immediately.'}
          </p>
          <div className="flex flex-wrap items-center gap-3 font-semibold text-xs text-red-800">
            <span className="flex items-center gap-1 bg-red-100 px-2 py-1 rounded">
              <PhoneCall className="w-3.5 h-3.5" /> Police / All Emergencies: 112
            </span>
            <span className="flex items-center gap-1 bg-red-100 px-2 py-1 rounded">
              <PhoneCall className="w-3.5 h-3.5" /> Fire Brigade: 101
            </span>
            <span className="flex items-center gap-1 bg-red-100 px-2 py-1 rounded">
              <PhoneCall className="w-3.5 h-3.5" /> Medical Ambulance: 108 / 102
            </span>
            <span className="flex items-center gap-1 bg-red-100 px-2 py-1 rounded">
              <PhoneCall className="w-3.5 h-3.5" /> Electricity Hazard Helpline: 1912
            </span>
          </div>
          <p className="mt-2 text-xs text-red-700 italic">
            * Note: SignalBridge is a civic intake and document organization tool. It is NOT an emergency dispatch or 911/112 operator system.
          </p>
        </div>
      </div>
    </div>
  );
}
