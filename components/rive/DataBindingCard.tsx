'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { ViewModelProperty } from './types'

interface DataBindingCardProps {
  viewModelProps: ViewModelProperty[]
  updateViewModelProperty?: (name: string, value: unknown) => void
  updateColorProperty?: (name: string, r: number, g: number, b: number, a: number) => void
}

// Compact color picker
function ColorPicker({
  name,
  colorValue,
  onUpdate,
}: {
  name: string
  colorValue?: { r: number; g: number; b: number; a: number }
  onUpdate: (name: string, r: number, g: number, b: number, a: number) => void
}) {
  const [r, setR] = useState(colorValue?.r ?? 255)
  const [g, setG] = useState(colorValue?.g ?? 255)
  const [b, setB] = useState(colorValue?.b ?? 255)
  const [a, setA] = useState(colorValue?.a ?? 255)

  const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value
    const newR = parseInt(hex.slice(1, 3), 16)
    const newG = parseInt(hex.slice(3, 5), 16)
    const newB = parseInt(hex.slice(5, 7), 16)
    setR(newR)
    setG(newG)
    setB(newB)
    onUpdate(name, newR, newG, newB, a)
  }

  return (
    <div className='flex items-center gap-2'>
      <Input
        type='color'
        value={hexColor}
        onChange={handleColorChange}
        className='w-8 h-6 p-0.5 cursor-pointer'
      />
      <code className='text-xs text-muted-foreground'>{hexColor}</code>
      <Slider
        min={0}
        max={255}
        step={1}
        value={[a]}
        onValueChange={(values) => {
          const newA = values[0]
          setA(newA)
          onUpdate(name, r, g, b, newA)
        }}
        className='w-16'
        title={`Alpha: ${a}`}
      />
    </div>
  )
}

