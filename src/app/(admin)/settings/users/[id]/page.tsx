import UserDetail from "@/components/user/Detail/UserDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params;
  return <UserDetail userId={Number(id)} />;
}
