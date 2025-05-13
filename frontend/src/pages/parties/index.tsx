'use client'
import Group from '@/components/PartyPageComponent/Group'
import Name from '@/components/PartyPageComponent/Name'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import React, { useEffect, useState } from 'react'

const PartyPage = () => {
  const [activeState, setActiveState] = useState('name')

  return (

    <div>
      <div className="flex  w-full h-10 bg-white font-semibold text-lg text-neutral-500 ">
        <div
          className={` w-full flex items-center justify-center cursor-pointer ${
            activeState === 'name' &&  'text-black border-b-2 border-black'
          }`}
          onClick={() => setActiveState('name')}
        >
          NAME
        </div>
        <div
          className={` w-full flex items-center justify-center cursor-pointer ${
            activeState === 'group' &&  'text-black border-b-2 border-black'
          }`}
          onClick={() => setActiveState('group')}
        >
          GROUP
        </div>
  
    
      </div>
      {activeState === 'name' && <Name />}
      {activeState === 'group' && <Group />}
    
    </div>

    
  )
}

export default PartyPage
