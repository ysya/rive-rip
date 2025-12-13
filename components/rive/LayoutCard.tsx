'use client'

import { Fit, Alignment } from '@rive-app/react-canvas'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { BackgroundColor } from './types'

const fitValues: (keyof typeof Fit)[] = [
  'Cover',
  'Contain',
  'Fill',
  'FitWidth',
  'FitHeight',
  'None',
  'ScaleDown',
]

const alignValues: (keyof typeof Alignment)[] = [
  'TopLeft',
  'TopCenter',
  'TopRight',
  'CenterLeft',
  'Center',
  'CenterRight',
  'BottomLeft',
  'BottomCenter',
  'BottomRight',
]

interface AlignFitIndex {
  alignment: number
  fit: number
}

interface LayoutCardProps {
  alignFitIndex: AlignFitIndex
  setAlignFitIndex: React.Dispatch<React.SetStateAction<AlignFitIndex>>
  background: BackgroundColor
  setBackground: (value: BackgroundColor) => void
}

export function LayoutCard({ alignFitIndex, setAlignFitIndex, background, setBackground }: LayoutCardProps) {
  return (
    <Card className='w-full'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-base'>Layout</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex flex-col gap-3'>
          <div className='flex gap-2'>
            <Select
              value={fitValues[alignFitIndex.fit]}
              onValueChange={(value) =>
                setAlignFitIndex({
                  ...alignFitIndex,
                  fit: fitValues.indexOf(value as keyof typeof Fit),
                })
              }
            >
              <SelectTrigger className='flex-1'>
                <SelectValue placeholder='Fit' />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Fit</SelectLabel>
                  {fitValues.map((fit) => (
                    <SelectItem key={fit} value={fit}>
                      {fit}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={background}
              onValueChange={(value) => setBackground(value as BackgroundColor)}
            >
              <SelectTrigger className='w-24'>
                <SelectValue placeholder='BG' />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Background</SelectLabel>
                  <SelectItem value='transparent'>Transparent</SelectItem>
                  <SelectItem value='white'>White</SelectItem>
                  <SelectItem value='black'>Black</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className='grid grid-rows-3 grid-cols-3 gap-1'>
            {alignValues.map((_, index) => (
              <Button
                key={`btn_${index}`}
                variant='ghost'
                size='icon'
                onClick={() =>
                  setAlignFitIndex({ ...alignFitIndex, alignment: index })
                }
                className={`w-6 h-6 p-0 ${
                  alignFitIndex.alignment === index
                    ? 'bg-foreground hover:bg-foreground'
                    : 'bg-muted hover:bg-secondary-foreground'
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { fitValues, alignValues }
export type { AlignFitIndex }
