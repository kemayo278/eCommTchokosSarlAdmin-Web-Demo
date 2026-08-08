import VideoView from "@/components/video/View/VideoView";

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VideoView videoId={Number(id)} />;
}
