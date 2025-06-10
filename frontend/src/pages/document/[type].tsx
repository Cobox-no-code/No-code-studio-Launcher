import dynamic from 'next/dynamic';

const DocumentClient = dynamic(() => import('@/components/_document/DocumentClient'), {
  ssr: false, // must be false for useRouter
});

export default function ListTypePage() {
  return <DocumentClient />;
}