'use client';
import { useRouter } from 'next/router';
import { DocumentType } from '@/models/document/document.model';
import DocumentListView from './DocumentListView';

const typeMap: Record<string, DocumentType> = {
  'sale-invoice': DocumentType.SALE_INVOICE,
  'sale-order': DocumentType.SALE_ORDER,
  'sale-return': DocumentType.SALE_RETURN,
  'purchase-return': DocumentType.PURCHASE_RETURN,
  'delivery-challan': DocumentType.DELIVERY_CHALLAN,
  'sale-quotation': DocumentType.SALE_QUOTATION,
  'purchase-invoice': DocumentType.PURCHASE_INVOICE,
  'purchase-order': DocumentType.PURCHASE_ORDER,
};

export default function DocumentListClient() {
  const router = useRouter();
  const { type } = router.query;

  const typeParam = type as string;
  const documentType = typeMap[typeParam];

  return <DocumentListView documentType={documentType} />;
}
