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

export async function urlToFile(
  url: string | null,
  fileName?: string
): Promise<File | null> {
  if (!url) return null

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `Failed to fetch file: ${response.status} ${response.statusText}`
    )
  }

  const blob = await response.blob()

  const finalFileName =
    fileName || url.split("/").pop()?.split("?")[0] || "file"

  return new File([blob], finalFileName, {
    type: blob.type || "application/octet-stream",
  })
}
