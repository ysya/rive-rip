'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

interface SettingsCardProps {
  isTouchScrollEnabled: boolean
  setIsTouchScrollEnabled: (value: boolean) => void
  autoHandleEvents: boolean
  setAutoHandleEvents: (value: boolean) => void
}

export function SettingsCard({
  isTouchScrollEnabled,
  setIsTouchScrollEnabled,
  autoHandleEvents,
  setAutoHandleEvents,
}: SettingsCardProps) {
  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle>Runtime Settings</CardTitle>
        <CardDescription>Configure Rive runtime options.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex flex-col gap-4'>
          <div className='flex items-center justify-between'>
            <div>
              <Label htmlFor='touch-scroll'>Touch Scroll</Label>
              <p className='text-xs text-muted-foreground'>
                Allow page scrolling on touch devices
              </p>
            </div>
            <Switch
              id='touch-scroll'
              checked={isTouchScrollEnabled}
              onCheckedChange={setIsTouchScrollEnabled}
            />
          </div>
          <Separator />
          <div className='flex items-center justify-between'>
            <div>
              <Label htmlFor='auto-events'>Auto Handle Events</Label>
              <p className='text-xs text-muted-foreground'>
                Automatically handle Rive events
              </p>
            </div>
            <Switch
              id='auto-events'
              checked={autoHandleEvents}
              onCheckedChange={setAutoHandleEvents}
            />
          </div>
          <p className='text-xs text-muted-foreground mt-2'>
            Note: Settings apply on next file load.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
