import VideoForm from "@/components/video/Form/VideoForm";

export default async function EditVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VideoForm videoId={Number(id)} />;
}
