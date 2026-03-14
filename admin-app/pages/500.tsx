import Head from 'next/head';

export default function Custom500() {
  return (
    <>
      <Head>
        <title>Server Error | AMP Pattaya</title>
        <meta
          name="description"
          content="An unexpected server error occurred. Please try again or contact AMP Pattaya."
        />
      </Head>
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>
          Server Error / เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์
        </h1>
        <p style={{ maxWidth: '36rem', color: '#475569', lineHeight: 1.6 }}>
          Please try again in a moment. If the issue persists, contact AMP Pattaya directly and share what you were trying to do.
        </p>
      </main>
    </>
  );
}