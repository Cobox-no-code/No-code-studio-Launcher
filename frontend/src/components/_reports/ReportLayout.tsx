'use client';
import React from 'react';
import ReportSidebar from '@/components/_reports/ReportSidebar';

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full flex bg-primary text-black">
      <ReportSidebar />
      <div className="flex-grow ">
        {children}
      </div>
    </div>
  );
}
