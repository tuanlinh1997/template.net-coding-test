export interface ApiResponse<T> {
  status: number
  result: number
  message: string
  data: T
  error: unknown
}

export interface Chat {
  id: number
  clientId: string
  created_at: string
}

export interface Message {
  id: number | string
  content: string
  role: 'user' | 'ai'
  created_at: string
}

export interface Pagination<T> {
  items: T[]
  total: number
}