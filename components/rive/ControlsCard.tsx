'use client'

import { StateMachineInput, StateMachineInputType } from '@rive-app/react-canvas'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  RiveAnimations,
  RiveStateMachines,
  RiveController,
  PlayerState,
  Status,
} from './types'
import { Play, Pause } from 'lucide-react'

interface ControlsCardProps {
  controller: RiveController
  setControllerState: (state: string) => void
  animationList: RiveAnimations | null
  stateMachineList: RiveStateMachines | null
  stateMachineInputs: StateMachineInput[]
  setActiveAnimation: (animation: string) => void
  setActiveStateMachine: (stateMachine: string) => void
  isPlaying: boolean
  togglePlayback: () => void
  status: Status
}

// Compact input row component
function InputRow({ input }: { input: StateMachineInput }) {
  if (input.type === StateMachineInputType.Trigger) {
    return (
      <div className='flex items-center justify-between py-1.5 px-2 bg-muted/30 rounded text-xs'>
        <div className='flex items-center gap-2 min-w-0'>
          <span className='font-mono truncate'>{input.name}</span>
          <span className='px-1 py-0.5 bg-orange-500/20 text-orange-500 rounded text-[10px]'>trig</span>
        </div>
        <Button
          size='sm'
          variant='outline'
          onClick={() => input.fire()}
          className='h-5 text-[10px] px-2'
        >
          Fire
        </Button>
      </div>
    )
  }

  if (input.type === StateMachineInputType.Boolean) {
    return (
      <div className='flex items-center justify-between py-1.5 px-2 bg-muted/30 rounded text-xs'>
        <div className='flex items-center gap-2 min-w-0'>
          <span className='font-mono truncate'>{input.name}</span>
          <span className='px-1 py-0.5 bg-blue-500/20 text-blue-500 rounded text-[10px]'>bool</span>
        </div>
        <Switch
          checked={input.value as boolean}
          onCheckedChange={(value) => { input.value = value }}
          className='scale-75'
        />
      </div>
    )
  }

  if (input.type === StateMachineInputType.Number) {
    return (
      <div className='flex items-center justify-between gap-2 py-1.5 px-2 bg-muted/30 rounded text-xs'>
        <div className='flex items-center gap-2 min-w-0 flex-1'>
          <span className='font-mono truncate'>{input.name}</span>
          <span className='px-1 py-0.5 bg-green-500/20 text-green-500 rounded text-[10px]'>num</span>
        </div>
        <Input
          type='number'
          placeholder='0'
          defaultValue={input.value as number}
          onChange={(e) => { input.value = parseFloat(e.target.value) }}
          className='w-20 h-6 text-xs'
        />
      </div>
    )
  }

  return null
}

export function ControlsCard({
  controller,
  setControllerState,
  animationList,
  stateMachineList,
  stateMachineInputs,
  setActiveAnimation,
  setActiveStateMachine,
  isPlaying,
  togglePlayback,
  status,
}: ControlsCardProps) {
  const hasInputs = stateMachineInputs && stateMachineInputs.length > 0

  return (
    <Card className='min-w-0 overflow-hidden'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base'>Controls</CardTitle>
          {controller.active === 'animations' && (
            <Button
              size='sm'
              variant='outline'
              onClick={togglePlayback}
              disabled={status.current !== PlayerState.Active}
              className='h-7 w-7 p-0'
            >
              {isPlaying ? <Pause className='w-3 h-3' /> : <Play className='w-3 h-3' />}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        <Tabs
          value={controller.active}
          className='w-full'
          onValueChange={(value) => setControllerState(value)}
        >
          <TabsList className='grid w-full grid-cols-2 mb-2'>
            <TabsTrigger value='animations' className='text-xs h-8'>Animations</TabsTrigger>
            <TabsTrigger value='state-machines' className='text-xs h-8'>States</TabsTrigger>
          </TabsList>

          <TabsContent value='animations' className='mt-0'>
            <div className='flex flex-col gap-1 max-h-48 overflow-y-auto'>
              {animationList?.animations.map((animation, index) => (
                <Button
                  key={index}
                  variant={animationList.active === animation ? 'default' : 'outline'}
                  onClick={() => setActiveAnimation(animation)}
                  className='w-full justify-start h-7 text-xs'
                  size='sm'
                >
                  <span className='truncate'>{animation}</span>
                </Button>
              ))}
              {(!animationList || animationList.animations.length === 0) && (
                <p className='text-xs text-muted-foreground py-2'>No animations found.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value='state-machines' className='mt-0'>
            <div className='flex flex-col gap-2'>
              <Select
                value={stateMachineList?.active}
                onValueChange={(value) => setActiveStateMachine(value)}
              >
                <SelectTrigger className='w-full h-8 text-xs'>
                  <SelectValue placeholder='Select State Machine' />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel className='text-xs'>State Machines</SelectLabel>
                    {stateMachineList?.stateMachines.map((stateMachine) => (
                      <SelectItem key={stateMachine} value={stateMachine} className='text-xs'>
                        {stateMachine}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              {hasInputs && (
                <div className='flex flex-col gap-1 max-h-40 overflow-y-auto'>
                  {stateMachineInputs.map((input, index) => (
                    <InputRow key={index} input={input} />
                  ))}
                </div>
              )}
              {!hasInputs && stateMachineList?.active && (
                <p className='text-xs text-muted-foreground'>No inputs for this state machine.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
