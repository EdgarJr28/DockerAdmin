"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import { Skeleton } from "@/app/components/ui/Skeleton";
import Modal from "@/app/components/ui/Modal";
import { useToastStore } from "@/app/store/toast-store";
import { Edit, Trash2, Plus, CheckCircle2, XCircle } from "lucide-react";
import { Hosts } from "@/app/libs/api";
import Input from "@/app/components/ui/Input";

type DockerHost = {
  _id?: string;
  code: string;
  name: string;
  description?: string;
  baseUrl: string;
  enabled: boolean;
  type: string;
  basicUser?: string;
  basicPass?: string;
};

export default function HostsPage() {
  const [items, setItems] = useState<DockerHost[]>([]);
  const [loading, setLoading] = useState(true);

  // modal crear/editar
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState<DockerHost | null>(null);
  const [saving, setSaving] = useState(false);

  // modal confirmación
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    desc: string;
    onConfirm: () => Promise<void> | void;
  }>({
    open: false,
    title: "",
    desc: "",
    onConfirm: async () => { },
  });

  const showToast = useToastStore((s) => s.showToast);

  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    baseUrl: "",
    type: "proxy",
    enabled: true,
    basicUser: "",
    basicPass: "",
  });

  // avisar al header / ServerSelect que debe recargar hosts
  const notifyHostsChanged = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("docker-hosts:reload"));
      window.dispatchEvent(new CustomEvent("docker-hosts:updated"));
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      const data = await Hosts.list();
      setItems(
        (data as any[]).map((h) => ({
          ...h,
          code: h.code ?? h.id,
        }))
      );
    } catch (err: any) {
      showToast(err.message || "Error cargando hosts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm({
      code: "",
      name: "",
      description: "",
      baseUrl: "",
      type: "proxy",
      enabled: true,
      basicUser: "",
      basicPass: "",
    });
    setEditData(null);
    setOpenModal(true);
  };

  const openEdit = (h: DockerHost) => {
    setEditData(h);
    setForm({
      code: h.code,
      name: h.name,
      description: h.description || "",
      baseUrl: h.baseUrl,
      type: h.type || "proxy",
      enabled: h.enabled,
      basicUser: h.basicUser || "",
      basicPass: h.basicPass || "",
    });
    setOpenModal(true);
  };

  // --- VALIDACIÓN FRONT ---
  const validateForm = () => {
    if (!form.code.trim()) {
      showToast("El código es obligatorio.", "error");
      return false;
    }
    if (!form.name.trim()) {
      showToast("El nombre es obligatorio.", "error");
      return false;
    }
    if (!form.baseUrl.trim()) {
      showToast("La URL base es obligatoria.", "error");
      return false;
    }
    if (
      !form.baseUrl.startsWith("http://") &&
      !form.baseUrl.startsWith("https://")
    ) {
      showToast(
        "La URL base debe comenzar con http:// o https://",
        "error"
      );
      return false;
    }
    // no es obligatorio pero ayuda a no guardar https://servidor sin /dockerd/
    if (!form.baseUrl.includes("/dockerd")) {
      showToast(
        "La URL base debería apuntar al proxy de Docker, ej: https://mi-servidor/dockerd/",
        "warning"
      );
      // igual dejamos continuar
    }
    return true;
  };

  const saveHost = async () => {
    // 0) validar antes
    if (!validateForm()) return;

    try {
      setSaving(true);

      // 1) probar conexión primero
      try {
        await Hosts.test({
          baseUrl: form.baseUrl,
          basicUser: form.basicUser || undefined,
          basicPass: form.basicPass || undefined,
        });
      } catch (e: any) {
        // el api ya nos manda message más limpio
        showToast(
          e?.message
            ? `No se pudo conectar al daemon: ${e.message}`
            : "No se pudo conectar al daemon",
          "error"
        );
        return; // ⬅️ no seguimos guardando
      }

      // 2) si la prueba pasó, guardamos
      if (editData) {
        await Hosts.update(form.code, {
          ...form,
        });
      } else {
        await Hosts.create({
          ...form,
        });
      }

      showToast("Host guardado correctamente", "success");
      setOpenModal(false);
      await load();
      notifyHostsChanged();
    } catch (err: any) {
      showToast(err.message || "Error guardando host", "error");
    } finally {
      setSaving(false);
    }
  };

  const askDeleteHost = (code: string) => {
    setConfirm({
      open: true,
      title: "Eliminar host",
      desc: `¿Seguro que quieres eliminar el host "${code}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          await Hosts.remove(code);
          showToast("Host eliminado", "success");
          await load();
          notifyHostsChanged();
        } catch (err: any) {
          showToast(err.message || "Error eliminando host", "error");
        } finally {
          setConfirm((c) => ({ ...c, open: false }));
        }
      },
    });
  };

  const askToggleEnabled = (h: DockerHost) => {
    const toEnable = !h.enabled;
    setConfirm({
      open: true,
      title: toEnable ? "Activar host" : "Desactivar host",
      desc: toEnable
        ? `¿Quieres activar el host "${h.code}"?`
        : `¿Quieres desactivar el host "${h.code}"? Se ocultará del selector.`,
      onConfirm: async () => {
        try {
          await Hosts.update(h.code, { enabled: toEnable });
          showToast(
            toEnable ? "Host activado correctamente" : "Host desactivado",
            "success"
          );
          await load();
          notifyHostsChanged();
        } catch (err: any) {
          showToast(err.message || "Error actualizando estado", "error");
        } finally {
          setConfirm((c) => ({ ...c, open: false }));
        }
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Gestión de Hosts Docker</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo host
        </Button>
      </div>

      {/* tabla */}
      <Card className="overflow-x-auto">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500 p-4">No hay hosts registrados.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-2 font-medium text-slate-600 w-40">
                  Código
                </th>
                <th className="px-4 py-2 font-medium text-slate-600">
                  Nombre
                </th>
                <th className="px-4 py-2 font-medium text-slate-600">
                  URL Base
                </th>
                <th className="px-4 py-2 font-medium text-slate-600 w-24">
                  Tipo
                </th>
                <th className="px-4 py-2 font-medium text-slate-600 w-32">
                  Usuario
                </th>
                <th className="px-4 py-2 font-medium text-slate-600 text-center w-28">
                  Estado
                </th>
                <th className="px-4 py-2 font-medium text-slate-600 text-right w-40">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((h) => (
                <tr
                  key={h.code}
                  className="border-b border-slate-100 hover:bg-slate-50 transition"
                >
                  <td className="px-4 py-2 font-mono text-xs">{h.code}</td>
                  <td className="px-4 py-2">{h.name}</td>
                  <td className="px-4 py-2 text-slate-600">{h.baseUrl}</td>
                  <td className="px-4 py-2 text-slate-600">{h.type}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {h.basicUser || "—"}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {h.enabled ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-xs border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-xs border border-slate-200">
                        <XCircle className="h-3 w-3" /> Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        className="px-2 py-1 text-xs"
                        onClick={() => askToggleEnabled(h)}
                      >
                        {h.enabled ? "Desactivar" : "Activar"}
                      </Button>
                      <Button
                        variant="outline"
                        className="px-2 py-1 text-xs"
                        onClick={() => openEdit(h)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="px-2 py-1 text-xs text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => askDeleteHost(h.code)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* MODAL CREATE/EDIT */}
      <Modal
        open={openModal}
        onClose={() => !saving && setOpenModal(false)}
        title={editData ? "Editar host" : "Nuevo host"}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Código (id) *</label>
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              disabled={!!editData}
              placeholder="Digite el codigo único del host"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Nombre *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Digite el nombre del host"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Descripción</label>
            <Input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Digite la descripción del host"
            />
          </div>
          <div>
            <label className="text-sm font-medium">URL base *</label>
            <Input
              value={form.baseUrl}
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              placeholder="https://mi-servidor/dockerd/"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Input
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                id="enabled"
                type="checkbox"
                checked={form.enabled}
                onChange={(e) =>
                  setForm({ ...form, enabled: e.target.checked })
                }
              />
              <label htmlFor="enabled" className="text-sm">
                Activo
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Basic user</label>
              <Input
                value={form.basicUser}
                onChange={(e) =>
                  setForm({ ...form, basicUser: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Basic pass</label>
              <Input
                value={form.basicPass}
                onChange={(e) =>
                  setForm({ ...form, basicPass: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              variant="outline"
              onClick={() => setOpenModal(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={saveHost} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL CONFIRM */}
      <Modal
        open={confirm.open}
        onClose={() => setConfirm((c) => ({ ...c, open: false }))}
        title={confirm.title}
      >
        <p className="text-sm text-slate-600 mb-4">{confirm.desc}</p>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setConfirm((c) => ({ ...c, open: false }))}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              await confirm.onConfirm();
            }}
          >
            Confirmar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
