import PackForm from "@/components/pack/Form/PackForm";

export default async function EditPackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PackForm packId={Number(id)} />;
}
