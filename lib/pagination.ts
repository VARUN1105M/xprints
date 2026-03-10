export function getPagination(page: number, pageSize: number) {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  return {
    page: safePage,
    pageSize,
    from,
    to
  };
}

export function getTotalPages(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize));
}
