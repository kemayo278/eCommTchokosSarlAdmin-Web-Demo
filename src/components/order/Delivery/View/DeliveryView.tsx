"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Package,
  Phone,
  QrCode,
  Truck,
  User as UserIcon,
} from "lucide-react";
import { PageHeader, SectionCard, Button } from "@/components/ui/primitives";
import { BadgeDeliveryStatus, BadgeOrderStatus, BadgePaymentMethod, BadgePaymentStatus } from "@/components/ui/statuts";
import AssignLivreurDialog from "./AssignLivreurDialog";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import { fcfa } from "@/lib/format";
import type { DeliveryDetail } from "@/types/delivery";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Row({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-secondary">{valeur}</dd>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DeliveryView({ deliveryId }: { deliveryId?: string }) {
  const [delivery, setDelivery] = useState<DeliveryDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [showAssign, setShowAssign] = useState(false);

  const fetchDelivery = useCallback(() => {
    setLoading(true);
    axiosClient
      .get<DeliveryDetail>(`/v1/deliveries/${deliveryId}`)
      .then(({ data }) => setDelivery(data))
      .catch((err) => setError(handleApiError(err, "Impossible de charger la livraison")))
      .finally(() => setLoading(false));
  }, [deliveryId]);

  useEffect(() => { fetchDelivery(); }, [fetchDelivery]);

  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorAlert message={error} />;
  if (!delivery) return null;

  const { order, livreur, trackingEvents } = delivery;

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" href="/orders/deliveries" className="!px-2.5">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          titre={delivery.deliveryCode}
          sousTitre={`Créée le ${formatDateShort(delivery.createdAt)} · Commande ${order.orderNumber}`}
          action={<BadgeDeliveryStatus statut={delivery.status} />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ── Colonne gauche ────────────────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-2">

          {/* Articles */}
          <SectionCard title="Articles de la commande">
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                      {item.quantity}×
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-secondary">
                        {item.productName}
                      </p>
                      <p className="text-xs text-slate-400">{item.productSku}</p>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-secondary">
                    {fcfa(item.subtotal)}
                  </p>
                </div>
              ))}
              {order.items.length === 0 && (
                <p className="flex items-center gap-2 text-sm text-slate-400">
                  <Package className="h-4 w-4" /> Aucun article
                </p>
              )}
            </div>

            <dl className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <Row label="Sous-total"  valeur={fcfa(order.subtotal)}    />
              <Row label="Livraison"   valeur={fcfa(order.shippingCost)} />
              {order.discount > 0 && (
                <Row label="Remise" valeur={`- ${fcfa(order.discount)}`} />
              )}
              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <dt className="font-bold text-secondary">Total</dt>
                <dd className="text-lg font-extrabold text-primary-dark">
                  {fcfa(order.total)}
                </dd>
              </div>
            </dl>
          </SectionCard>

          {/* Suivi */}
          <SectionCard title="Historique de suivi">
            {trackingEvents.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun événement de suivi.</p>
            ) : (
              <ol className="relative border-l border-slate-200 pl-6 space-y-5">
                {[...trackingEvents]
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .map((evt, i) => (
                    <li key={evt.id} className="relative">
                      <span
                        className={`absolute -left-[1.6rem] flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-surface ${
                          i === 0 ? "bg-primary" : "bg-slate-300"
                        }`}
                      >
                        {i === 0 ? (
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        ) : (
                          <Clock className="h-3 w-3 text-white" />
                        )}
                      </span>
                      <p className="text-sm font-semibold text-secondary">
                        {evt.description}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        {formatDate(evt.createdAt)}
                        {evt.location && (
                          <>
                            <MapPin className="ml-1 h-3 w-3" />
                            {evt.location}
                          </>
                        )}
                      </p>
                    </li>
                  ))}
              </ol>
            )}
          </SectionCard>
        </div>

        {/* ── Colonne droite ────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Infos livraison */}
          <SectionCard title="Livraison">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Statut</dt>
                <dd><BadgeDeliveryStatus statut={delivery.status} /></dd>
              </div>
              {delivery.scheduledDate && (
                <Row label="Planifiée le" valeur={formatDateShort(delivery.scheduledDate)} />
              )}
              {delivery.pickedUpAt && (
                <Row label="Prise en charge" valeur={formatDate(delivery.pickedUpAt)} />
              )}
              {delivery.deliveredAt && (
                <Row label="Livrée le" valeur={formatDate(delivery.deliveredAt)} />
              )}
              {delivery.currentLocation && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span className="text-secondary">{delivery.currentLocation}</span>
                </div>
              )}
            </dl>

            {/* QR code */}
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-slate-200 p-3">
              <QrCode className="h-5 w-5 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="text-xs text-slate-400">Code QR de validation</p>
                <p className="truncate font-mono text-xs font-semibold text-secondary">
                  {delivery.deliveryCode}
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Livreur */}
          <SectionCard
            title="Livreur"
            action={
              <button
                type="button"
                onClick={() => setShowAssign(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-secondary transition hover:bg-slate-50"
              >
                <Truck className="h-3.5 w-3.5" />
                {livreur ? "Réassigner" : "Assigner"}
              </button>
            }
          >
            {livreur ? (
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-white">
                  {livreur.name
                    .split(" ")
                    .map((w) => w[0] ?? "")
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </span>
                <div>
                  <p className="font-bold text-secondary">{livreur.name}</p>
                  {livreur.phone && (
                    <p className="flex items-center gap-1 text-xs text-slate-400">
                      <Phone className="h-3 w-3" />
                      {livreur.phone}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-warn">
                <UserIcon className="h-4 w-4" /> Non assigné
              </p>
            )}
          </SectionCard>

          {/* Commande */}
          <SectionCard title="Commande">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">N°</dt>
                <dd>
                  <Button variant="ghost" href={`/orders/${order.id}`} className="!p-0 !text-sm font-semibold text-primary">
                    {order.orderNumber}
                  </Button>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Statut</dt>
                <dd><BadgeOrderStatus statut={order.status} /></dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-slate-500">
                  <CreditCard className="h-3.5 w-3.5" /> Paiement
                </dt>
                <dd className="flex items-center gap-2">
                  <BadgePaymentMethod method={order.paymentMethod} />
                  <BadgePaymentStatus statut={order.paymentStatus} />
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <dt className="font-bold text-secondary">Total</dt>
                <dd className="font-extrabold text-primary-dark">{fcfa(order.total)}</dd>
              </div>
            </dl>
            {order.notes && (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                {order.notes}
              </p>
            )}
          </SectionCard>

        </div>
      </div>

      <AssignLivreurDialog
        deliveryId={deliveryId!}
        open={showAssign}
        onOpenChange={setShowAssign}
        onSuccess={fetchDelivery}
      />
    </div>
  );
}
