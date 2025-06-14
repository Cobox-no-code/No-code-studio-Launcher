'use client'
import Category from '@/components/ItemPageComponent/Category'
import Product from '@/components/ItemPageComponent/Product'
import Unit from '@/components/ItemPageComponent/Unit'

import { useAppDispatch } from '@/redux/hooks'
import { useState } from 'react'

const ItemPage = () => {
  const [activeState, setActiveState] = useState('product')

     const dispatch = useAppDispatch()
  
    //  console.log("🚀 ~ ItemPage ~ items:", items)

    //  useEffect(() => {
    //    dispatch(fetchAllItems())
    //  }, [dispatch])
  return (

    <div>
      <div className="flex  w-full h-10 bg-white font-bold text-lg text-neutral-500 ">
        <div
          className={` w-full  flex items-center justify-center cursor-pointer uppercase ${
            activeState === 'product' && 'border-b-2 border-black'
          }`}
          onClick={() => setActiveState('product')}
        >
    Inventory
        </div>
   
        <div
          className={` w-full flex items-center justify-center cursor-pointer uppercase ${
            activeState === 'category' && 'border-b-2 border-black'
          }`}
          onClick={() => setActiveState('category')}
        >
          CATEGORY
        </div>
        <div
          className={` w-full flex items-center justify-center cursor-pointer uppercase ${
            activeState === 'unit' && 'border-b-2 border-black'
          }`}
          onClick={() => setActiveState('unit')}
        >
          UNIT
        </div>
      </div>
      {activeState === 'product' && <Product />}
   
      {activeState === 'category' && <Category />}
      {activeState === 'unit' && <Unit />}
    </div>

    
  )
}

export default ItemPage
