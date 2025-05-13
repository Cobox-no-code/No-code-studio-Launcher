import dynamic from 'next/dynamic';
import ReportLayout from '@/components/_reports/ReportLayout';

// Lazy load the client-side report viewer
const ReportClient = dynamic(() => import('@/components/_reports/ReportClient'), {
  ssr: false,
});

export default function ReportPage() {
  return (
    <ReportLayout>
      <ReportClient />
    </ReportLayout>
  );
}
