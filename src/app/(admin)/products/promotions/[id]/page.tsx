import PromotionView from "@/components/promotion/View/PromotionView";

export default async function PromotionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PromotionView couponId={Number(id)} />;
}
