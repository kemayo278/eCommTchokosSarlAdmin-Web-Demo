import ZoneForm from "@/components/setting/shipping/Form/ZoneForm";

export const metadata = { title: "Modifier la zone" };

export default async function EditZonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ZoneForm zoneId={Number(id)} />;
}
