'use client'

import { Fit, Alignment } from '@rive-app/react-canvas'
import {
  Card,
  CardContent,
  CardDescription,
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
}

export function LayoutCard({ alignFitIndex, setAlignFitIndex }: LayoutCardProps) {
  return (
    <Card className='w-full sm:w-auto sm:min-w-60'>
      <CardHeader>
        <CardTitle>Layout</CardTitle>
        <CardDescription>Adjust the layout of the animation.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='w-full'>
          <div className='flex flex-row flex-wrap justify-between items-center gap-2 mb-2'>
            <h2 className='text-lg font-medium pr-8'>Fit</h2>
            <div className='w-auto min-w-40'>
              <Select
                value={fitValues[alignFitIndex.fit]}
                onValueChange={(value) =>
                  setAlignFitIndex({
                    ...alignFitIndex,
                    fit: fitValues.indexOf(value as keyof typeof Fit),
                  })
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select Fit' />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Available Fits</SelectLabel>
                    {fitValues.map((fit) => (
                      <SelectItem key={fit} value={fit}>
                        {fit}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='flex flex-row justify-between flex-wrap'>
            <h2 className='text-lg font-medium mt-4 pr-8'>Alignment</h2>
            <div className='grid grid-rows-3 grid-cols-3 gap-2 mt-4 mb-2'>
              {alignValues.map((_, index) => (
                <button
                  key={`btn_${index}`}
                  onClick={() =>
                    setAlignFitIndex({ ...alignFitIndex, alignment: index })
                  }
                  className={`w-9 h-9 ${
                    alignFitIndex.alignment === index
                      ? 'bg-foreground'
                      : 'bg-muted'
                  } hover:bg-secondary-foreground rounded-lg transition-colors`}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { fitValues, alignValues }
export type { AlignFitIndex }
