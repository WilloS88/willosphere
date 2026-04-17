"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Settings, Save } from "lucide-react";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import { AdminSpinner } from "@/app/components/admin";

type ConfigParam = {
  paramKey:     string;
  paramValue:   string;
  description:  string | null;
  updatedAt:    string;
};

export default function AlgorithmConfigPage() {
  const t                         = useTranslations("Admin");
  const [params, setParams]       = useState<ConfigParam[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    api.get<ConfigParam[]>(API_ENDPOINTS.algorithmConfig.list)
      .then(({ data }) => setParams(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (param: ConfigParam) => {
    setEditing(param.paramKey);
    setEditValue(param.paramValue);
  };

  const saveEdit = async (key: string) => {
    setSaving(true);
    try {
      const { data } = await api.patch<ConfigParam>(
        API_ENDPOINTS.algorithmConfig.update(key),
        { paramValue: Number(editValue) },
      );
      setParams((prev) =>
        prev.map((p) => (p.paramKey === key ? data : p)),
      );
      setEditing(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue("");
  };

  if(loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <AdminSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="min-h-12 sm:h-14 bg-base-100 border-b border-base-300 flex items-center px-3 sm:px-6">
        <Settings size={20} className="mr-2" />
        <span className="font-semibold text-sm sm:text-lg">{t("algorithmTitle")}</span>
      </header>

      <main className="p-4 flex-1 overflow-auto">
        <div className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body p-0">
            <table className="table table-zebra table-xs sm:table-sm">
              <thead>
                <tr>
                  <th>{t("algorithmColParam")}</th>
                  <th>{t("algorithmColValue")}</th>
                  <th className="hidden sm:table-cell">{t("algorithmColDesc")}</th>
                  <th className="w-24">{t("algorithmColAction")}</th>
                </tr>
              </thead>
              <tbody>
                {params.map((p) => (
                  <tr key={p.paramKey}>
                    <td>
                      <div className="font-mono text-sm font-semibold">{p.paramKey}</div>
                      <div className="text-xs text-base-content/50">
                        {t.has(`paramLabels.${p.paramKey}`) ? t(`paramLabels.${p.paramKey}`) : ""}
                      </div>
                    </td>
                    <td>
                      {editing === p.paramKey ? (
                        <input
                          type="number"
                          step="any"
                          className="input input-bordered input-sm w-32"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if(e.key === "Enter")
                              saveEdit(p.paramKey);
                            if(e.key === "Escape")
                              cancelEdit();
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="font-mono">{Number(p.paramValue).toFixed(4)}</span>
                      )}
                    </td>
                    <td className="hidden sm:table-cell text-sm text-base-content/60">
                      {p.description}
                    </td>
                    <td>
                      {editing === p.paramKey ? (
                        <div className="flex gap-1">
                          <button
                            className="btn btn-success btn-xs"
                            onClick={() => saveEdit(p.paramKey)}
                            disabled={saving}
                          >
                            <Save size={12} />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={cancelEdit}
                          >
                            {t("algorithmCancel")}
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => startEdit(p)}
                        >
                          {t("edit")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
