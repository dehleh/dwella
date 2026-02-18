import { Loader2 } from 'lucide-react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return <Loader2 className={`animate-spin text-brand-500 ${sizeClasses[size]} ${className}`} />
}

export function PageLoader() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}
