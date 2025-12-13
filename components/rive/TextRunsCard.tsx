'use client'

import { Rive } from '@rive-app/react-canvas'
import {
  Card,
  CardContent,
  CardDescription,
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
      <CardHeader>
        <CardTitle>Text Runs</CardTitle>
        <CardDescription>Edit text elements in the animation.</CardDescription>
      </CardHeader>
      <CardContent>
        {textRuns.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            No text runs found. Text runs allow you to dynamically change text in your Rive animations.
          </p>
        ) : (
          <div className='flex flex-col gap-3'>
            {textRuns.map((textRun) => (
              <div key={textRun.name} className='flex flex-col gap-1'>
                <Label htmlFor={`textrun-${textRun.name}`}>{textRun.name}</Label>
                <Input
                  id={`textrun-${textRun.name}`}
                  type='text'
                  value={textRun.value}
                  onChange={(e) => updateTextRun(textRun.name, e.target.value)}
                  placeholder={`Enter value for ${textRun.name}`}
                />
              </div>
            ))}
          </div>
        )}
        <div className='mt-4'>
          <h3 className='text-sm font-medium mb-2'>Add Custom Text Run</h3>
          <div className='flex gap-2'>
            <Input
              id='custom-textrun-name'
              type='text'
              placeholder='Text run name'
              className='flex-1'
            />
            <Button size='sm' variant='outline' onClick={handleFindTextRun}>
              Find
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
