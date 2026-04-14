"use client"

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "use-intl";
import { Pencil, Plus, Trash2, Users, RotateCcw, Upload, User } from "lucide-react";
import type { UserDetailDTO, UserDTO } from "@/app/types/user";
import type { PaginatedResponse } from "@/app/types/pagination";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import {
  Dialog,
  AdminPageHeader,
  AdminDataTable,
  AdminDetailField,
  AdminSpinner,
} from "@/app/components/admin";
import api, { parseAxiosError } from "@/lib/axios";
import { useToast } from "@/app/context/ToastContext";
import { ImageCropModal } from "@/app/components/ui/ImageCropModal";

const PAGE_SIZE = 20;

export default function UsersPage() {
  const t     = useTranslations("Admin");
  const toast = useToast();

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
    listener: "badge badge-sm bg-base-content/20 text-base-content/80",
  };

  const RoleBadges = ({ roles }: { roles?: Role[] }) => (
    <div className="flex flex-wrap gap-1">
      {(roles ?? []).map((r) => (
        <span key={r} className={roleBadgeClass[r]}>{roleLabel(r)}</span>
      ))}
    </div>
  );

  const initials = (name: string) =>
    name.split(/[\s-]+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";

  const [form, setForm] = useState({
    email:           "",
    displayName:     "",
    role:            "listener" as Role,
    password:        "",
    timezone:        "",
    language:        "",
    profileImageUrl: "",
  });

  const [errors, setErrors]                  = useState<Record<string, string>>({});
  const [cropFile, setCropFile]               = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview]     = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearFieldError = (field: string) =>
    setErrors((prev) => { const { [field]: _, ...rest } = prev; return rest; });

  const updateField = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    clearFieldError(field);
  };

  // ── Validation ──────────────────────────────────────────────────────────
  const validateForm = async (): Promise<Record<string, string>> => {
    const errs: Record<string, string> = {};

    if (dialogMode === "create") {
      if (!form.email.trim()) {
        errs.email = t("emailRequired");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        errs.email = t("emailInvalid");
      } else {
        try {
          const { data: res } = await api.get<{ available: boolean }>(
            API_ENDPOINTS.auth.checkEmail,
            { params: { email: form.email.trim() } },
          );
          if (!res.available) errs.email = t("emailAlreadyExists");
        } catch { /* ignore check failure */ }
      }
    }

    if (!form.displayName.trim()) {
      errs.displayName = t("displayNameRequired");
    } else if (form.displayName.trim().length < 3) {
      errs.displayName = t("displayNameMinLength");
    }

    if (dialogMode === "create") {
      if (!form.password) {
        errs.password = t("passwordRequired");
      } else if (form.password.length < 3) {
        errs.password = t("passwordMinLength");
      }
    } else if (form.password && form.password.length < 3) {
      errs.password = t("passwordMinLength");
    }

    return errs;
  };

  // ── Avatar upload ───────────────────────────────────────────────────────
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setCropFile(file);
  };

  const uploadCroppedAvatar = async (blob: Blob, filename: string) => {
    setCropFile(null);
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", new File([blob], filename, { type: blob.type }));
      const res = await fetch("/api/avatars/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { key } = await res.json() as { key: string };
      setForm((p) => ({ ...p, profileImageUrl: key }));
      setAvatarPreview(URL.createObjectURL(blob));
    } catch {
      toast.error("Avatar upload failed");
    } finally {
      setAvatarUploading(false);
    }
  };

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
    setDialogMode("create"); setDialogUser(null); setErrors({}); setAvatarPreview(null);
    setForm({ email: "", displayName: "", role: "listener", password: "", timezone: "", language: "", profileImageUrl: "" });
    setDialogOpen(true);
  };

  const openView = async (u: UserDTO) => {
    setDialogMode("view"); setDialogOpen(true); setDialogUser(null); setErrors({});
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
    setDialogMode("edit"); setDialogOpen(true); setErrors({}); setAvatarPreview(null);
    const { data: full } = await api.get<UserDetailDTO>(API_ENDPOINTS.admin.userDetail(base.id));
    setDialogUser(full);
    setForm({ email: full.email ?? "", displayName: full.displayName ?? "", role: full.role, password: "", timezone: full.timezone, language: full.language, profileImageUrl: full.profileImageUrl ?? "" });
  };

  const saveUser = async () => {
    const validationErrors = await validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (dialogMode === "create") {
        const { data: created } = await api.post<UserDetailDTO>(API_ENDPOINTS.admin.users, {
          email: form.email.trim(), displayName: form.displayName.trim(), password: form.password, role: form.role,
          timezone: form.timezone, language: form.language, profileImageUrl: form.profileImageUrl || null,
        });
        await reload(); setDialogUser(created); setDialogMode("view");
        toast.success(t("toastSaved"));
        return;
      }
      if (dialogMode === "edit" && dialogUser) {
        const { data: updated } = await api.put<UserDetailDTO>(API_ENDPOINTS.admin.userDetail(dialogUser.id), {
          displayName: form.displayName.trim(), role: form.role, timezone: form.timezone,
          language: form.language, profileImageUrl: form.profileImageUrl || null,
          password: form.password || undefined,
        });
        await reload(); setDialogUser(updated); setDialogMode("view");
        toast.success(t("toastSaved"));
      }
    } catch (err) {
      const msg = parseAxiosError(err);
      if (msg.toLowerCase().includes("email")) {
        setErrors({ email: msg });
      } else {
        setErrors({ _server: msg });
      }
    }
  };

  const deleteUser = async (u: UserDTO) => {
    if (!confirm(`${t("deleteUserQuestion")} #${u.id} (${u.email})?`)) return;
    try {
      await api.delete(API_ENDPOINTS.admin.userDetail(u.id));
      await reload();
      if (dialogUser?.id === u.id) { setDialogOpen(false); setDialogUser(null); }
      toast.success(t("toastDeleted"));
    } catch (err) {
      toast.error(parseAxiosError(err));
    }
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

  // ── Detail view ─────────────────────────────────────────────────────────
  const DetailView = () => {
    if (!dialogUser) return (
      <div className="flex justify-center py-4">
        <AdminSpinner />
      </div>
    );

    return (
      <div className="space-y-4">
        {/* Header with avatar + main info */}
        <div className="flex items-center gap-4 rounded-lg bg-base-300/50 p-4">
          {dialogUser.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dialogUser.profileImageUrl}
              alt={dialogUser.displayName}
              className="h-14 w-14 rounded-full object-cover border-2 border-base-content/20 shadow"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-info text-white font-bold text-lg shadow">
              {initials(dialogUser.displayName)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base truncate">{dialogUser.displayName}</div>
            <div className="text-xs text-base-content/60 truncate">{dialogUser.email}</div>
            <div className="mt-1.5"><RoleBadges roles={dialogUser.roles as Role[]} /></div>
          </div>
          <div className="text-xs text-base-content/40 self-start">#{dialogUser.id}</div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          <AdminDetailField label={t("timezone")} value={dialogUser.timezone} block />
          <AdminDetailField label={t("language")} value={dialogUser.language} block />
          <AdminDetailField label={t("createdAt")} value={new Date(dialogUser.createdAt).toLocaleString()} block />
          <AdminDetailField label={t("updatedAt")} value={new Date(dialogUser.updatedAt).toLocaleString()} block />
        </div>
      </div>
    );
  };

  // ── Form field helper ───────────────────────────────────────────────────
  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-xs text-error mt-1">{errors[field]}</p> : null;

  const inputCls = (field: string) =>
    `input input-bordered w-full${errors[field] ? " input-error" : ""}`;

  // ── Form view ───────────────────────────────────────────────────────────
  const FormView = () => (
    <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
      {errors._server && (
        <div className="rounded-lg bg-error/10 border border-error/30 px-3 py-2 text-xs text-error">
          {errors._server}
        </div>
      )}

      <div className="form-control">
        <fieldset className="fieldset">
          <span className="text-base">{t("email")}</span>
          <input
            className={inputCls("email")}
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            disabled={isReadOnly || dialogMode === "edit"}
          />
          <FieldError field="email" />
        </fieldset>
      </div>

      <div className="form-control">
        <fieldset className="fieldset">
          <span className="text-base">{t("nickname")}</span>
          <input
            className={inputCls("displayName")}
            value={form.displayName}
            onChange={(e) => updateField("displayName", e.target.value)}
            disabled={isReadOnly}
          />
          <FieldError field="displayName" />
        </fieldset>
      </div>

      <div className="form-control">
        <fieldset className="fieldset">
          <span className="text-base">{t("role")}</span>
          <select
            className="select select-bordered w-full"
            value={form.role}
            onChange={(e) => updateField("role", e.target.value)}
            disabled={isReadOnly}
          >
            <option value="listener">{t("listener")}</option>
            <option value="artist">{t("artist")}</option>
            <option value="admin">{t("admin")}</option>
          </select>
        </fieldset>
      </div>

      <div className="form-control">
        <fieldset className="fieldset">
          <span className="text-base">{dialogMode === "create" ? t("password") : t("newPassword")}</span>
          <input
            type="password"
            autoComplete="new-password"
            className={inputCls("password")}
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
          />
          <FieldError field="password" />
        </fieldset>
      </div>

      <div className="form-control">
        <fieldset className="fieldset">
          <span className="text-base">{t("timezone")}</span>
          <input
            className="input input-bordered w-full"
            value={form.timezone}
            onChange={(e) => updateField("timezone", e.target.value)}
          />
        </fieldset>
      </div>

      <div className="form-control">
        <fieldset className="fieldset">
          <span className="text-base">{t("language")}</span>
          <input
            className="input input-bordered w-full"
            value={form.language}
            onChange={(e) => updateField("language", e.target.value)}
          />
        </fieldset>
      </div>

      {/* Avatar upload */}
      <div className="form-control">
        <fieldset className="fieldset">
          <span className="text-base">{t("profileImage")}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarSelect}
          />
          <div className="flex items-center gap-3">
            {(avatarPreview || form.profileImageUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview ?? form.profileImageUrl}
                alt="avatar"
                className="h-12 w-12 rounded-full object-cover border border-base-300"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-base-300 text-base-content/40">
                <User size={20} />
              </div>
            )}
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
            >
              {avatarUploading ? (
                <><AdminSpinner size="xs" /> {t("uploading")}</>
              ) : (
                <><Upload size={14} /> {form.profileImageUrl ? t("changeImage") : t("chooseImage")}</>
              )}
            </button>
          </div>
        </fieldset>
      </div>
    </form>
  );

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
          {refreshing ? <AdminSpinner size="sm" /> : <RotateCcw size={18} />}
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
        title={
          dialogMode === "create" ? t("newUser")
          : dialogMode === "edit"  ? t("editUser")
          : t("detailUser")
        }
      >
        {dialogMode === "view" ? <DetailView /> : <FormView />}
      </Dialog>

      {cropFile && (
        <ImageCropModal
          file={cropFile}
          aspect={1}
          onSave={uploadCroppedAvatar}
          onClose={() => setCropFile(null)}
        />
      )}
    </div>
  );
}
