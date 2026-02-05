'use client';

type LoaderProps = {
  message?: string;
  className?: string;
  textClassName?: string;
  spinnerClassName?: string;
};

export function Loader({
  message = 'Lädt...',
  className = '',
  textClassName = 'text-zinc-500',
  spinnerClassName = 'border-zinc-300 border-t-zinc-600',
}: LoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`w-8 h-8 border-4 rounded-full animate-spin ${spinnerClassName}`} />
      <p className={`mt-3 text-sm ${textClassName}`}>{message}</p>
    </div>
  );
}
