"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import HeroForm from "@/components/hero/Form/HeroForm";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import { HeroImage } from "@/types/heroimage";

export default function HeroImagesEditPage() {
  const { id } = useParams<{ id: string }>();
  const [hero, setHero] = useState<HeroImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axiosClient
      .get<HeroImage>(`/v1/hero-images/${id}`)
      .then(({ data }) => setHero(data))
      .catch((err) => setError(handleApiError(err, "Impossible de charger l'image.")))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  
  if (error || !hero) return <ErrorAlert message={error ?? "Image introuvable."} />;

  return <HeroForm initial={hero} />;
}
