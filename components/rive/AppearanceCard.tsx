'use client'

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
import { BackgroundColor } from './types'

interface AppearanceCardProps {
  background: BackgroundColor
  setBackground: (value: BackgroundColor) => void
}

export function AppearanceCard({ background, setBackground }: AppearanceCardProps) {
  return (
    <Card className='w-full sm:w-auto sm:min-w-50 sm:max-w-62.5'>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Customize the appearance.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='w-full'>
          <h2 className='text-lg font-medium mb-2'>Background Color</h2>
          <Select
            value={background}
            onValueChange={(value) => setBackground(value as BackgroundColor)}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select Background' />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Available Backgrounds</SelectLabel>
                <SelectItem value='transparent'>Transparent</SelectItem>
                <SelectItem value='white'>White</SelectItem>
                <SelectItem value='black'>Black</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
