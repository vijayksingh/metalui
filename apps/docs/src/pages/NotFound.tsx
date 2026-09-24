import { Link, isRouteErrorResponse, useRouteError } from 'react-router';

export function NotFound() {
  const error = useRouteError();
  const message = error
    ? isRouteErrorResponse(error)
      ? `${error.status} · ${error.statusText}`
      : 'Something broke while loading this page.'
    : 'There is nothing at this address.';
  return (
    <div className="flex min-h-[60vh] flex-col items-start justify-center gap-16 px-24">
      <span className="type-readout text-ink2">404</span>
      <h1 className="page-title text-ink">Empty pocket.</h1>
      <p className="page-lede text-ink2">{message}</p>
      <Link to="/" className="type-ui text-ink">Back to the overview</Link>
    </div>
  );
}
