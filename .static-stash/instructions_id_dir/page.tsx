import InstructionsDynamicClient from "@/components/InstructionsDynamicClient";
type PageProps = { params: { id: string } };
export default function ProductInstructions({ params }: PageProps) {
  return <InstructionsDynamicClient id={params.id} />;
}

export async function generateStaticParams() {
  return [] as Array<{ id: string }>;
}
// For output: export, provide an empty list so Next can statically export this route directory
export async function generateStaticParams() {
  return [] as Array<{ id: string }>;
}
