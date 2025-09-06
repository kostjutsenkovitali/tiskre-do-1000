'use client';

// Make this page statically generated
export const dynamic = 'force-static';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4">Oops!</h1>
        <h2 className="text-2xl mb-6">Something went wrong</h2>
        <p className="text-muted-foreground mb-8">
          An error occurred while loading this page.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}