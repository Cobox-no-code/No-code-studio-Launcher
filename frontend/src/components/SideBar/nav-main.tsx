'use client'

import {
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  Group,
  Home,
  Plus,
  ShoppingBasket,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import Link from 'next/link'
import { openModal } from '@/redux/slices/modal'
import { useDispatch } from 'react-redux'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
// import { useDispatch } from 'react-redux'
// import { openModal } from '@/redux/slices/modal'
// import { useQueryClient } from '@tanstack/react-query'
// import { fetchExpensesCategory } from '@/lib/ExpenseAction'
// import { fetchProduct } from '@/lib/productAction'
// import { fetchParty } from '@/lib/client'
// import { fetchProperties } from '@/lib/actions'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    rightSideIcon?: LucideIcon
    items?: {
      title: string
      url: string
      shortcut?: string
    }[]
  }[]
}) {
  const dispatch = useDispatch()
  // const queryClient = useQueryClient()
  const handleOpenModal = (type: string) => {
    dispatch(
      openModal({
        type: type,
      })
    )
  }
  const prefetchExpenseData = async () => {
    // await queryClient.prefetchQuery({
    //   queryKey: ['ExpenseCategory'],
    //   queryFn: fetchExpensesCategory,
    // })
  }
  const prefetchProductData = async () => {
    // await queryClient.prefetchQuery({
    //   queryKey: ['Product'],
    //   queryFn: fetchProduct,
    // })
  }
  const prefetchPartyData = async () => {
    // await queryClient.prefetchQuery({
    //   queryKey: ['Party'],
    //   queryFn: fetchParty,
    // })
  }
  const prefetchPropertiesData = async () => {
    // await queryClient.prefetchQuery({
    //   queryKey: ['Properties'],
    //   queryFn: fetchProperties,
    // })
  }
    const pathname = usePathname()
  
  const [openId, setOpenId] = useState<string | null>(null)
  const [showReport, setShowReport] = useState(false)
  const handleToggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id))
  }
  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem className="space-y-3">
          {items.map((item) => (
            <Collapsible
              key={item.title}
              open={openId === item.title && (item.items?.length ?? 0) > 0}
              onOpenChange={() => handleToggle(item.title)}
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className={`${pathname === item.url && 'bg-[#26284c]'}`}
                  >
                    <Link
                      href={item.url}
                      className="w-full  flex items-center justify-between p-2"
                    >
                      <p className="flex items-center gap-2 text-[14px]">
                        {item.icon && <item.icon size={17} />}
                        <span>{item.title}</span>
                      </p>

                      {item.rightSideIcon && (
                        <item.rightSideIcon
                          size={17}
                          className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                        />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="m-0 pr-0">
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title} className="">
                        <SidebarMenuSubButton asChild >
                          <div className="flex justify-between">
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                            <Plus />
                          </div>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}
        </SidebarMenuItem>
        {/* <SidebarMenuButton
          className=""
          onClick={() => setShowReport(!showReport)}
        >
          <div className="">
            <p className="flex items-center gap-2 text-[14px]">
              {<ChartNoAxesColumnIncreasing size={17} />}
              <span>{'Report'}</span>
            </p>
          </div>
        </SidebarMenuButton> */}
      </SidebarMenu>
    </SidebarGroup>
  )
}
