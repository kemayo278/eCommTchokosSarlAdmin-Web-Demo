import ChangePasswordForm from "@/components/account/ChangePasswordForm";

interface Props {
  searchParams: Promise<{ forced?: string }>;
}

export default async function ChangePasswordPage({ searchParams }: Props) {
  const { forced } = await searchParams;
  return <ChangePasswordForm forced={forced === "true"} />;
}
