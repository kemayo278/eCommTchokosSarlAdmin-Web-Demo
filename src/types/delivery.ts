import type { Order, OrderItem } from "./order";

export type DeliveryStatus =
  | "pending"
  | "assigned"
  | "in_transit"
  | "delivered"
  | "failed";

export interface Delivery {
  id: number;
  orderId: number;
  order: Order;
  livreurId: number | null;
  livreur: { id: number; name: string; phone: string } | null;
  zoneId: number | null;
  deliveryCode: string;
  qrCodeUrl: string;
  status: DeliveryStatus;
  currentLocation: string | null;
  scheduledDate: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  confirmedAt: string | null;
  recipientName: string;
  recipientRelation: string;
  notes: string;
  signature: string | null;
  canConfirm: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  id: number;
  deliveryId: number;
  status: string;
  location: string | null;
  description: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

export interface DeliveryDetail extends Delivery {
  order: Order & { items: OrderItem[] };
  trackingEvents: TrackingEvent[];
}

export interface DeliveryPaginated {
  data: Delivery[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}
