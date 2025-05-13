'use client'
import { UnitConversion } from '@/models/item/item.model'
import {
    useDeleteUnitConversionMutation,
    useGetUnitConversionsQuery,
    useGetUnitsQuery
} from '@/redux/api'
import { openCreateForm as openConversionCreateForm, openEditForm as openConversionEditForm } from '@/redux/slices/unitConversionSlice'
import { openCreateForm as openUnitCreateForm, openEditForm as openUnitEditForm } from '@/redux/slices/unitSlice'
import { AppDispatch } from '@/redux/store'
import { ChangeEvent, useState } from 'react'
import { useDispatch } from 'react-redux'

// UI Components
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

// Icons
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    AlertCircle,
    AlertTriangle,
    ArrowUpDown,
    Calculator,
    EllipsisVertical,
    FileText,
    Loader2,
    LoaderCircle,
    Pencil,
    Plus,
    Repeat,
    Ruler,
    Scale,
    Search,
    Tag,
    Trash2,
    X
} from 'lucide-react'
import toast from 'react-hot-toast'

const Units = () => {
  const dispatch = useDispatch<AppDispatch>()
  const [filterUnit, setFilterUnit] = useState('')
  const [filterConversion, setFilterConversion] = useState('')
  
  // State for selected unit
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  
  // State for delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  
  // RTK Query hooks
  const {
    data: units,
    isLoading: isLoadingUnits,
    isError: isUnitsError,
    error: unitsError
  } = useGetUnitsQuery();
  
  const {
    data: unitConversions,
    isLoading: isLoadingConversions,
    isError: isConversionsError,
    error: conversionsError,
    refetch: refetchConversions
  } = useGetUnitConversionsQuery();
  
  // Delete mutation
  const [deleteUnitConversion, { isLoading: isDeleting }] = useDeleteUnitConversionMutation();
  
  // Filter units based on search
  const filteredUnits = units?.filter(unit => 
    unit.fullname.toLowerCase().includes(filterUnit.toLowerCase()) ||
    unit.shortname.toLowerCase().includes(filterUnit.toLowerCase())
  );
  
  // Get the selected unit
  const selectedUnit = selectedUnitId ? 
    units?.find(unit => unit.id === selectedUnitId) : null;
  
  // Get conversions for the selected unit
  const selectedUnitConversions = unitConversions?.filter(
    conversion => conversion.primaryUnitId === selectedUnitId || 
                 conversion.secondaryUnitId === selectedUnitId
  );
  
  // Filter conversions based on search
  const filteredConversions = selectedUnitConversions?.filter(conversion => {
    // Get the unit names for display
    const primaryUnit = units?.find(u => u.id === conversion.primaryUnitId);
    const secondaryUnit = units?.find(u => u.id === conversion.secondaryUnitId);
    
    const conversionText = `${primaryUnit?.fullname} ${secondaryUnit?.fullname}`;
    return conversionText.toLowerCase().includes(filterConversion.toLowerCase());
  });
  
  // Units summary
  const totalUnits = units?.length || 0;
  const totalConversions = unitConversions?.length || 0;
  const selectedUnitConversionCount = selectedUnitConversions?.length || 0;
  
  // Helper to format conversion text
  const formatConversion = (conversion: UnitConversion) => {
    const primaryUnit = units?.find(u => u.id === conversion.primaryUnitId);
    const secondaryUnit = units?.find(u => u.id === conversion.secondaryUnitId);
    
    return `1 ${primaryUnit?.fullname || ''} = ${conversion.conversionRate} ${secondaryUnit?.fullname || ''}`;
  };
  
  // Open unit form
  const handleOpenUnitForm = (unitId?: string) => {
    if (unitId) {
      dispatch(openUnitEditForm(unitId));
    } else {
      dispatch(openUnitCreateForm());
    }
  };
  
  // Open conversion form
  const handleOpenConversionForm = (conversionId?: string) => {
    if (conversionId) {
      dispatch(openConversionEditForm(conversionId));
    } else {
      // Pass the selected unit ID as the primary unit if creating a new conversion
      dispatch(openConversionCreateForm(selectedUnitId || undefined));
    }
  };
  
  // Handle conversion deletion
  const handleDeleteConversion = async () => {
    if (!confirmDeleteId) return;
    
    try {
      await deleteUnitConversion(confirmDeleteId).unwrap();
      toast.success('Unit conversion deleted successfully');
      setConfirmDeleteId(null);
      refetchConversions();
    } catch (error: any) {
      toast.error(`Failed to delete: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      {/* Header with stats */}
      <div className="flex flex-wrap gap-4">
        <Card className="w-full md:w-[calc(33.33%-12px)]">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Units</p>
              <p className="text-2xl font-bold">{totalUnits}</p>
            </div>
            <Ruler className="h-8 w-8 text-primary opacity-80" />
          </CardContent>
        </Card>
        
        <Card className="w-full md:w-[calc(33.33%-12px)]">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Conversions</p>
              <p className="text-2xl font-bold">{totalConversions}</p>
            </div>
            <Repeat className="h-8 w-8 text-green-500 opacity-80" />
          </CardContent>
        </Card>
        
        <Card className="w-full md:w-[calc(33.33%-12px)]">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Selected Unit Conversions</p>
              <p className="text-2xl font-bold">{selectedUnitConversionCount}</p>
            </div>
            <Calculator className="h-8 w-8 text-blue-500 opacity-80" />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Left panel - Units List */}
        <Card className="w-full md:w-1/3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Units Directory</CardTitle>
              <Button onClick={() => handleOpenUnitForm()}>
                <Plus className="h-4 w-4 mr-1" /> Add Unit
              </Button>
            </div>
            
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search units..."
                value={filterUnit}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFilterUnit(e.target.value)}
                className="pl-9 pr-9"
              />
              {filterUnit && (
                <button 
                  onClick={() => setFilterUnit('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-hidden">
            <div className="h-[calc(100vh-320px)] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Unit Name</TableHead>
                    <TableHead className="text-right">Short Name</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingUnits ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-5 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : isUnitsError ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>
                            {unitsError?.toString() || 'Failed to load units'}
                          </AlertDescription>
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : filteredUnits?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No units found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUnits?.map(unit => (
                      <TableRow 
                        key={unit.id}
                        className={`cursor-pointer hover:bg-gray-50 ${selectedUnitId === unit.id ? 'bg-primary/5' : ''}`} 
                        onClick={() => setSelectedUnitId(unit.id)}
                      >
                        <TableCell>
                          <span className="font-medium">{unit.fullname}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-xs">
                            {unit.shortname}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right w-10">
                          <Popover>
                            <PopoverTrigger onClick={(e) => e.stopPropagation()}>
                              <EllipsisVertical className="h-4 w-4 text-gray-500" />
                            </PopoverTrigger>
                            <PopoverContent className="w-40" align="end">
                              <div className="flex flex-col space-y-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="justify-start"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenUnitForm(unit.id);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit Unit
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Right panel - Unit Details & Conversions */}
        <div className="flex flex-col gap-4 w-full md:w-2/3">
          {/* Unit Details Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedUnit ? (
                    <div className="flex items-center gap-2">
                      {selectedUnit.fullname}
                      <Badge variant="outline" className="ml-2">
                        {selectedUnit.shortname}
                      </Badge>
                    </div>
                  ) : (
                    'Unit Details'
                  )}
                </CardTitle>
                {selectedUnit && (
                  <Button variant="outline" onClick={() => handleOpenUnitForm(selectedUnit.id)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit Unit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedUnit ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Scale className="h-16 w-16 text-gray-300 mb-2" />
                  <p className="text-lg font-medium text-gray-500">Select a unit to view details</p>
                  <p className="text-sm text-gray-400 max-w-md mt-1">
                    Click on any unit from the list to view its detailed information and conversions
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="border-0 shadow-none bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="h-4 w-4 text-primary" />
                        <h3 className="font-medium text-sm">Basic Information</h3>
                      </div>
                      <div className="space-y-4 mt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Full Name</p>
                          <p className="text-lg font-semibold">{selectedUnit.fullname}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Short Name</p>
                          <p className="text-lg font-semibold">{selectedUnit.shortname}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Unit ID</p>
                          <p className="text-base font-medium text-gray-500">{selectedUnit.id}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-none bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <h3 className="font-medium text-sm">Usage Statistics</h3>
                      </div>
                      <div className="space-y-4 mt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Conversions</p>
                          <p className="text-lg font-semibold">{selectedUnitConversions?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Primary in Conversions</p>
                          <p className="text-lg font-semibold">
                            {unitConversions?.filter(c => c.primaryUnitId === selectedUnitId).length || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Secondary in Conversions</p>
                          <p className="text-lg font-semibold">
                            {unitConversions?.filter(c => c.secondaryUnitId === selectedUnitId).length || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversions Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Repeat className="h-4 w-4" /> Unit Conversions
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search conversions..."
                      value={filterConversion}
                      onChange={(e) => setFilterConversion(e.target.value)}
                      className="pl-9 pr-9"
                    />
                    {filterConversion && (
                      <button 
                        onClick={() => setFilterConversion('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                  {selectedUnitId && (
                    <Button onClick={() => handleOpenConversionForm()}>
                      <Plus className="h-4 w-4 mr-1" /> New Conversion
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Sl.No</TableHead>
                      <TableHead>From Unit</TableHead>
                      <TableHead>To Unit</TableHead>
                      <TableHead className="w-[120px]">
                        <div className="flex items-center">
                          Rate
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!selectedUnit ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          Select a unit to view its conversions
                        </TableCell>
                      </TableRow>
                    ) : isLoadingConversions ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          <LoaderCircle className="w-5 h-5 mx-auto animate-spin text-blue-500" />
                        </TableCell>
                      </TableRow>
                    ) : isConversionsError ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-red-500">
                          <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                          Failed to load conversions
                        </TableCell>
                      </TableRow>
                    ) : filteredConversions?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          No conversions found for this unit
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredConversions?.map((conversion, index) => {
                        const primaryUnit = units?.find(u => u.id === conversion.primaryUnitId);
                        const secondaryUnit = units?.find(u => u.id === conversion.secondaryUnitId);
                        
                        return (
                          <TableRow key={conversion.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{primaryUnit?.fullname}</span>
                                <span className="text-xs text-gray-500">{primaryUnit?.shortname}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{secondaryUnit?.fullname}</span>
                                <span className="text-xs text-gray-500">{secondaryUnit?.shortname}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="font-mono">
                                {conversion.conversionRate}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleOpenConversionForm(conversion.id)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setConfirmDeleteId(conversion.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this unit conversion? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Deleting this unit conversion may affect items that use it.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConversion}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Units