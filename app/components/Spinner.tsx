'use client';

interface SpinnerProps {
  message?: string;
}

export default function Spinner({ message = 'Carregando...' }: SpinnerProps) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 shadow-2xl flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
}
