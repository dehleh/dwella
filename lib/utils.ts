import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return formatDate(date)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function validateNigerianPhone(phone: string): boolean {
  // Nigerian phone numbers: +234XXXXXXXXXX or 0XXXXXXXXXX
  const cleaned = phone.replace(/\s/g, '')
  const nigerianPattern = /^(\+234|0)[789][01]\d{8}$/
  return nigerianPattern.test(cleaned)
}

export function formatNigerianPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, '')
  if (cleaned.startsWith('+234')) {
    return cleaned.replace('+234', '0')
  }
  return cleaned
}

export function generateRoomTypeLabel(roomType: string): string {
  const labels: Record<string, string> = {
    ENSUITE: 'Ensuite (Private bathroom)',
    SHARED_BATH: 'Shared bathroom',
    STUDIO_ROOM: 'Studio room',
  }
  return labels[roomType] || roomType
}

export function generateRulesText(rules: Record<string, string>): string[] {
  const labels: Record<string, Record<string, string>> = {
    guests: {
      NO_GUESTS: '🚫 No guests allowed',
      OCCASIONAL: '👥 Occasional guests OK',
      WEEKENDS_OK: '📅 Weekend guests OK',
      ANYTIME_OK: '✅ Guests anytime',
    },
    quietHours: {
      '9PM': '🌙 Quiet by 9PM',
      '11PM': '🌙 Quiet by 11PM',
      FLEXIBLE: '🔊 Flexible quiet hours',
      NONE: '🎵 No specific quiet hours',
    },
    smoking: {
      NO: '🚭 No smoking',
      OUTSIDE_ONLY: '🚬 Smoking outside only',
      YES: '💨 Smoking allowed',
    },
    pets: {
      NO_PETS: '🐾 No pets',
      CATS_OK: '🐱 Cats welcome',
      DOGS_OK: '🐶 Dogs welcome',
      ALL_OK: '🐾 All pets welcome',
    },
  }

  return Object.entries(rules)
    .filter(([key]) => labels[key])
    .map(([key, value]) => labels[key][value] || value)
}

export async function uploadImage(file: File): Promise<string> {
  // Placeholder for image upload
  // In production, integrate with Cloudinary or similar service
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      // Return base64 as placeholder
      resolve(reader.result as string)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function generateAvatarUrl(name: string): string {
  const initials = getInitials(name)
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=4DA8FF&color=fff&size=200`
}
