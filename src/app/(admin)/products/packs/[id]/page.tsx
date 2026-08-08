import PackView from "@/components/pack/View/PackView";

export default async function PackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PackView packId={Number(id)} />;
}
