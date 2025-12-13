'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RiveEvent } from './types'

interface EventsCardProps {
  riveEvents: RiveEvent[]
  setRiveEvents: React.Dispatch<React.SetStateAction<RiveEvent[]>>
}

export function EventsCard({ riveEvents, setRiveEvents }: EventsCardProps) {
  return (
    <Card className='w-full'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base'>Rive Events</CardTitle>
          {riveEvents.length > 0 && (
            <Button size='sm' variant='ghost' onClick={() => setRiveEvents([])} className='h-7 text-xs'>
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {riveEvents.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            No events captured yet. Events will appear here when triggered by the animation.
          </p>
        ) : (
          <div className='flex flex-col gap-2 max-h-[200px] overflow-y-auto'>
            {riveEvents.map((event, index) => (
              <div
                key={`${event.timestamp}-${index}`}
                className='p-2 bg-muted rounded-md text-sm'
              >
                <div className='flex justify-between items-center'>
                  <span className='font-medium'>{event.name}</span>
                  <span className='text-xs text-muted-foreground'>
                    {event.type}
                  </span>
                </div>
                {Object.keys(event.properties).length > 0 && (
                  <pre className='text-xs mt-1 text-muted-foreground overflow-x-auto'>
                    {JSON.stringify(event.properties, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
