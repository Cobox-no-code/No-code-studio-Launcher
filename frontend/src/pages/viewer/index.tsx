'use client'

import dynamic from 'next/dynamic';
import React from 'react'
const ViewerComponent = dynamic(() => import('@/components/pdf/Viewer'), {
  ssr: false,
});

export default function page() {
 
    return(
        <div className='w-full h-full flex justify-center items-center'>
            <ViewerComponent />
            {/* <InvoiceViewerPage /> */}
        </div>
    )
}


