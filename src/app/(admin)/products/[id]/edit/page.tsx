import ProductForm from "@/components/product/Form/ProductForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  return <ProductForm productId={Number(id)} />;
}
