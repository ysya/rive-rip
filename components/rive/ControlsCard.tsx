'use client'

import { StateMachineInput, StateMachineInputType } from '@rive-app/react-canvas'
import {
  Card,
  CardContent,
  CardDescription,
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
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  RiveAnimations,
  RiveStateMachines,
  RiveController,
  PlayerState,
  Status,
} from './types'

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
  return (
    <Card className='min-w-0 overflow-hidden'>
      <CardHeader>
        <CardTitle>Controls</CardTitle>
        <CardDescription>Interact with the animation.</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4 overflow-x-auto'>
        <Tabs
          value={controller.active}
          className='w-full flex flex-col items-center'
          onValueChange={(value) => setControllerState(value)}
        >
          <TabsList className='grid w-full grid-cols-2 mb-2'>
            <TabsTrigger value='animations' className='text-xs sm:text-sm'>Animations</TabsTrigger>
            <TabsTrigger value='state-machines' className='text-xs sm:text-sm'>State Machines</TabsTrigger>
          </TabsList>
          <TabsContent value='animations' className='w-full'>
            <div className='w-full'>
              <ul className='grid grid-cols-1 sm:grid-cols-2 gap-2 w-full'>
                {animationList?.animations.map((animation, index) => (
                  <li key={index} className='w-full'>
                    <Button
                      variant={
                        animationList.active === animation
                          ? 'default'
                          : 'outline'
                      }
                      onClick={() => setActiveAnimation(animation)}
                      className='w-full'
                      size='xs'
                    >
                      {animation}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
          <TabsContent
            value='state-machines'
            className='w-full flex flex-col items-center'
          >
            <Select
              value={stateMachineList?.active}
              onValueChange={(value) => setActiveStateMachine(value)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select State Machine' />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Available State Machines</SelectLabel>
                  {stateMachineList?.stateMachines.map((stateMachine) => (
                    <SelectItem key={stateMachine} value={stateMachine}>
                      {stateMachine}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <div className='w-full mt-2'>
              {/* Trigger inputs */}
              {stateMachineInputs?.some(
                (input) => input.type === StateMachineInputType.Trigger,
              ) && (
                <>
                  <h2 className='text-lg font-medium mb-2'>Triggers</h2>
                  <ul className='grid grid-cols-1 sm:grid-cols-2 gap-2 w-full'>
                    {stateMachineInputs
                      ?.filter(
                        (input) =>
                          input.type === StateMachineInputType.Trigger,
                      )
                      .map((input, index) => (
                        <li key={index} className='w-full'>
                          <Button
                            variant='default'
                            onClick={() => input.fire()}
                            className='w-full'
                            size='xs'
                          >
                            {input.name}
                          </Button>
                        </li>
                      ))}
                  </ul>
                </>
              )}
              {/* Boolean inputs */}
              {stateMachineInputs.some(
                (input) => input.type === StateMachineInputType.Boolean,
              ) && (
                <>
                  <h2 className='text-lg font-medium mt-4 mb-2'>Booleans</h2>
                  <ul className='flex flex-col gap-2 w-full'>
                    {stateMachineInputs
                      ?.filter(
                        (input) =>
                          input.type === StateMachineInputType.Boolean,
                      )
                      .map((input, index) => (
                        <li key={index} className='w-full'>
                          <div className='flex items-center space-x-2'>
                            <Switch
                              id={input.name}
                              onCheckedChange={(value) => {
                                input.value = value
                              }}
                            />
                            <Label htmlFor={input.name}>{input.name}</Label>
                          </div>
                        </li>
                      ))}
                  </ul>
                </>
              )}
              {/* Number inputs */}
              {stateMachineInputs.some(
                (input) => input.type === StateMachineInputType.Number,
              ) && (
                <>
                  <h2 className='text-lg font-medium mt-4 mb-2'>Numbers</h2>
                  <ul className='flex flex-col gap-2 w-full'>
                    {stateMachineInputs
                      ?.filter(
                        (input) =>
                          input.type === StateMachineInputType.Number,
                      )
                      .map((input, index) => (
                        <li key={index} className='w-full'>
                          <div className='w-full max-w-sm'>
                            <Label htmlFor={input.name}>{input.name}</Label>
                            <Input
                              type='number'
                              id={input.name}
                              placeholder='Enter a number'
                              onChange={(e) => {
                                input.value = parseFloat(e.target.value)
                              }}
                            />
                          </div>
                        </li>
                      ))}
                  </ul>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
        {/* Play/pause button for animations */}
        {controller.active === 'animations' && (
          <>
            <Separator orientation='horizontal' />
            <Button
              onClick={togglePlayback}
              disabled={status.current !== PlayerState.Active}
              variant='secondary'
            >
              {status.current !== PlayerState.Active
                ? 'Play/Pause'
                : isPlaying
                ? 'Pause'
                : 'Play'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
