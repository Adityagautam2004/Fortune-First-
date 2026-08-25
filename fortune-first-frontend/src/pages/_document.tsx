import { Html, Head, Main, NextScript } from 'next/document';

// Next's built-in default _document (used only for the auto-generated
// static /404 and /500 fallback pages, never for real app/ routes) fails
// during `next build`'s static export with "<Html> should not be imported
// outside of pages/_document" in this project. Providing an explicit,
// minimal custom Document sidesteps whatever is broken in the internal
// default one.
export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
