type PageProps = {
  params: Promise<{ slug: string; locale: string }>;
};

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Blog: {slug}</h1>
      <p className="mt-3 text-sm text-muted-foreground">Coming soon.</p>
    </main>
  );
}
