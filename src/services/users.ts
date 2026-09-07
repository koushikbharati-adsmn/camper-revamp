import apiClient from "@/lib/api-client"
import { queryOptions } from "@tanstack/react-query"

export type UserRole = "Admin" | "SuperAdmin"

export interface User {
  UserID: number
  Name: string
  EmailID: string
  Role: UserRole
  isActive: boolean
  CreatedBy: number
  CreatedDttm: number
}

export interface UsersResponse {
  success: boolean
  data: User[]
}

interface GetUsersParams {
  is_active: boolean | null
  role: UserRole | null
}

const getUsers = async (params: GetUsersParams): Promise<UsersResponse> => {
  const res = await apiClient.get("/admin/users", {
    params,
  })

  return res.data
}

export const getUsersOptions = (params: GetUsersParams) =>
  queryOptions({
    queryKey: ["USERS", params],
    queryFn: () => getUsers(params),
  })
