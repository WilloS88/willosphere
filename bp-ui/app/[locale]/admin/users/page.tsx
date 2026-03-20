"use client"

import { useEffect, useState } from "react";
import { useTranslations } from "use-intl";
import { Pencil, Plus, Trash2, Users, RotateCcw  } from "lucide-react";
import type { UserDetailDTO, UserDTO } from "@/app/types/user";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import { Dialog } from "@/app/components/admin/Dialog";
import api from "@/lib/axios";

export default function UsersPage() {
  const t                                   = useTranslations("Admin");
  const [users, setUsers]                   = useState<UserDTO[]>([]);
  const [loading, setLoading]               = useState(true);
  const [dialogOpen, setDialogOpen]         = useState(false);
  const [dialogMode, setDialogMode]         = useState<"create" | "edit" | "view">("view");
  const [dialogUser, setDialogUser]         = useState<UserDetailDTO | null>(null);
  const [refreshing, setRefreshing]         = useState(false);

  type Role         = "listener" | "artist" | "admin";
  const roleLabel   = (role?: Role | null) =>t(role ?? "");
  const isReadOnly  = dialogMode === "view";

  const reloadUsers = async () => {
    setLoading(true);

    const { data } = await api.get<UserDTO[]>(API_ENDPOINTS.admin.users);
    setUsers(data);

    setLoading(false);
  };

  useEffect(() => {
    reloadUsers().catch(console.error);
  }, []);

  const [form, setForm] = useState({
    email:            "",
    displayName:      "",
    role:             "listener" as Role,
    password:         "",
    timezone:         "",
    language:         "",
    profileImageUrl:  "",
  });

  const openCreate = () => {
    setDialogMode("create");
    setDialogUser(null);
    setForm({
      email:            "",
      displayName:      "",
      role:             "listener",
      password:         "",
      timezone:         "",
      language:         "",
      profileImageUrl:  "",
    });
    setDialogOpen(true);
  };

  const openView = async (u: UserDTO) => {
    setDialogMode("view");
    setDialogOpen(true);
    setDialogUser(null);
    setForm((p) => ({
      ...p,
      email:        u.email,
      displayName:  u.displayName,
      role:         u.role ?? "listener",
      password:     "",
    }));

    try {
      const { data: full } = await api.get<UserDetailDTO>(API_ENDPOINTS.admin.userDetail(u.id));
      setDialogUser(full);
      setForm({
        email:            full.email,
        displayName:      full.displayName,
        role:             full.role,
        password:         "",
        timezone:         full.timezone,
        language:         full.language,
        profileImageUrl:  full.profileImageUrl ?? "",
      });
    } catch (e) {
      console.error("Failed to load user detail", e);
    }
  };

  const openEdit = async (u?: UserDTO) => {
    const base = u ?? dialogUser;
    if(!base)
      return;

    setDialogMode("edit");
    setDialogOpen(true);

    const { data: full } = await api.get<UserDetailDTO>(API_ENDPOINTS.admin.userDetail(base.id));
    setDialogUser(full);

    setForm({
      email:            full.email ?? "",
      displayName:      full.displayName ?? "",
      role:             full.role,
      password:         "",
      timezone:         full.timezone,
      language:         full.language,
      profileImageUrl:  full.profileImageUrl ?? "",
    });
  };

  const saveUser = async () => {
    if(dialogMode === "create") {
      const { data: created } = await api.post<UserDetailDTO>(API_ENDPOINTS.admin.users, {
        displayName:      form.displayName.trim(),
        password:         form.password,
        role:             form.role,
        timezone:         form.timezone,
        language:         form.language,
        profileImageUrl:  form.profileImageUrl ? form.profileImageUrl : null,
      });

      await reloadUsers();
      setDialogUser(created);
      return;
    }

    if(dialogMode === "edit") {
      if(!dialogUser)
        throw new Error("No selected user detail loaded");

      const { data: updated } = await api.put<UserDetailDTO>(
        API_ENDPOINTS.admin.userDetail(dialogUser.id), {
          displayName:      form.displayName.trim(),
          role:             form.role,
          timezone:         form.timezone,
          language:         form.language,
          profileImageUrl:  form.profileImageUrl ? form.profileImageUrl : null,
          password:         form.password ? form.password : undefined,
        }
      );

      await reloadUsers();
      setDialogUser(updated);
    }
  };

  const deleteUser = async (u: UserDTO) => {
    const ok = confirm(`${t("deleteUserQuestion")} #${u.id} (${u.email})?`);

    if(!ok)
      return;

    await api.delete(API_ENDPOINTS.admin.userDetail(u.id));
    await reloadUsers();

    if(dialogUser?.id === u.id) {
      setDialogOpen(false);
      setDialogUser(null);
    }
  };

  const refresh = async () => {
    try {
      setRefreshing(true);
      await reloadUsers();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="h-14 bg-white border-b flex items-center justify-between px-4 rounded-sm">
        <div className="font-semibold flex">
          <Users />
          {t("users")}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-sm btn-info text-white text-base"
            onClick={openCreate}
            title={t("newUser")}
            type="button"
          >
            <Plus size={25} color="#ffffff" />
            {t("newUser")}
          </button>

          <button
            className="btn btn-soft btn-square"
            onClick={refresh}
            disabled={loading || refreshing}
            title={t("refresh")}
            type="button"
          >
            {refreshing ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <RotateCcw size={20} />
            )}
          </button>
        </div>
      </header>

      <main className="pt-2 flex-1 overflow-auto">
        <div className="bg-white border rounded shadow-sm overflow-x-auto">
          <table className="table table-zebra table-sm w-full">
            <thead className="bg-slate-100 text-xs uppercase">
            <tr className="text-black">
              <th>{t("id")}</th>
              <th>{t("email")}</th>
              <th>{t("nickname")}</th>
              <th>{t("role")}</th>
              <th className="text-center">{t("operations")}</th>
            </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-6">
                    <span className="loading loading-spinner"></span>
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr
                    key={user.id}
                    className="hover:bg-stone-200 transition-colors duration-200 cursor-pointer"
                    onClick={() => openView(user)}
                  >
                    <td>{user.id}</td>
                    <td>{user.email}</td>
                    <td>{user.displayName}</td>
                    <td>{roleLabel(user.role as Role)}</td>
                    <td className="text-center">
                      <div className="flex justify-center items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void openEdit(user);
                          }}
                          className="btn btn-xs btn-info"
                          title={`${t("edit")}`}
                        >
                          <Pencil size={20} color="#ffffff" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteUser(user).catch(console.error);
                          }}
                          className="btn btn-xs btn-error"
                          title={`${t("delete")}`}
                        >
                          <Trash2 size={20} color="#ffffff" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>

          {/* PAGINATION */}
          <div className="flex items-center justify-between p-3 border-t text-sm">
            <span></span>
          </div>
        </div>
      </main>

      <Dialog
        open={dialogOpen}
        mode={dialogMode}
        onCloseAction={() => setDialogOpen(false)}
        onEdit={dialogMode === "view" ? () => openEdit() : undefined}
        onSave={dialogMode !== "view" ? saveUser : undefined}
        closeAfterSave
        title={
          dialogMode === "create"
            ? t("newUser")
            : dialogMode === "edit"
              ? t("editUser")
              : t("detailUser")
        }
      >
        <div className="space-y-4 text-sm">
          {dialogMode !== "create" && dialogUser && (
            <div><b>ID:</b>&nbsp;{dialogUser.id}</div>
          )}
        </div>

        {dialogMode !== "view" && (
          <>
            <form>
              <div className="form-control">
                <fieldset className="fieldset">
                  <span className="text-base">{t("email")}</span>
                  <input
                    className="input input-bordered w-100"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    disabled={isReadOnly || dialogMode === "edit"}
                  />
                </fieldset>
              </div>

              <div className="form-control">
                <fieldset className="fieldset">
                  <span className="text-base">{t("nickname")}</span>
                  <input
                    className="input w-100"
                    value={form.displayName}
                    onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                    disabled={isReadOnly}
                  />
                </fieldset>
              </div>

              <div className="form-control">
                <fieldset className="fieldset">
                  <span className="text-base">{t("role")}</span>
                  <select
                    className="select select-bordered w-100"
                    value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as Role }))}
                    disabled={isReadOnly}
                    data-theme="light"
                  >
                    <option value="listener">{t("listener")}</option>
                    <option value="artist">{t("artist")}</option>
                    <option value="admin">{t("admin")}</option>
                  </select>
                </fieldset>
              </div>

              <div className="form-control">
                <fieldset className="fieldset">
                  <span className="text-base">{dialogMode === "create" ? `${t("password")}` : `${t("newPassword")}`}</span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    className="input input-bordered w-100"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    data-theme="light"
                  />
                </fieldset>
              </div>

              <div className="form-control">
                <fieldset className="fieldset">
                  <span className="text-base">{t("timezone")}</span>
                  <input
                    type="text"
                    className="input input-bordered w-100"
                    value={form.timezone}
                    onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
                    data-theme="light"
                  />
                </fieldset>
              </div>

              <div className="form-control">
                <fieldset className="fieldset">
                  <span className="text-base">{t("language")}</span>
                  <input
                    className="input input-bordered w-100"
                    value={form.language}
                    onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
                    data-theme="light"
                  />
                </fieldset>
              </div>

              <div className="form-control">
                <fieldset className="fieldset">
                  <span className="text-base">{t("profileImageUrl")}</span>
                  <input
                    className="input input-bordered w-100"
                    value={form.profileImageUrl}
                    onChange={(e) => setForm((p) => ({ ...p, profileImageUrl: e.target.value }))}
                    data-theme="light"
                  />
                </fieldset>
              </div>
            </form>

          </>
        )}

        {dialogMode === "view" && (
          dialogUser ? (
            <div className="text-xs opacity-80 space-y-1">
              <div><b>email:</b> {dialogUser.email}</div>
              <div><b>displayName:</b> {dialogUser.displayName}</div>
              <div><b>role:</b> {dialogUser.role}</div>
              <div><b>Timezone:</b> {dialogUser.timezone}</div>
              <div><b>Language:</b> {dialogUser.language}</div>
              <div><b>Created:</b> {new Date(dialogUser.createdAt).toLocaleString()}</div>
              <div><b>Updated:</b> {new Date(dialogUser.updatedAt).toLocaleString()}</div>
            </div>
          ) : (
            <div className="text-xs opacity-80">Loading detail…</div>
          )
        )}


      </Dialog>
    </div>
  );
}
