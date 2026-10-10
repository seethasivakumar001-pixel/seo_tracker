import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f4f8ff] text-slate-900 relative overflow-hidden">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#0062ff]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#00d2ff]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-50/40 via-transparent to-indigo-50/30 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2.5">
            <img
              src="/syscorp-logo-light.png"
              alt="SysCorp <Think Simple/>"
              className="h-10 max-w-[220px] object-contain drop-shadow-sm"
            />
          </div>
          <p className="text-xs font-medium text-slate-500">
            Enterprise Search Intelligence & SEO Analytics
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-blue-500/5 p-6 sm:p-8 backdrop-blur-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
