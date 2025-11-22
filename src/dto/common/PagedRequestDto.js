export class PagedRequestDto {
  constructor({
    page,
    skip,
    skipCount,
    take,
    maxResultCount,
    sorting,
  } = {}) {
    this.maxResultCount =
      maxResultCount ?? take ?? PagedRequestDto.DEFAULT_PAGE_SIZE;
    this.page = page ?? null;
    const derivedSkip =
      typeof page === "number"
        ? Math.max(0, (page - 1) * this.maxResultCount)
        : undefined;
    this.skipCount = skipCount ?? skip ?? derivedSkip ?? 0;
    this.sorting = sorting ?? undefined;
  }

  toQueryParams() {
    const query = {};
    query.SkipCount = this.skipCount;
    query.MaxResultCount = this.maxResultCount;
    if (this.sorting) {
      query.Sorting = this.sorting;
    }
    return query;
  }
}

PagedRequestDto.DEFAULT_PAGE_SIZE = 10;

export function mergeQueryParams(base = {}, extra = {}) {
  return Object.entries({ ...base, ...extra }).reduce((acc, [key, value]) => {
    if (
      value === undefined ||
      value === null ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});
}
