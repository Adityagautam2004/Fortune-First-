import NextErrorComponent, { ErrorProps } from 'next/error';

// Same reasoning as pages/_document.tsx: Next's built-in default error page
// (used only for the auto-generated static /500 fallback, never real app/
// routes) fails during `next build`'s static export in this project.
// Providing an explicit passthrough sidesteps whatever is broken internally.
function Error({ statusCode }: ErrorProps) {
  return <NextErrorComponent statusCode={statusCode} />;
}

Error.getInitialProps = NextErrorComponent.getInitialProps;

export default Error;
