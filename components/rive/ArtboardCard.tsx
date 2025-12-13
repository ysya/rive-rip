'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArtboardInfo } from './types'

interface ArtboardCardProps {
  artboards: ArtboardInfo[]
  activeArtboard: string | null
  onSelectArtboard: (name: string) => void
}

export function ArtboardCard({
  artboards,
  activeArtboard,
  onSelectArtboard,
}: ArtboardCardProps) {
  return (
    <Card className='w-full'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-base'>Artboards</CardTitle>
      </CardHeader>
      <CardContent>
        {artboards.length === 0 ? (
          <p className='text-xs text-muted-foreground'>
            No artboards found.
          </p>
        ) : (
          <div className='flex flex-col gap-1 max-h-32 overflow-y-auto'>
            {artboards.map((artboard) => (
              <Button
                key={artboard.name}
                variant={activeArtboard === artboard.name ? 'default' : 'outline'}
                size='sm'
                className='justify-between h-7 text-xs'
                onClick={() => onSelectArtboard(artboard.name)}
              >
                <span className='font-mono truncate'>{artboard.name}</span>
                {artboard.width > 0 && (
                  <span className='text-xs opacity-60 ml-1'>
                    {artboard.width}×{artboard.height}
                  </span>
                )}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
