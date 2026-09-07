import { toast } from "@/components/ui/toast"
import apiClient from "@/lib/api-client"
import { setAuthToken } from "@/lib/auth-session"
import { queryOptions, useMutation } from "@tanstack/react-query"
import type { User } from "./users"

interface GetOtpPayload {
  email: string
}

interface OtpResponse {
  success: boolean
  data: {
    id: string
  }
}

const getOtp = async (payload: GetOtpPayload) => {
  const res = await apiClient.post<OtpResponse>("/admin/otp", payload)
  return res.data
}

export const useGetOtp = () => {
  return useMutation({
    mutationFn: (payload: GetOtpPayload) => getOtp(payload),
    onError: (error) => {
      toast.add({
        type: "error",
        title: "Oops!",
        description: error.message,
        priority: "high",
      })
    },
  })
}

interface LoginPayload {
  email: string
  otp: string
  otp_id: string
}

interface LoginResponse {
  success: boolean
  message: string
  token: string
}

const login = async (payload: LoginPayload) => {
  const res = await apiClient.post<LoginResponse>("/admin/login", {
    ...payload,
    terms: true,
  })
  return res.data
}

export const useLogin = () => {
  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (data) => {
      if (!data.success) throw new Error(data.message)
      setAuthToken(data.token)
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: "Oops!",
        description: error.message,
        priority: "high",
      })
    },
  })
}

export function loggedInUserQueryOptions() {
  return queryOptions({
    queryKey: ["ME"],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean
        message: string
        data: User
      }>("/admin")

      return response.data
    },
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
