
// 5. Loading Screen Component
// components/LoadingScreen.tsx
"use client";
import React from 'react';
import { Cloud, Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  title: string;
  subtitle: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ title, subtitle }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/95 to-blue-900/95 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-slate-200">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-pulse" />
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <Cloud className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>
          <p className="text-gray-600 text-base leading-relaxed mb-8">{subtitle}</p>
          
          <div className="flex items-center justify-center space-x-3 text-sm text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="font-medium">Please wait...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;