// lib/handleApiError.ts
import { toast } from "@/hooks/use-toast"; // adapte le chemin selon ton projet

interface ApiErrorData {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export function handleApiError(err: any, fallbackTitle = "Erreur"): string {
  // Erreur réseau (ex: Firebase auth, fetch offline, etc.)
  if (err?.code === "auth/network-request-failed" || err?.message === "Network Error") {
    const message = "Vérifiez votre connexion internet et réessayez.";
    toast({
      title: "Problème de connexion",
      description: message,
      variant: "destructive",
    });
    return message;
  }

  const response = err?.response;
  const data: ApiErrorData | undefined = response?.data;
  const status = response?.status;

  // 422 - Erreurs de validation Laravel
  if (status === 422 && data?.errors) {
    const firstErrorKey = Object.keys(data.errors)[0];
    const message =
      data.errors[firstErrorKey]?.[0] ??
      data.message ??
      "Veuillez vérifier les champs du formulaire.";

    toast({
      title: fallbackTitle,
      description: message,
      variant: "destructive",
    });
    return message;
  }

  // 500 ou autres erreurs serveur
  if (status && status >= 500) {
    const message =
      data?.message ?? data?.error ?? "Une erreur serveur est survenue. Veuillez réessayer.";

    toast({
      title: fallbackTitle,
      description: message,
      variant: "destructive",
    });
    return message;
  }

  // Cas générique (400, 401, 403, 404, etc.)
  const message = data?.message ?? data?.error ?? "Une erreur est survenue. Veuillez réessayer.";

  toast({
    title: fallbackTitle,
    description: message,
    variant: "destructive",
  });
  return message;
}