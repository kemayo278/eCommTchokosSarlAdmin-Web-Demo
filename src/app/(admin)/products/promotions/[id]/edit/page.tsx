import PromotionForm from "@/components/promotion/Form/PromotionForm";

export default async function EditPromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PromotionForm couponId={Number(id)} />;
}
