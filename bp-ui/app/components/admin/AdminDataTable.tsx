"use client";

import { type ReactNode } from "react";
import { useTranslations } from "use-intl";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { AdminSpinner } from "./AdminSpinner";

export type FilterConfig =
  | { type: "text"; placeholder?: string }
  | { type: "enum"; options: { value: string; label: string }[] }
  | { type: "date" };

export type Column = {
  label:           string;
  align?:          "left" | "center" | "right";
  className?:      string;
  sortKey?:        string;
  filterKey?:      string;
  filter?:         FilterConfig;
  hiddenOnMobile?: boolean;
};

type Props = {
  columns:         Column[];
  loading:         boolean;
  empty?:          boolean;
  emptyText?:      string;
  footer?:         ReactNode;
  children:        ReactNode;
  // sort
  sortBy?:         string;
  sortDir?:        "asc" | "desc";
  onSortChange?:   (key: string, dir: "asc" | "desc") => void;
  // filter
  filters?:        Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  // pagination
  page?:           number;
  pageSize?:       number;
  total?:          number;
  onPageChange?:   (page: number) => void;
};

const alignClass: Record<NonNullable<Column["align"]>, string> = {
  left:   "text-left",
  center: "text-center",
  right:  "text-right",
};

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if(total <= 7)
    return Array.from({ length: total }, (_, i) => i + 1);

  if(current <= 4)
    return [1, 2, 3, 4, 5, "…", total];

  if(current >= total - 3)
    return [1, "…", total - 4, total - 3, total - 2, total - 1, total];

  return [1, "…", current - 1, current, current + 1, "…", total];
}

export function AdminDataTable({
  columns,
  loading,
  empty,
  emptyText = "No records found",
  footer,
  children,
  sortBy,
  sortDir = "asc",
  onSortChange,
  filters = {},
  onFilterChange,
  page = 1,
  pageSize = 20,
  total,
  onPageChange,
}: Props) {
  const t       = useTranslations("Admin");
  const colSpan = columns.length;

  // Build className per column (used by both <th> and consumer <td> via CSS)
  const colClass = (col: Column) =>
    [
      col.hiddenOnMobile ? "hidden sm:table-cell" : "",
      col.className ?? alignClass[col.align ?? "left"],
    ]
      .filter(Boolean)
      .join(" ");

  const totalPages  = total !== undefined ? Math.ceil(total / pageSize) : 0;
  const from        = total ? (page - 1) * pageSize + 1 : 0;
  const to          = total ? Math.min(page * pageSize, total) : 0;
  const pageNumbers = totalPages > 1 ? getPageNumbers(page, totalPages) : [];

  const handleSort = (key: string) => {
    if(!onSortChange)
      return;
    if(sortBy === key) {
      onSortChange(key, sortDir === "asc" ? "desc" : "asc");
    } else {
      onSortChange(key, "asc");
    }
  };

  const SortIcon = ({ col }: { col: Column }) => {
    if(!col.sortKey)
      return null;

    const active = sortBy === col.sortKey;

    if(!active)
      return <ChevronsUpDown size={13} className="opacity-40" />;
    return sortDir === "asc"
      ? <ChevronUp   size={13} className="text-info" />
      : <ChevronDown size={13} className="text-info" />;
  };

  return (
    <div className="bg-base-100 border border-base-300 rounded shadow-sm overflow-x-auto">
      <table className="table table-zebra table-xs sm:table-sm table-fixed w-full">
        <thead className="bg-base-200 text-xs uppercase">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className={colClass(col)}
              >
                {/* Label + sort button */}
                <div
                  className={`flex items-center gap-1 ${col.align === "center" ? "justify-center" : ""} ${col.sortKey ? "cursor-pointer select-none" : ""}`}
                  onClick={() => col.sortKey && handleSort(col.sortKey)}
                >
                  {col.label}
                  <SortIcon col={col} />
                </div>

                {/* Filter input */}
                {col.filter && onFilterChange && (
                  <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                    {col.filter.type === "text" ? (
                      <input
                        className="input input-xs w-full border border-base-300 bg-base-100 font-normal normal-case"
                        placeholder={(col.filter as { type: "text"; placeholder?: string }).placeholder ?? t("filterPlaceholder")}
                        value={filters[col.filterKey ?? col.sortKey ?? col.label] ?? ""}
                        onChange={(e) =>
                          onFilterChange(col.filterKey ?? col.sortKey ?? col.label, e.target.value)
                        }
                      />
                    ) : col.filter.type === "date" ? (
                      <input
                        type="date"
                        className="input input-xs w-full border border-base-300 bg-base-100 font-normal normal-case"
                        value={filters[col.filterKey ?? col.sortKey ?? col.label] ?? ""}
                        onChange={(e) =>
                          onFilterChange(col.filterKey ?? col.sortKey ?? col.label, e.target.value)
                        }
                      />
                    ) : (
                      <select
                        className="select select-xs w-full border border-base-300 bg-base-100 font-normal normal-case"
                        value={filters[col.filterKey ?? col.sortKey ?? col.label] ?? ""}
                        onChange={(e) =>
                          onFilterChange(col.filterKey ?? col.sortKey ?? col.label, e.target.value)
                        }
                      >
                        <option value="">{t("allRoles")}</option>
                        {col.filter.options.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colSpan} className="py-8 text-center">
                <AdminSpinner />
              </td>
            </tr>
          ) : empty ? (
            <tr>
              <td colSpan={colSpan} className="py-8 text-center text-sm text-base-content/40">
                {emptyText}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>

      {/* Footer: info + pagination */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-base-300 p-3 text-xs text-base-content/60">
        <div>
          {footer}
          {total !== undefined && (
            <span className="ml-2 text-base-content/40">
              ({t("pageInfo", { from, to, total })})
            </span>
          )}
        </div>

        {totalPages > 1 && onPageChange && (
          <div className="flex items-center gap-1">
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label={t("prevPage")}
            >
              <ChevronLeft size={16} />
            </button>

            {pageNumbers.map((n, i) =>
              n === "…" ? (
                <span key={`ellipsis-${i}`} className="px-1"><MoreHorizontal size={14} /></span>
              ) : (
                <button
                  key={n}
                  className={`btn btn-xs ${n === page ? "btn-info text-white" : "btn-ghost"}`}
                  onClick={() => onPageChange(n as number)}
                >
                  {n}
                </button>
              )
            )}

            <button
              className="btn btn-xs btn-ghost"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label={t("nextPage")}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