// Property row component for compact display
function PropertyRow({
  prop,
  onUpdate,
  onColorUpdate,
}: {
  prop: ViewModelProperty
  onUpdate: (name: string, value: unknown) => void
  onColorUpdate: (name: string, r: number, g: number, b: number, a: number) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const propName = prop.name.split('/').pop() || prop.name
  const needsExpand = prop.type === 'color' || prop.type === 'string'

  // Simple inline controls for boolean, number, trigger
  if (prop.type === 'boolean') {
    return (
      <div className='flex items-center justify-between py-1.5 px-2 bg-muted/30 rounded text-xs'>
        <div className='flex items-center gap-2 min-w-0'>
          <span className='font-mono truncate' title={prop.name}>{propName}</span>
          <span className='px-1 py-0.5 bg-blue-500/20 text-blue-500 rounded text-[10px]'>bool</span>
        </div>
        <Switch
          checked={prop.value as boolean}
          onCheckedChange={(value) => onUpdate(prop.name, value)}
          className='scale-75'
        />
      </div>
    )
  }

  if (prop.type === 'number') {
    return (
      <div className='flex items-center justify-between gap-2 py-1.5 px-2 bg-muted/30 rounded text-xs'>
        <div className='flex items-center gap-2 min-w-0 flex-1'>
          <span className='font-mono truncate' title={prop.name}>{propName}</span>
          <span className='px-1 py-0.5 bg-green-500/20 text-green-500 rounded text-[10px]'>num</span>
        </div>
        <Input
          type='number'
          placeholder='0'
          defaultValue={prop.value as number}
          onChange={(e) => onUpdate(prop.name, parseFloat(e.target.value))}
          className='w-20 h-6 text-xs'
        />
      </div>
    )
  }

  if (prop.type === 'trigger') {
    return (
      <div className='flex items-center justify-between py-1.5 px-2 bg-muted/30 rounded text-xs'>
        <div className='flex items-center gap-2 min-w-0'>
          <span className='font-mono truncate' title={prop.name}>{propName}</span>
          <span className='px-1 py-0.5 bg-orange-500/20 text-orange-500 rounded text-[10px]'>trig</span>
        </div>
        <Button
          size='sm'
          variant='outline'
          onClick={() => onUpdate(prop.name, true)}
          className='h-5 text-[10px] px-2'
        >
          Fire
        </Button>
      </div>
    )
  }

  if (prop.type === 'enum') {
    const hasEnumValues = prop.enumValues && prop.enumValues.length > 0
    return (
      <div className='flex items-center justify-between gap-2 py-1.5 px-2 bg-muted/30 rounded text-xs'>
        <div className='flex items-center gap-2 min-w-0'>
          <span className='font-mono truncate' title={prop.name}>{propName}</span>
          <span className='px-1 py-0.5 bg-purple-500/20 text-purple-500 rounded text-[10px]'>enum</span>
        </div>
        {hasEnumValues ? (
          <Select
            value={prop.value as string | undefined}
            onValueChange={(value) => onUpdate(prop.name, value)}
          >
            <SelectTrigger className='w-28 h-6 text-xs'>
              <SelectValue placeholder='Select...' />
            </SelectTrigger>
            <SelectContent>
              {prop.enumValues!.map((val) => (
                <SelectItem key={val} value={val} className='text-xs'>
                  {val}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className='text-muted-foreground text-[10px]'>
            {prop.value ? String(prop.value) : 'No options'}
          </span>
        )}
      </div>
    )
  }

  // Collapsible for color and string
  if (needsExpand) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant='ghost'
            className='flex items-center justify-between w-full h-auto py-1.5 px-2 bg-muted/30 text-xs hover:bg-muted/50'
          >
            <div className='flex items-center gap-2 min-w-0'>
              {isOpen ? <ChevronDown className='w-3 h-3' /> : <ChevronRight className='w-3 h-3' />}
              <span className='font-mono truncate' title={prop.name}>{propName}</span>
              <span className={`px-1 py-0.5 rounded text-[10px] ${
                prop.type === 'color' ? 'bg-pink-500/20 text-pink-500' : 'bg-yellow-500/20 text-yellow-500'
              }`}>
                {prop.type === 'color' ? 'color' : 'str'}
              </span>
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className='pt-2 px-2 pb-1'>
          {prop.type === 'color' && (
            <ColorPicker
              name={prop.name}
              colorValue={prop.colorValue}
              onUpdate={onColorUpdate}
            />
          )}
          {prop.type === 'string' && (
            <Input
              type='text'
              placeholder='Enter text'
              defaultValue={prop.value as string}
              onChange={(e) => onUpdate(prop.name, e.target.value)}
              className='h-7 text-xs'
            />
          )}
        </CollapsibleContent>
      </Collapsible>
    )
  }

  // Fallback for unknown types
  return (
    <div className='flex items-center justify-between py-1.5 px-2 bg-muted/30 rounded text-xs'>
      <div className='flex items-center gap-2 min-w-0'>
        <span className='font-mono truncate' title={prop.name}>{propName}</span>
        <span className='px-1 py-0.5 bg-gray-500/20 text-gray-500 rounded text-[10px]'>{prop.type}</span>
      </div>
    </div>
  )
}

export function DataBindingCard({
  viewModelProps,
  updateViewModelProperty,
  updateColorProperty,
}: DataBindingCardProps) {
  const handleUpdate = (name: string, value: unknown) => {
    if (updateViewModelProperty) {
      updateViewModelProperty(name, value)
    }
  }

  const handleColorUpdate = (name: string, r: number, g: number, b: number, a: number) => {
    if (updateColorProperty) {
      updateColorProperty(name, r, g, b, a)
    }
  }

  // Group properties by ViewModel name
  const grouped = viewModelProps.reduce((acc, prop) => {
    const parts = prop.name.split('/')
    const vmName = parts.length > 1 ? parts.slice(0, -1).join('/') : 'default'
    if (!acc[vmName]) acc[vmName] = []
    acc[vmName].push(prop)
    return acc
  }, {} as Record<string, ViewModelProperty[]>)

  return (
    <Card className='w-full'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base'>Data Binding</CardTitle>
          {viewModelProps.length > 0 && (
            <span className='text-xs text-muted-foreground'>
              {viewModelProps.length} props
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {viewModelProps.length === 0 ? (
          <p className='text-xs text-muted-foreground'>
            No ViewModel properties found.
          </p>
        ) : (
          <div className='flex flex-col gap-3 max-h-64 overflow-y-auto'>
            {Object.entries(grouped).map(([vmName, props]) => (
              <div key={vmName}>
                {Object.keys(grouped).length > 1 && (
                  <Label className='text-xs text-muted-foreground mb-1 block'>{vmName}</Label>
                )}
                <div className='flex flex-col gap-1'>
                  {props.map((prop) => (
                    <PropertyRow
                      key={prop.name}
                      prop={prop}
                      onUpdate={handleUpdate}
                      onColorUpdate={handleColorUpdate}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
