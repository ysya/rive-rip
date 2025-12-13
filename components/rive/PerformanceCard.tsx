'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PerformanceStats, PlayerState, Status } from './types'

interface PerformanceCardProps {
  performanceStats: PerformanceStats
  status: Status
  isPlaying: boolean
}

export function PerformanceCard({ performanceStats, status, isPlaying }: PerformanceCardProps) {
  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle>Performance</CardTitle>
        <CardDescription>Real-time animation statistics.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-3 gap-4'>
          <div className='flex flex-col items-center p-3 bg-muted rounded-lg'>
            <span className='text-2xl font-bold'>{performanceStats.fps}</span>
            <span className='text-xs text-muted-foreground'>FPS</span>
          </div>
          <div className='flex flex-col items-center p-3 bg-muted rounded-lg'>
            <span className='text-2xl font-bold'>
              {performanceStats.frameTime > 0 ? performanceStats.frameTime.toFixed(1) : '0'}
            </span>
            <span className='text-xs text-muted-foreground'>ms/frame</span>
          </div>
          <div className='flex flex-col items-center p-3 bg-muted rounded-lg'>
            <span className='text-2xl font-bold text-center text-sm'>
              {status.current === PlayerState.Active ? (isPlaying ? 'Playing' : 'Paused') : 'Idle'}
            </span>
            <span className='text-xs text-muted-foreground'>Status</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
