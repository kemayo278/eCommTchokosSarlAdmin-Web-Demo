import DeliveryView from "@/components/order/Delivery/View/DeliveryView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DeliveryViewPage({ params }: Props) {
  const { id } = await params;
  return <DeliveryView deliveryId={id} />;
}
