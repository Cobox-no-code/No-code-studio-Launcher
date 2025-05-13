'use client'

import React, { useState } from 'react'
import Items from './items'
import Category from './category'

const PartyPage = () => {
  const [activeState, setActiveState] = useState('category')

  return (
    <div>
      <div className="flex  w-full h-10 bg-white font-semibold text-lg text-neutral-500 ">
        <div
          className={` w-full flex items-center justify-center ${
            activeState === 'category' &&
            'text-blue-600 border-b-2 border-blue-600'
          }`}
          onClick={() => setActiveState('category')}
        >
          CATEGORY
        </div>
        <div
          className={` w-full flex items-center justify-center ${
            activeState === 'items' &&
            'text-blue-600 border-b-2 border-blue-600'
          }`}
          onClick={() => setActiveState('items')}
        >
          ITEMS
        </div>
      </div>
      {activeState === 'category' && <Category />}
      {activeState === 'items' && <Items />}
    </div>
  )
}

export default PartyPage
