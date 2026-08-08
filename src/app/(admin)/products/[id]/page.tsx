import ProductView from "@/components/product/View/ProductView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductViewPage({ params }: Props) {
  const { id } = await params;
  return <ProductView productId={Number(id)} />;
}
