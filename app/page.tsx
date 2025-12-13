'use client'

import { DragEvent, useState, useRef, useEffect } from 'react'
import {
  Rive,
  Layout,
  EventType,
  Fit,
  Alignment,
  StateMachineInput,
  RiveEventType,
} from '@rive-app/react-canvas'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Toaster, toast } from 'sonner'
import { Upload } from 'lucide-react'
import { LaptopIcon } from '@radix-ui/react-icons'
import { ArrowRight } from 'lucide-react'
import { sendGAEvent } from '@next/third-parties/google'

// Import Rive components
import {
  TextRun,
  RiveEvent,
  ViewModelProperty,
  PerformanceStats,
  BackgroundColor,
  RiveAnimations,
  RiveStateMachines,
  RiveController,
  PlayerState,
  PlayerError,
  Status,
} from '@/components/rive'
import { PerformanceCard } from '@/components/rive/PerformanceCard'
import { SettingsCard } from '@/components/rive/SettingsCard'
import { TextRunsCard } from '@/components/rive/TextRunsCard'
import { EventsCard } from '@/components/rive/EventsCard'
import { DataBindingCard } from '@/components/rive/DataBindingCard'
import { ControlsCard } from '@/components/rive/ControlsCard'
import { AppearanceCard } from '@/components/rive/AppearanceCard'
import {
  LayoutCard,
  fitValues,
  alignValues,
  AlignFitIndex,
} from '@/components/rive/LayoutCard'

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Core state
  const [status, setStatus] = useState<Status>({
    current: PlayerState.Idle,
    hovering: false,
  })
  const [filename, setFilename] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<string | null>(null)
  const [riveAnimation, setRiveAnimation] = useState<Rive | null>(null)
  const [animationList, setAnimationList] = useState<RiveAnimations | null>(
    null,
  )
  const [stateMachineList, setStateMachineList] =
    useState<RiveStateMachines | null>(null)
  const [stateMachineInputs, setStateMachineInputs] = useState<
    StateMachineInput[]
  >([])
  const [isPlaying, setIsPlaying] = useState<boolean>(true)
  const [controller, setController] = useState<RiveController>({
    active: 'animations',
  })
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [background, setBackground] = useState<BackgroundColor>('black')
  const [alignFitIndex, setAlignFitIndex] = useState<AlignFitIndex>({
    alignment: alignValues.indexOf('Center'),
    fit: fitValues.indexOf('Cover'),
  })

  // New feature states
  const [textRuns, setTextRuns] = useState<TextRun[]>([])
  const [riveEvents, setRiveEvents] = useState<RiveEvent[]>([])
  const [viewModelProps, setViewModelProps] = useState<ViewModelProperty[]>([])
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({
    fps: 0,
    frameTime: 0,
    lastAdvanceTime: 0,
  })
  const [isTouchScrollEnabled, setIsTouchScrollEnabled] =
    useState<boolean>(true)
  const [autoHandleEvents, setAutoHandleEvents] = useState<boolean>(true)
  const frameCountRef = useRef<number>(0)
  const lastFpsUpdateRef = useRef<number>(performance.now())

  // Event handlers setup
  useEffect(() => {
    if (!riveAnimation) return

    const handleLoad = () => {
      getAnimationList()
      getStateMachineList()
      getTextRuns()
      getViewModelProperties()
      setStatus({ current: PlayerState.Active, error: null })
      setControllerState(controller.active)
    }

    const handleLoadError = () => {
      setStatus({ current: PlayerState.Error, error: PlayerError.NoAnimation })
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleStop = () => setIsPlaying(false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleRiveEvent = (event: any) => {
      const eventData = event.data
      if (!eventData) return
      const eventType = eventData.type === RiveEventType.General ? 'General' : 'OpenUrl'
      const newEvent: RiveEvent = {
        name: eventData.name || 'Unknown',
        type: eventType,
        properties: eventData.properties || {},
        timestamp: Date.now(),
      }
      setRiveEvents((prev) => [newEvent, ...prev].slice(0, 50))
      toast.info(`Rive Event: ${eventData.name || 'Unknown'}`, {
        description: `Type: ${eventType}`,
      })
    }

    const handleAdvance = () => {
      frameCountRef.current++
      const now = performance.now()
      const elapsed = now - lastFpsUpdateRef.current

      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed)
        setPerformanceStats({
          fps,
          frameTime: elapsed / frameCountRef.current,
          lastAdvanceTime: now,
        })
        frameCountRef.current = 0
        lastFpsUpdateRef.current = now
      }
    }

    riveAnimation.on(EventType.Load, handleLoad)
    riveAnimation.on(EventType.LoadError, handleLoadError)
    riveAnimation.on(EventType.Play, handlePlay)
    riveAnimation.on(EventType.Pause, handlePause)
    riveAnimation.on(EventType.Stop, handleStop)
    riveAnimation.on(EventType.RiveEvent, handleRiveEvent)
    riveAnimation.on(EventType.Advance, handleAdvance)

    return () => {
      riveAnimation.off(EventType.Load, handleLoad)
      riveAnimation.off(EventType.LoadError, handleLoadError)
      riveAnimation.off(EventType.Play, handlePlay)
      riveAnimation.off(EventType.Pause, handlePause)
      riveAnimation.off(EventType.Stop, handleStop)
      riveAnimation.off(EventType.RiveEvent, handleRiveEvent)
      riveAnimation.off(EventType.Advance, handleAdvance)
    }
  }, [riveAnimation])

  useEffect(() => {
    if (status.current === PlayerState.Error && status.error !== null) {
      reset()
      toast.error('Your file has no animations.')
    } else {
      if (status.current === PlayerState.Active && !animationList)
        getAnimationList()
      if (status.current === PlayerState.Active && !stateMachineList)
        getStateMachineList()
    }
  }, [status])

  useEffect(() => {
    if (riveAnimation) {
      riveAnimation.layout = new Layout({
        fit: Fit[fitValues[alignFitIndex.fit]],
        alignment: Alignment[alignValues[alignFitIndex.alignment]],
      })
    }
  }, [alignFitIndex, riveAnimation])

  useEffect(() => {
    if (canvasRef.current && dimensions && riveAnimation) {
      canvasRef.current.width = dimensions.width
      canvasRef.current.height = dimensions.height
      riveAnimation.resizeToCanvas()
    }
  }, [dimensions, riveAnimation])

  useEffect(() => {
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Helper functions
  const updateDimensions = () => {
    const targetDimensions =
      previewRef.current?.getBoundingClientRect() ?? new DOMRect(0, 0, 0, 0)
    if (
      targetDimensions.width === dimensions.width &&
      targetDimensions.height === dimensions.height
    )
      return
    setDimensions({
      width: targetDimensions.width,
      height: targetDimensions.height,
    })
  }

  const togglePlayback = () => {
    const active = animationList?.active
    if (active) {
      if (!isPlaying) riveAnimation?.play(active)
      if (isPlaying) riveAnimation?.pause(active)
    }
  }

  const setAnimationWithBuffer = (buffer: string | ArrayBuffer | null) => {
    if (!buffer) return

    setStatus({ current: PlayerState.Loading })
    if (riveAnimation) {
      riveAnimation.load({ buffer: buffer as ArrayBuffer, autoplay: true })
      return
    }

    try {
      setRiveAnimation(
        new Rive({
          buffer: buffer as ArrayBuffer,
          canvas: canvasRef.current!,
          autoplay: true,
          layout: new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
          isTouchScrollEnabled,
          automaticallyHandleEvents: autoHandleEvents,
          enableRiveAssetCDN: true,
        }),
      )
      setStatus({ current: PlayerState.Active })
    } catch {
      setStatus({ current: PlayerState.Error, error: PlayerError.NoAnimation })
    }
  }

  const load = (file: File) => {
    setFilename(file.name)
    setFileSize(formatFileSize(file.size))
    const reader = new FileReader()
    reader.onload = () => setAnimationWithBuffer(reader.result)
    reader.readAsArrayBuffer(file)
    sendGAEvent('event', 'upload', { filename: file.name, fileSize: file.size })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes'
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    else return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const reset = () => {
    setIsPlaying(true)
    setFilename(null)
    setRiveAnimation(null)
    setAnimationList(null)
    setStateMachineList(null)
    setStateMachineInputs([])
    setTextRuns([])
    setRiveEvents([])
    setViewModelProps([])
    setPerformanceStats({ fps: 0, frameTime: 0, lastAdvanceTime: 0 })
    frameCountRef.current = 0
    lastFpsUpdateRef.current = performance.now()
    setStatus({ ...status, current: PlayerState.Idle })
    clearCanvas()
  }

  const setControllerState = (state: string) => {
    if (state !== 'animations' && state !== 'state-machines') return
    setController({
      ...controller,
      active: state === 'animations' ? 'animations' : 'state-machines',
    })
    if (state === 'animations' && animationList)
      setActiveAnimation(animationList.active)
    else if (state === 'state-machines' && stateMachineList)
      setActiveStateMachine(stateMachineList.active)
  }

  const setActiveAnimation = (animation: string) => {
    if (!riveAnimation || !animationList) return
    clearCanvas()
    riveAnimation.stop(animationList.active)
    setAnimationList({ ...animationList, active: animation })
    riveAnimation.play(animation)
  }

  const setActiveStateMachine = (stateMachine: string) => {
    if (!riveAnimation || !stateMachineList) return
    clearCanvas()
    riveAnimation.stop(stateMachineList.active)
    setStateMachineList({ ...stateMachineList, active: stateMachine })
    riveAnimation.play(stateMachine)
    const inputs = riveAnimation.stateMachineInputs(stateMachine)
    setStateMachineInputs(inputs)
  }

  const getAnimationList = () => {
    const animations = riveAnimation?.animationNames
    if (!animations) return
    setAnimationList({ animations, active: animations[0] })
  }

  const getStateMachineList = () => {
    const stateMachines = riveAnimation?.stateMachineNames
    if (!stateMachines) return
    setStateMachineList({ stateMachines, active: stateMachines[0] })
  }

  const getTextRuns = () => {
    if (!riveAnimation) return
    try {
      const foundTextRuns: TextRun[] = []
      const commonNames = [
        'title',
        'subtitle',
        'label',
        'text',
        'heading',
        'description',
        'name',
        'value',
        'count',
        'message',
      ]
      for (const name of commonNames) {
        try {
          const value = riveAnimation.getTextRunValue(name)
          if (value !== undefined && value !== null) {
            foundTextRuns.push({ name, value: String(value) })
          }
        } catch {
          /* continue */
        }
      }
      setTextRuns(foundTextRuns)
    } catch {
      setTextRuns([])
    }
  }

  const updateTextRun = (name: string, value: string) => {
    if (!riveAnimation) return
    try {
      riveAnimation.setTextRunValue(name, value)
      setTextRuns((prev) =>
        prev.map((tr) => (tr.name === name ? { ...tr, value } : tr)),
      )
    } catch (error) {
      console.error('Failed to update text run:', error)
      toast.error(`Failed to update text run: ${name}`)
    }
  }

  const getViewModelProperties = () => {
    if (!riveAnimation) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rive = riveAnimation as any
      const props: ViewModelProperty[] = []

      // Check viewModelCount and iterate through all ViewModels
      if (typeof rive.viewModelCount === 'number' && rive.viewModelCount > 0) {
        for (let i = 0; i < rive.viewModelCount; i++) {
          const vm = rive.viewModelByIndex(i)
          if (vm && vm.properties) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vm.properties.forEach((prop: any) => {
              props.push({
                name: `${vm.name || `ViewModel${i}`}/${prop.name}`,
                type: prop.type || 'unknown',
                value: undefined,
              })
            })
          }
        }
      }

      // Also try defaultViewModel
      if (typeof rive.defaultViewModel === 'function') {
        const defaultVM = rive.defaultViewModel()
        if (defaultVM && defaultVM.properties) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          defaultVM.properties.forEach((prop: any) => {
            const exists = props.some(p => p.name.includes(`/${prop.name}`))
            if (!exists) {
              props.push({
                name: `default/${prop.name}`,
                type: prop.type || 'unknown',
                value: undefined,
              })
            }
          })
        }
      }

      setViewModelProps(props)
      if (props.length > 0) {
        console.log('Found ViewModel properties:', props)
      }
    } catch (error) {
      console.log('ViewModel not available:', error)
      setViewModelProps([])
    }
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    setStatus({ ...status, hovering: true })
    e.preventDefault()
    e.stopPropagation()
  }
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    setStatus({ ...status, hovering: false })
    e.preventDefault()
    e.stopPropagation()
  }
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    setStatus({ ...status, hovering: true })
    e.dataTransfer.dropEffect = 'copy'
    e.preventDefault()
    e.stopPropagation()
  }
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    setStatus({ ...status, hovering: false })
    load(e.dataTransfer.files[0])
    e.preventDefault()
    e.stopPropagation()
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    riveAnimation?.stop()
    const ctx = canvas.getContext('2d', { alpha: false })
    ctx!.clearRect(0, 0, canvas.width, canvas.height)
  }

  const shouldDisplayCanvas = () =>
    [PlayerState.Active, PlayerState.Loading].includes(status.current)

  return (
    <>
      <main className='flex-1 font-[family-name:var(--font-geist-sans)]'>
        <Toaster richColors visibleToasts={10} />
        <div id='container' className='px-4 sm:px-8 max-w-350 mx-auto overflow-x-hidden'>
          {/* Header */}
          <div className='relative flex w-full flex-col items-start'>
            <section className='mx-auto flex flex-col items-start gap-2 px-4 py-8 md:py-12 md:pb-8 lg:py-12 lg::pb-10 w-full'>
              <a
                className='group inline-flex items-center px-0.5 text-sm font-medium'
                href='https://editor.rive.app/'
                target='_blank'
                rel='noopener noreferrer'
              >
                <LaptopIcon className='h-4 w-4' />
                <Separator orientation='vertical' className='mx-2 h-4' />
                <span className='underline-offset-4 group-hover:underline'>
                  open rive editor
                </span>
                <ArrowRight className='h-4 w-4 ml-1' />
              </a>
              <h1 className='text-3xl font-bold leading-tight tracking-tighter md:text-4xl lg:leading-[1.1] hidden md:block'>
                Rive Web Runtime, Upgraded.
              </h1>
              <h1 className='text-3xl font-bold leading-tight tracking-tighter md:text-4xl lg:leading-[1.1] md:hidden'>
                Rive Runtime.
              </h1>
              <p className='max-w-2xl text-lg font-light text-foreground'>
                Test interactions through animations and the state machine.
              </p>
              <div className='flex w-full items-center justify-start gap-2 py-2'>
                <a
                  href='https://github.com/albertcai101/rive-rip'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <Button size='xs'>Star on GitHub</Button>
                </a>
                <a
                  href='https://rive.app/preview/'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <Button size='xs' variant='ghost'>
                    Use Old Rive Preview
                  </Button>
                </a>
              </div>
            </section>
          </div>

          {/* Main Grid */}
          <div className='grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4'>
            {/* Preview Card */}
            <div className='flex flex-col gap-8 min-w-0'>
              <Card className='min-w-0 overflow-hidden'>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    {filename ? (
                      <span>
                        {filename}{' '}
                        <span className='text-muted-foreground'>
                          ({fileSize})
                        </span>
                      </span>
                    ) : (
                      'Choose a file to get started.'
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    ref={previewRef}
                    className={`relative w-full h-100 md:h-125 lg:h-150 rounded-lg overflow-hidden ${
                      background === 'white'
                        ? 'bg-white'
                        : background === 'black'
                        ? 'bg-black'
                        : 'bg-transparent'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                  >
                    <canvas
                      ref={canvasRef}
                      className='absolute inset-0 w-full h-full'
                      style={{
                        display: shouldDisplayCanvas() ? 'block' : 'none',
                      }}
                    />
                    <div
                      className='absolute inset-0 flex flex-col items-center justify-center gap-4'
                      style={{
                        display: shouldDisplayCanvas() ? 'none' : 'flex',
                      }}
                    >
                      <Upload className='w-8 h-8' />
                      Drag and drop a Rive file or
                      <Button onClick={() => inputRef.current?.click()}>
                        Browse
                      </Button>
                      <input
                        hidden
                        type='file'
                        accept='.riv'
                        ref={inputRef}
                        onChange={(e) => {
                          const files = e.target.files
                          if (files) load(files[0])
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className='flex flex-col gap-4'>
              <ControlsCard
                controller={controller}
                setControllerState={setControllerState}
                animationList={animationList}
                stateMachineList={stateMachineList}
                stateMachineInputs={stateMachineInputs}
                setActiveAnimation={setActiveAnimation}
                setActiveStateMachine={setActiveStateMachine}
                isPlaying={isPlaying}
                togglePlayback={togglePlayback}
                status={status}
              />
              <PerformanceCard
                performanceStats={performanceStats}
                status={status}
                isPlaying={isPlaying}
              />
              <SettingsCard
                isTouchScrollEnabled={isTouchScrollEnabled}
                setIsTouchScrollEnabled={setIsTouchScrollEnabled}
                autoHandleEvents={autoHandleEvents}
                setAutoHandleEvents={setAutoHandleEvents}
              />
            </div>

            {/* Bottom Row */}
            <div className='col-span-1 lg:col-span-2 flex flex-wrap gap-4'>
              <AppearanceCard
                background={background}
                setBackground={setBackground}
              />
              <LayoutCard
                alignFitIndex={alignFitIndex}
                setAlignFitIndex={setAlignFitIndex}
              />
              {/* Code Snippets Card */}
              <Card className='w-full sm:flex-1 min-w-0'>
                <CardHeader>
                  <CardTitle>Code Snippets</CardTitle>
                  <CardDescription>Copy code for your project.</CardDescription>
                </CardHeader>
                <CardContent className='overflow-x-auto'>
                  <Tabs defaultValue='web'>
                    <TabsList className='mb-2 flex-wrap h-auto'>
                      <TabsTrigger value='web'>Web</TabsTrigger>
                      <TabsTrigger value='react'>React</TabsTrigger>
                      <TabsTrigger value='flutter'>Flutter</TabsTrigger>
                      <TabsTrigger value='apple'>iOS/macOS</TabsTrigger>
                      <TabsTrigger value='android'>Android</TabsTrigger>
                    </TabsList>
                    <TabsContent value='web'>Coming soon.</TabsContent>
                    <TabsContent value='react'>Coming soon.</TabsContent>
                    <TabsContent value='flutter'>Coming soon.</TabsContent>
                    <TabsContent value='apple'>Coming soon.</TabsContent>
                    <TabsContent value='android'>Coming soon.</TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* New Features Row */}
            <div className='col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <TextRunsCard
                textRuns={textRuns}
                setTextRuns={setTextRuns}
                riveAnimation={riveAnimation}
                updateTextRun={updateTextRun}
              />
              <EventsCard
                riveEvents={riveEvents}
                setRiveEvents={setRiveEvents}
              />
              <DataBindingCard viewModelProps={viewModelProps} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className='py-6 md:px-8 md:py-0 font-[family-name:var(--font-geist-sans)]'>
        <div className='container px-8 mx-5 flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row'>
          <p className='text-balance text-center text-sm leading-loose text-muted-foreground md:text-left'>
            Built by{' '}
            <a
              href='https://spellr.org'
              target='_blank'
              rel='noopener noreferrer'
              className='font_medium underline underline-offset-4'
            >
              spellr
            </a>
            . Made to simplify the handoff from animators to developers.
          </p>
        </div>
      </footer>
    </>
  )
}
