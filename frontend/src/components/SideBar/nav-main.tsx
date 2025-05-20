// components/SideBar/nav-main.tsx
import * as React from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface NavMainProps {
  items: {
    title: string
    url: string
    icon: React.ComponentType<{ className?: string }>
    rightSideIcon?: React.ComponentType<{ className?: string }>
    isActive?: boolean
    items: {
      title: string
      url: string
      shortcut?: string
    }[]
  }[]
}

export function NavMain({ items }: NavMainProps) {
  const router = useRouter()
  // Store open/close state for each dropdown menu
  const [openItems, setOpenItems] = React.useState<string[]>([])

  // Toggle a specific dropdown menu by title
  const toggleItem = (title: string, event: React.MouseEvent) => {
    // Only if the item has sub-items
    const item = items.find(i => i.title === title)
    if (!item?.items?.length) return
    
    // Prevent the click from propagating to parent elements and causing navigation
    event.preventDefault()
    event.stopPropagation()
    
    setOpenItems(prev => {
      if (prev.includes(title)) {
        return prev.filter(i => i !== title)
      } else {
        return [...prev, title]
      }
    })
  }

  // Check if a menu item should be highlighted as active
  const isItemActive = (item: any) => {
    if (!router) return false
    return router.pathname === item.url || router.pathname.startsWith(item.url)
  }

  // Check if a submenu item should be highlighted as active
  const isSubItemActive = (subItem: any) => {
    if (!router) return false
    return router.pathname === subItem.url
  }

  return (
    <nav className="grid gap-1 px-2">
      {items.map((item, index) => {
        const Icon = item.icon
        const RightIcon = item.rightSideIcon
        const hasSubItems = item.items && item.items.length > 0
        const isOpen = openItems.includes(item.title)
        
        return (
          <div key={index} className="relative">
            {hasSubItems ? (
              <Collapsible open={isOpen} onOpenChange={(open) => {
                if (open) {
                  setOpenItems(prev => [...prev.filter(i => i !== item.title), item.title])
                } else {
                  setOpenItems(prev => prev.filter(i => i !== item.title))
                }
              }}>
                <CollapsibleTrigger asChild>
                  <Link
                    href={item.url}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/10",
                     
                    )}
                    onClick={(e) => toggleItem(item.title, e)}
                  >
                    <div className="flex items-center gap-3">
                      {Icon && <Icon className="h-4 w-4" />}
                      <span>{item.title}</span>
                    </div>
                    {RightIcon && <RightIcon className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />}
                  </Link>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-10 animate-in slide-in-from-left-5">
                  <div className="mt-1 grid gap-1">
                    {item.items.map((subItem, subIndex) => (
                      <Link
                        key={subIndex}
                        href={subItem.url}
                        className={cn(
                          "block rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/10",
                       
                        )}
                      >
                        {subItem.title}
                      </Link>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <Link
                href={item.url}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/10",
           
                )}
              >
                <div className="flex items-center gap-3">
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{item.title}</span>
                </div>
                {RightIcon && <RightIcon className="h-4 w-4" />}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}