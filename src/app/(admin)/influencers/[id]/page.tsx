import InfluencerDetail from "@/components/influencer/Detail/InfluencerDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InfluencerPage({ params }: Props) {
  const { id } = await params;
  return <InfluencerDetail influencerId={Number(id)} />;
}
