import { Loader2 } from 'lucide-react';
import React from 'react';

export const AuthLoading: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-blue-200 mx-auto"></div>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-700">
          Restoring your session...
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Please wait while we securely restore your authentication
        </p>
      </div>
    </div>
  );
};
