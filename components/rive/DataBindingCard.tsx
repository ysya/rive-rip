'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ViewModelProperty } from './types'

interface DataBindingCardProps {
  viewModelProps: ViewModelProperty[]
}

export function DataBindingCard({ viewModelProps }: DataBindingCardProps) {
  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle>Data Binding</CardTitle>
        <CardDescription>ViewModel properties (if available).</CardDescription>
      </CardHeader>
      <CardContent>
        {viewModelProps.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            No ViewModel properties found. Data binding requires the .riv file to have a ViewModel configured in the Rive editor, and needs <code className='text-xs bg-muted px-1 py-0.5 rounded'>@rive-app/react-webgl2</code> for full support.
          </p>
        ) : (
          <div className='flex flex-col gap-3'>
            <p className='text-sm text-muted-foreground mb-2'>
              Found {viewModelProps.length} properties:
            </p>
            {viewModelProps.map((prop) => (
              <div key={prop.name} className='flex flex-col gap-1 p-2 bg-muted/50 rounded'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <code className='text-sm font-mono'>{prop.name}</code>
                  <span className='text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded'>
                    {prop.type}
                  </span>
                </div>
                {prop.type === 'boolean' && (
                  <Switch
                    checked={prop.value as boolean}
                    onCheckedChange={(value) => {
                      console.log('Update boolean:', prop.name, value)
                    }}
                  />
                )}
                {prop.type === 'string' && (
                  <Input
                    type='text'
                    placeholder='Enter string value'
                    defaultValue={prop.value as string}
                    onChange={(e) => {
                      console.log('Update string:', prop.name, e.target.value)
                    }}
                  />
                )}
                {prop.type === 'number' && (
                  <Input
                    type='number'
                    placeholder='Enter number'
                    defaultValue={prop.value as number}
                    onChange={(e) => {
                      console.log('Update number:', prop.name, e.target.value)
                    }}
                  />
                )}
                {prop.type === 'trigger' && (
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => {
                      console.log('Fire trigger:', prop.name)
                    }}
                  >
                    Fire Trigger
                  </Button>
                )}
                {prop.type === 'enum' && prop.enumValues && (
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder='Select value' />
                    </SelectTrigger>
                    <SelectContent>
                      {prop.enumValues.map((val) => (
                        <SelectItem key={val} value={val}>
                          {val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
