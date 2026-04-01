"use client"

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "use-intl";
import { Pencil, Plus, Trash2, Users, RotateCcw } from "lucide-react";
import type { UserDetailDTO, UserDTO } from "@/app/types/user";
import type { PaginatedResponse } from "@/app/types/pagination";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import {
  Dialog,
  AdminPageHeader,
  AdminDataTable,
  AdminDetailField,
} from "@/app/components/admin";
import api from "@/lib/axios";

const PAGE_SIZE = 20;

export default function UsersPage() {
  const t = useTranslations("Admin");

  const [users,      setUsers]      = useState<UserDTO[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [sortBy,     setSortBy]     = useState<string | undefined>();
  const [sortDir,    setSortDir]    = useState<"asc" | "desc">("asc");
  const [filters,    setFilters]    = useState<Record<string, string>>({});
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">("view");
  const [dialogUser, setDialogUser] = useState<UserDetailDTO | null>(null);

  type Role = "listener" | "artist" | "admin";
  const roleLabel = (role?: Role | null) => t(role ?? "");
  const isReadOnly = dialogMode === "view";

  const roleBadgeClass: Record<Role, string> = {
    admin:    "badge badge-error badge-sm",
    artist:   "badge badge-info badge-sm",
    listener: "badge badge-ghost badge-sm",
  };

  const RoleBadges = ({ roles }: { roles?: Role[] }) => (
    <div className="flex flex-wrap gap-1">
      {(roles ?? []).map((r) => (
        <span key={r} className={roleBadgeClass[r]}>{roleLabel(r)}</span>
      ))}
    </div>
  );

  const [form, setForm] = useState({
    email:           "",
    displayName:     "",
    role:            "listener" as Role,
    password:        "",
    timezone:        "",
    language:        "",
    profileImageUrl: "",
  });

  // ── Core load ────────────────────────────────────────────────────────────
  const load = useCallback(async (
    p: number,
    sb: string | undefined,
    sd: "asc" | "desc",
    f: Record<string, string>,
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
      if (sb) { params.set("sortBy", sb); params.set("sortDir", sd.toUpperCase()); }
      Object.entries(f).forEach(([k, v]) => { if (v) params.set(k, v); });

      const { data } = await api.get<PaginatedResponse<UserDTO>>(
        `${API_ENDPOINTS.admin.users}?${params}`,
      );
      setUsers(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(1, undefined, "asc", {}); }, [load]);

  const reload = () => load(page, sortBy, sortDir, filters);

  // ── Sort / page (immediate) ───────────────────────────────────────────────
  const handleSortChange = (key: string, dir: "asc" | "desc") => {
    setSortBy(key); setSortDir(dir); setPage(1);
    void load(1, key, dir, filters);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    void load(p, sortBy, sortDir, filters);
  };

  // ── Filter (debounced 400 ms) ─────────────────────────────────────────────
  const filterDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined,);

  const handleFilterChange = (key: string, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next); setPage(1);
    clearTimeout(filterDebounce.current);
    filterDebounce.current = setTimeout(() => void load(1, sortBy, sortDir, next), 400);
  };

  // ── Dialog helpers ────────────────────────────────────────────────────────
  const openCreate = () => {
    setDialogMode("create"); setDialogUser(null);
    setForm({ email: "", displayName: "", role: "listener", password: "", timezone: "", language: "", profileImageUrl: "" });
    setDialogOpen(true);
  };

  const openView = async (u: UserDTO) => {
    setDialogMode("view"); setDialogOpen(true); setDialogUser(null);
    setForm((p) => ({ ...p, email: u.email, displayName: u.displayName, role: u.role ?? "listener", password: "" }));
    try {
      const { data: full } = await api.get<UserDetailDTO>(API_ENDPOINTS.admin.userDetail(u.id));
      setDialogUser(full);
      setForm({ email: full.email, displayName: full.displayName, role: full.role, password: "", timezone: full.timezone, language: full.language, profileImageUrl: full.profileImageUrl ?? "" });
    } catch (e) { console.error("Failed to load user detail", e); }
  };

  const openEdit = async (u?: UserDTO) => {
    const base = u ?? dialogUser;
    if (!base) return;
    setDialogMode("edit"); setDialogOpen(true);
    const { data: full } = await api.get<UserDetailDTO>(API_ENDPOINTS.admin.userDetail(base.id));
    setDialogUser(full);
    setForm({ email: full.email ?? "", displayName: full.displayName ?? "", role: full.role, password: "", timezone: full.timezone, language: full.language, profileImageUrl: full.profileImageUrl ?? "" });
  };

  const saveUser = async () => {
    if (dialogMode === "create") {
      const { data: created } = await api.post<UserDetailDTO>(API_ENDPOINTS.admin.users, {
        displayName: form.displayName.trim(), password: form.password, role: form.role,
        timezone: form.timezone, language: form.language, profileImageUrl: form.profileImageUrl || null,
      });
      await reload(); setDialogUser(created); return;
    }
    if (dialogMode === "edit" && dialogUser) {
      const { data: updated } = await api.put<UserDetailDTO>(API_ENDPOINTS.admin.userDetail(dialogUser.id), {
        displayName: form.displayName.trim(), role: form.role, timezone: form.timezone,
        language: form.language, profileImageUrl: form.profileImageUrl || null,
        password: form.password || undefined,
      });
      await reload(); setDialogUser(updated);
    }
  };

  const deleteUser = async (u: UserDTO) => {
    if (!confirm(`${t("deleteUserQuestion")} #${u.id} (${u.email})?`)) return;
    await api.delete(API_ENDPOINTS.admin.userDetail(u.id));
    await reload();
    if (dialogUser?.id === u.id) { setDialogOpen(false); setDialogUser(null); }
  };

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = [
    { label: t("id"),         sortKey: "id" },
    { label: t("email"),      sortKey: "email",       filter: { type: "text" as const } },
    { label: t("nickname"),   sortKey: "displayName", filter: { type: "text" as const } },
    { label: t("role"),       filter: { type: "enum" as const, options: [
      { value: "listener", label: t("listener") },
      { value: "artist",   label: t("artist") },
      { value: "admin",    label: t("admin") },
    ]}},
    { label: t("operations"), align: "center" as const },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <AdminPageHeader icon={<Users size={18} />} title={t("users")}>
        <button className="btn btn-sm btn-info text-white" onClick={openCreate} type="button">
          <Plus size={18} /> {t("newUser")}
        </button>
        <button
          className="btn btn-soft btn-square"
          onClick={async () => { setRefreshing(true); await reload().finally(() => setRefreshing(false)); }}
          disabled={loading || refreshing}
          title={t("refresh")}
          type="button"
        >
          {refreshing ? <span className="loading loading-spinner loading-sm" /> : <RotateCcw size={18} />}
        </button>
      </AdminPageHeader>

      <main className="pt-2 flex-1 overflow-auto">
        <AdminDataTable
          columns={columns}
          loading={loading}
          empty={users.length === 0 && !loading}
          emptyText={t("noArtists")}
          footer={<span>{t("total")}: {total}</span>}
          sortBy={sortBy}
          sortDir={sortDir}
          onSortChange={handleSortChange}
          filters={filters}
          onFilterChange={handleFilterChange}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={handlePageChange}
        >
          {users.map((user) => (
            <tr
              key={user.id}
              className="hover:bg-base-200 transition-colors cursor-pointer"
              onClick={() => openView(user)}
            >
              <td>{user.id}</td>
              <td>{user.email}</td>
              <td>{user.displayName}</td>
              <td><RoleBadges roles={user.roles as Role[]} /></td>
              <td className="text-center">
                <div className="flex justify-center items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); void openEdit(user); }}
                    className="btn btn-xs btn-info"
                    title={t("edit")}
                  >
                    <Pencil size={14} color="#fff" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteUser(user).catch(console.error); }}
                    className="btn btn-xs btn-error"
                    title={t("delete")}
                  >
                    <Trash2 size={14} color="#fff" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminDataTable>
      </main>

      <Dialog
        open={dialogOpen}
        mode={dialogMode}
        onCloseAction={() => setDialogOpen(false)}
        onEdit={dialogMode === "view" ? () => openEdit() : undefined}
        onSave={dialogMode !== "view" ? saveUser : undefined}
        closeAfterSave
        title={
          dialogMode === "create" ? t("newUser")
          : dialogMode === "edit"  ? t("editUser")
          : t("detailUser")
        }
      >
        {dialogMode === "view" ? (
          dialogUser ? (
            <div className="space-y-1 text-xs">
              <AdminDetailField label="ID" value={dialogUser.id} />
              <AdminDetailField label={t("email")}    value={dialogUser.email} />
              <AdminDetailField label={t("nickname")} value={dialogUser.displayName} />
              <AdminDetailField label={t("role")}     value={<RoleBadges roles={dialogUser.roles as Role[]} />} />
              <AdminDetailField label={t("timezone")} value={dialogUser.timezone} />
              <AdminDetailField label={t("language")} value={dialogUser.language} />
              <AdminDetailField label={t("createdAt")} value={new Date(dialogUser.createdAt).toLocaleString()} />
              <AdminDetailField label={t("updatedAt")} value={new Date(dialogUser.updatedAt).toLocaleString()} />
            </div>
          ) : (
            <div className="flex justify-center py-4">
              <span className="loading loading-spinner" />
            </div>
          )
        ) : (
          <form className="space-y-2">
            <div className="form-control">
              <fieldset className="fieldset">
                <span className="text-base">{t("email")}</span>
                <input className="input input-bordered w-full" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} disabled={isReadOnly || dialogMode === "edit"} />
              </fieldset>
            </div>
            <div className="form-control">
              <fieldset className="fieldset">
                <span className="text-base">{t("nickname")}</span>
                <input className="input w-full" value={form.displayName} onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))} disabled={isReadOnly} />
              </fieldset>
            </div>
            <div className="form-control">
              <fieldset className="fieldset">
                <span className="text-base">{t("role")}</span>
                <select className="select select-bordered w-full" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as Role }))} disabled={isReadOnly} data-theme="light">
                  <option value="listener">{t("listener")}</option>
                  <option value="artist">{t("artist")}</option>
                  <option value="admin">{t("admin")}</option>
                </select>
              </fieldset>
            </div>
            <div className="form-control">
              <fieldset className="fieldset">
                <span className="text-base">{dialogMode === "create" ? t("password") : t("newPassword")}</span>
                <input type="password" autoComplete="current-password" className="input input-bordered w-full" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} data-theme="light" />
              </fieldset>
            </div>
            <div className="form-control">
              <fieldset className="fieldset">
                <span className="text-base">{t("timezone")}</span>
                <input className="input input-bordered w-full" value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))} data-theme="light" />
              </fieldset>
            </div>
            <div className="form-control">
              <fieldset className="fieldset">
                <span className="text-base">{t("language")}</span>
                <input className="input input-bordered w-full" value={form.language} onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))} data-theme="light" />
              </fieldset>
            </div>
            <div className="form-control">
              <fieldset className="fieldset">
                <span className="text-base">{t("profileImageUrl")}</span>
                <input className="input input-bordered w-full" value={form.profileImageUrl} onChange={(e) => setForm((p) => ({ ...p, profileImageUrl: e.target.value }))} data-theme="light" />
              </fieldset>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
