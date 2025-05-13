import * as React from 'react'
import {
  AudioWaveform,
  ShoppingCart,
  Command,
  GalleryVerticalEnd,
  ReceiptIndianRupee,
  Landmark,
  Wrench,
  RefreshCw,
  Plus,
  Wallet,
  ChevronRight,
  ShoppingBasket,
  Users,
  Home,
  ChartNoAxesColumnIncreasing,
} from 'lucide-react'

import { NavMain } from '@/components/SideBar/nav-main'
// import { NavProjects } from "@/components/nav-projects"
import { NavUser } from '@/components/SideBar/nav-user'
import { TeamSwitcher } from '@/components/SideBar/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import CompanySelector from '../CompanySelector'
import { useAppSelector } from '@/redux/hooks'
import SubscriptionStatus from '../SubscriptionStatus'



// This is sample data.
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: 'https://avatars.githubusercontent.com/u/1024025?v=4',
  },
  teams: [
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free',
    },
  ],
  navMain: [
    {
      title: 'Home',
      url: '/',
      icon: Home,
      // rightSideIcon: '',
      isActive: true,
      items: [],
    },
    {
      title: 'Items',
      url: '/items',
      icon: ShoppingBasket,
      rightSideIcon: Plus,
      isActive: true,
      items: [],
    },
    {
      title: 'Parties',
      url: '/parties',
      icon: Users,
      rightSideIcon: Plus,
      isActive: true,
      items: [],
    },
    {
      title: 'Sales',
      url: '/documents/list/sale-invoice',
      icon: ReceiptIndianRupee,
      rightSideIcon: ChevronRight,
      isActive: true,
      items: [
        {
          title: 'Sale Invoices',
          url: '/documents/list/sale-invoice',
          shortcut: '/saleTab',
        },
        {
          title: 'Sale Quotation',
          url: '/documents/list/sale-quotation',
          shortcut: '/saleTab/estimate',
        },
        // {
        //   title: 'Payment In',
        //   url: '/sale/payment-in',
        //   shortcut: '/saleTab/payment_in',
        // },
        {
          title: 'Sale Order',
          url: '/documents/list/sale-order',
          shortcut: '/saleTab/sale_order',
        },
        {
          title: 'Delivery Challan',
          url: '/documents/list/delivery-challan',
          shortcut: '/saleTab/delivery_challan',
        },
        {
          title: 'Sale Return/ Cr. Note',
          url: '/documents/list/sale-return',
          shortcut: '/saleTab/sale_return',
        },
      ],
    },
    {
      title: 'Purchase',
      url: '/documents/list/purchase-invoice',
      icon: ShoppingCart,
      rightSideIcon: ChevronRight,
      items: [
        {
          title: 'Purchase Bill',
          url: '/documents/list/purchase-invoice',
          shortcut: '/purchaseTab',
        },
        // {
        //   title: 'Payment Out',
        //   url: '/purchase/payment-out',
        //   shortcut: '/purchaseTab/payment-out',
        // },
        {
          title: 'Purchase Order',
          url: '/documents/list/purchase-order',
          shortcut: '/purchaseTab/purchase-order',
        },
        {
          title: 'Purchase Return/ Dr. Note',
          url: '/documents/list/purchase-return',
          shortcut: '/purchaseTab/purchase-return',
        },
      ],
    },
    {
      title: 'Payment',
      url: '/payment-in',
      icon: Wallet,
      rightSideIcon: ChevronRight,
      items: [
        {
          title: 'Payment In',
          url: '/payment-in',
        },
        {
          title: 'Payment Out',
          url: '/payment-out',
        },
     
      ],
    },
    {
      title: 'Report',
      url: '/report/sales',
      icon: ChartNoAxesColumnIncreasing,
      // rightSideIcon: Plus,
      items: [],
    },
    {
      title: 'Cash & Bank',
      url: '/cash-&-bank/bank-account',
      icon: Landmark,
      rightSideIcon: ChevronRight,
      items: [
        {
          title: 'Bank Account',
          url: '/cash-&-bank/bank-account',
        },

      ],
    },
    {
      title: 'Utilities',
      url: '/Utilities/import-item',
      icon: Wrench,
      rightSideIcon: ChevronRight,
      items: [
        {
          title: 'Import Item',
          url: '/Utilities/import-item',
        },
        {
          title: 'Import Parties',
          url: '/Utilities/import-parties',
        },
        {
          title: 'Export Item',
          url: '/Utilities/export-item',
        },
        {
          title: 'Export Parties',
          url: '/Utilities/export-parties',
        },
      ],
    },
    {
      title: 'Pricing',
      url: '/pricing',
      icon: ShoppingBasket,
      items: [],
    },
    // {
    //   title: 'Sync, Share & Backup',
    //   url: '/sync-&-share/sync&share',
    //   icon: RefreshCw,
    //   rightSideIcon: ChevronRight,
    //   items: [
    
    
    //   ],
    // },
  ],
}


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [firmName, setFirmName] = React.useState<string>('')

    React.useEffect(() => {
    // Get firm name from localStorage
    const storedFirmName = localStorage.getItem('firmName')
    if (storedFirmName) {
      setFirmName(storedFirmName)
    }
    
    // Listen for storage changes (in case another component updates localStorage)
    const handleStorageChange = (): void => {
      const updatedFirmName = localStorage.getItem('firmName')
      setFirmName(updatedFirmName || '')
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

 
  return (
    <Sidebar collapsible="icon" {...props}>
      {/* App Logo and Name */}
      <div className="flex items-center gap-2 p-4 mb-2">
        <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-md flex items-center justify-center">
          <img src="http://34.228.195.218/static/images/logo.png" alt="Logo" className="w-full h-full object-cover rounded-md" />
        </div>
        <span className="font-bold text-lg text-white">PAPERBILL</span>
      </div>
      
      {/* Main Navigation */}
      <SidebarContent className="text-white flex-grow">
        <NavMain items={data.navMain} />
      </SidebarContent>
         <SubscriptionStatus />
      {/* Company Selector at the bottom */}
      <div className="mt-auto">
        <CompanySelector isBottom={true} />
      </div>
    </Sidebar>
  )
}