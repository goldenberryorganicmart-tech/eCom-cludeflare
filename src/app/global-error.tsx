export const runtime = 'edge';

import GlobalErrorClient from './global-error-client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <GlobalErrorClient error={error} reset={reset} />;
}
