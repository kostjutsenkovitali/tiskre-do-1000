import { Html, Head, Main, NextScript } from 'next/document'

// Make this document statically generated
export const dynamic = 'force-static';

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}