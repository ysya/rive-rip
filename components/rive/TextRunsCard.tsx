'use client'

import { Rive } from '@rive-app/react-canvas'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { TextRun } from './types'

interface TextRunsCardProps {
  textRuns: TextRun[]
  setTextRuns: React.Dispatch<React.SetStateAction<TextRun[]>>
  riveAnimation: Rive | null
  updateTextRun: (name: string, value: string) => void
}

export function TextRunsCard({
  textRuns,
  setTextRuns,
  riveAnimation,
  updateTextRun,
}: TextRunsCardProps) {
  const handleFindTextRun = () => {
    const input = document.getElementById('custom-textrun-name') as HTMLInputElement
    if (input?.value && riveAnimation) {
      try {
        const value = riveAnimation.getTextRunValue(input.value)
        if (value !== undefined) {
          setTextRuns((prev) => [...prev, { name: input.value, value: String(value) }])
          toast.success(`Found text run: ${input.value}`)
          input.value = ''
        } else {
          toast.error(`Text run "${input.value}" not found`)
        }
      } catch {
        toast.error(`Text run "${input.value}" not found`)
      }
    }
  }

  return (
    <Card className='w-full'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-base'>Text Runs</CardTitle>
      </CardHeader>
      <CardContent>
        {textRuns.length === 0 ? (
          <p className='text-xs text-muted-foreground'>
            No text runs found.
          </p>
        ) : (
          <div className='flex flex-col gap-2 max-h-40 overflow-y-auto'>
            {textRuns.map((textRun) => (
              <div key={textRun.name} className='flex items-center gap-2'>
                <Label htmlFor={`textrun-${textRun.name}`} className='text-xs font-mono min-w-0 truncate shrink-0 max-w-20' title={textRun.name}>
                  {textRun.name}
                </Label>
                <Input
                  id={`textrun-${textRun.name}`}
                  type='text'
                  value={textRun.value}
                  onChange={(e) => updateTextRun(textRun.name, e.target.value)}
                  placeholder='Enter text'
                  className='h-7 text-xs flex-1'
                />
              </div>
            ))}
          </div>
        )}
        <div className='mt-3 pt-3 border-t'>
          <div className='flex gap-2'>
            <Input
              id='custom-textrun-name'
              type='text'
              placeholder='Text run name'
              className='flex-1 h-7 text-xs'
            />
            <Button size='sm' variant='outline' onClick={handleFindTextRun} className='h-7 text-xs'>
              Find
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
