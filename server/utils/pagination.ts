import type { H3Event } from "h3"

export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export function getPaginationParams(event: H3Event, defaultLimit = 10, maxLimit = 100): PaginationParams {
  const query = getQuery(event)
  const page = Math.max(1, parseInt(String(query.page || "1"), 10) || 1)
  const limit = Math.min(maxLimit, Math.max(1, parseInt(String(query.limit || defaultLimit), 10) || defaultLimit))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

export function formatPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}
