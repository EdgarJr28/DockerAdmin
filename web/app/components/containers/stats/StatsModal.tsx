// components/containers/stats/StatsModal.tsx
"use client";
import Modal from "@/app/components/ui/Modal";
import Button from "@/app/components/ui/Button";
import StatsCard from "@/app/components/containers/stats/StatsCard";

export default function StatsModal({
  id,
  name,
  open,
  onClose,
}: {
  id: string;
  name: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      title={`📊 ${name}`}
      onClose={onClose}
      footer={
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {/* ✅ Reutilizamos StatsCard y apagamos el polling cuando el modal está cerrado */}
      <StatsCard id={id} enabled={open} intervalMs={3000} />
    </Modal>
  );
}
