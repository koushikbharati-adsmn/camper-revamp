import { toast } from "@/components/ui/toast"
import apiClient from "@/lib/api-client"
import { queryOptions } from "@tanstack/react-query"
import { useMutation, useQueryClient } from "@tanstack/react-query"

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

interface SaveUserPayload {
  user_id?: number
  name: string
  email: string
  role: UserRole
  is_active: boolean
}

interface DeleteUserPayload {
  id: number
}

const saveUser = async (
  payload: SaveUserPayload
): Promise<{
  success: boolean
  message: string
}> => {
  const res = await apiClient.post("/admin/users", payload)

  if (!res.data.success) throw new Error(res.data.message)

  return res.data
}

export const useSaveUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveUser,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["USERS"],
      })
    },

    onError: (error) => {
      toast.add({
        type: "error",
        title: "Oops! Something went wrong",
        description: error.message,
      })
    },
  })
}

const deleteUser = async (
  payload: DeleteUserPayload
): Promise<{
  success: boolean
  message: string
}> => {
  const res = await apiClient.delete(`/admin/users?id=${payload.id}`)

  if (!res.data.success) throw new Error(res.data.message)

  return res.data
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteUser,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["USERS"],
      })
    },

    onError: (error: Error) => {
      toast.add({
        type: "error",
        title: "Oops! Something went wrong",
        description: error.message,
      })
    },
  })
}
