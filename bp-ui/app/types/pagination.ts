export type PageMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  from: number;
  to: number;
};

export type PageDto<T> = {
  items: T[];
  meta: PageMeta;
};
