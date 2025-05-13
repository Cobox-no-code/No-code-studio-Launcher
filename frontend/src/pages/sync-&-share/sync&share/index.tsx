import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { EllipsisVertical, Info, Plus, RefreshCcw, RotateCcw } from 'lucide-react'
import React from 'react'

const SyncShare = () => {
  return (
    <div>
      <div className="flex items-center justify-between py-4 border-b bg-white px-4 ">
        <div className="flex items-center gap-4">
          <p className=" font-semibold text-xl">Sync & Share</p>
        </div>
        <div className="flex gap-2">
          <Button
            className="p-1 hover:bg-gray-100 rounded-full px-4 bg-[#ddebf8] "
            variant={'secondary'}
          >
            <RotateCcw color="blue" />
          </Button>
          <Button
            className="p-1 hover:bg-gray-100 rounded-full px-4"
            variant={'secondary'}
          >
            <Info />
            Know More
          </Button>
          <Button
            className="p-1 hover:bg-gray-100  rounded-full"
            variant={'destructive'}
          >
            <Plus /> Add User
          </Button>
        </div>
      </div>
      <section className='flex flex-col gap-1 p-1'>
        <div className="flex items-center justify-between py-4 border-b bg-white px-4 rounded-xl ">
          <div>
            <p className=" font-normal text-sm text-gray-400">
              Currently logged in with the following number:
            </p>
            <p className=" font-semibold text-md flex items-center gap-2">
              987654332
              <Button
                variant={'secondary'}
                className="bg-[#ccffed] rounded-full size-5"
              >
                <RefreshCcw color="green" size={1} />
              </Button>
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger>
              {' '}
              <Button
                className="p-1 hover:bg-gray-100 rounded-full px-4 bg-[#ddebf8] "
                variant={'secondary'}
              >
                <EllipsisVertical color="blue" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Disable Sync</DropdownMenuItem>
              <DropdownMenuItem>Logout from Sync</DropdownMenuItem>
              <DropdownMenuItem>See User Activity</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
              <div className='flex flex-col items-center justify-center h-[60dvh] rounded-xl gap-3 bg-white'>
                  <span className=' items-center text-center'>
          <p className='text-md font-semibold'>You have not added any users till now.</p>
          <p className='text-xs text-gray-400'>
            Add users, assign roles and Let your employees manage your business
          </p>
                      
                  </span>
          <Button
            className="p-1 hover:bg-gray-100 h-10 w-40 text-lg rounded-full"
            variant={'destructive'}
          >
            <Plus /> Add User
          </Button>
        </div>
      </section>
    </div>
  )
}

export default SyncShare
