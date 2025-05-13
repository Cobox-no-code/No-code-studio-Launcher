import React from 'react'
import { useDispatch } from 'react-redux'
import { Plus, ArrowDownUp } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { openCreateForm } from '@/redux/slices/unitConversionSlice'
import { useGetUnitsQuery, useGetUnitConversionsQuery } from '@/redux/api'
import { UnitConversion } from '../../../backend/models/item/item.model'
import { toast } from 'react-hot-toast'

interface UnitConversionSelectProps {
  value: string
  onChange: (value: string) => void
  secondaryUnitId?: string
  onSwapUnits?: () => void
  index: number
  focused: boolean
  onFocus: () => void
  onBlur: () => void
}

const UnitConversionSelect: React.FC<UnitConversionSelectProps> = ({
  value,
  onChange,
  secondaryUnitId,
  onSwapUnits,
  index,
  focused,
  onFocus,
  onBlur,
}) => {
  const dispatch = useDispatch()
  const { data: units, isLoading: unitsLoading } = useGetUnitsQuery()
  const { data: unitConversions, isLoading: conversionsLoading } = useGetUnitConversionsQuery()
  
  // Group conversions by primary unit for better organization
  const conversionsByPrimaryUnit = React.useMemo(() => {
    if (!unitConversions || !units) return {}
    
    const grouped: Record<string, Array<UnitConversion & { primaryName: string, secondaryName: string }>> = {}
    
    unitConversions.forEach(conversion => {
      const primaryUnit = units.find(u => u.id === conversion.primaryUnitId)
      const secondaryUnit = units.find(u => u.id === conversion.secondaryUnitId)
      
      if (primaryUnit && secondaryUnit) {
        const enhancedConversion = {
          ...conversion,
          primaryName: primaryUnit.shortname,
          secondaryName: secondaryUnit.shortname
        }
        
        if (!grouped[primaryUnit.id]) {
          grouped[primaryUnit.id] = []
        }
        
        grouped[primaryUnit.id].push(enhancedConversion)
      }
    })
    
    return grouped
  }, [unitConversions, units])
  
  // Create distinct groups of primary units that have conversions
  const primaryUnitGroups = React.useMemo(() => {
    if (!units) return []
    
    return Object.keys(conversionsByPrimaryUnit).map(unitId => {
      const unit = units.find(u => u.id === unitId)
      return {
        id: unitId,
        name: unit?.fullname || 'Unknown'
      }
    })
  }, [conversionsByPrimaryUnit, units])
  
  // Handle adding a new conversion
  const handleAddConversion = () => {
    dispatch(openCreateForm())
    toast.success("Opening unit conversion form")
  }
  
  // Determine if the currently selected value has a conversion
  const hasConversion = Boolean(secondaryUnitId)
  
  if (unitsLoading || conversionsLoading) {
    return (
      <Select disabled>
        <SelectTrigger className="h-8 w-full text-sm">
          <SelectValue placeholder="Loading..." />
        </SelectTrigger>
      </Select>
    )
  }
  
  return (
    <div className="space-y-1">
      <Select
        value={value || ''}
        onValueChange={onChange}
      >
        <SelectTrigger 
          className={`h-8 w-full text-sm ${
            focused ? 'border-primary ring-1 ring-primary/30' : 'border-gray-200'
          }`}
          onFocus={onFocus}
          onBlur={onBlur}
        >
          <SelectValue placeholder="Select unit" />
        </SelectTrigger>
        <SelectContent>
          {/* Units with conversions first */}
          {primaryUnitGroups.length > 0 && (
            <>
            
              {primaryUnitGroups.map(group => (
                <SelectGroup key={group.id}>
                  <SelectLabel className="text-xs">{group.name}</SelectLabel>
                  {conversionsByPrimaryUnit[group.id].map(conversion => (
                    <SelectItem 
                      key={conversion.id} 
                      value={conversion.id}
                      className="pl-6 flex items-center"
                    >
                      <span>{conversion.primaryName}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        (1 {conversion.primaryName} = {conversion.conversionRate} {conversion.secondaryName})
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
              <Separator className="my-2" />
            </>
          )}
          
          {/* Individual units */}

          {units?.map(unit => (
            <SelectItem key={unit.id} value={unit.id}>
              {unit.shortname} - {unit.fullname}
            </SelectItem>
          ))}
          
          {/* Add new conversion option */}
          <Separator className="my-2" />
          <div className="px-2 py-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-primary text-xs flex items-center justify-center"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleAddConversion()
              }}
            >
              <Plus className="h-3 w-3 mr-1" /> Add New Conversion
            </Button>
          </div>
        </SelectContent>
      </Select>
      
      {/* Display swap button if has conversion */}
      {hasConversion && onSwapUnits && (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-6 text-xs flex items-center justify-center"
          onClick={onSwapUnits}
        >
          <ArrowDownUp className="h-3 w-3 mr-1" /> Swap Units
        </Button>
      )}
    </div>
  )
}

export default UnitConversionSelect