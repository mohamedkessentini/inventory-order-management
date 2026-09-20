export interface PaginationParams {
  page: number;
  limit: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(DEFAULT_PAGE, Number(query.page) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || DEFAULT_LIMIT));
  return { page, limit };
}
