'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AssetInfo } from './types'
import { ImageIcon, Type, Volume2, FileQuestion } from 'lucide-react'

interface AssetsCardProps {
  assets: AssetInfo[]
}

const AssetIcon = ({ type }: { type: AssetInfo['type'] }) => {
  switch (type) {
    case 'image':
      return <ImageIcon className='w-3 h-3' />
    case 'font':
      return <Type className='w-3 h-3' />
    case 'audio':
      return <Volume2 className='w-3 h-3' />
    default:
      return <FileQuestion className='w-3 h-3' />
  }
}

export function AssetsCard({ assets }: AssetsCardProps) {
  const groupedAssets = assets.reduce((acc, asset) => {
    if (!acc[asset.type]) acc[asset.type] = []
    acc[asset.type].push(asset)
    return acc
  }, {} as Record<string, AssetInfo[]>)

  return (
    <Card className='w-full'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-base'>Assets</CardTitle>
      </CardHeader>
      <CardContent>
        {assets.length === 0 ? (
          <p className='text-xs text-muted-foreground'>
            No assets found.
          </p>
        ) : (
          <div className='flex flex-col gap-2 max-h-32 overflow-y-auto'>
            {Object.entries(groupedAssets).map(([type, items]) => (
              <div key={type} className='flex items-center gap-2 text-xs'>
                <AssetIcon type={type as AssetInfo['type']} />
                <span className='capitalize'>{type}s</span>
                <span className='text-muted-foreground'>({items.length})</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
