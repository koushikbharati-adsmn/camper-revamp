import type { UserRole } from "@/services/users"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name?: string, fallback = "U") {
  if (!name?.trim()) return fallback

  const parts = name.trim().split(/\s+/)

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export const getRolesLabel = (role: UserRole) => {
  switch (role) {
    case "SuperAdmin":
      return "Super Admin"
    case "Admin":
      return "Admin"
    default:
      return "User"
  }
}
