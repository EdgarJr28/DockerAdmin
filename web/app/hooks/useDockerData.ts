"use client";

import { useEffect, useState } from "react";
import { useDockerHost } from "@/app/store/docker-host";

export function useDockerData() {
  const { hostId } = useDockerHost();
  const [containers, setContainers] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hostId) return;
    const base = process.env.NEXT_PUBLIC_API_URL!;
    const key = process.env.NEXT_PUBLIC_API_KEY || "";

    setLoading(true);
    (async () => {
      try {
        const [cRes, iRes] = await Promise.all([
          fetch(`${base}/docker/${hostId}/containers`, {
            headers: { "x-api-key": key },
          }),
          fetch(`${base}/docker/${hostId}/images`, {
            headers: { "x-api-key": key },
          }),
        ]);

        const cJson = await cRes.json();
        const iJson = await iRes.json();

        setContainers(Array.isArray(cJson) ? cJson : []);
        setImages(Array.isArray(iJson) ? iJson : []);
      } catch (e) {
        console.error("Error loading docker data", e);
        setContainers([]);
        setImages([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [hostId]);

  return { hostId, containers, images, loading };
}
