'use client'

import { DragEvent, useState, useRef, useEffect, useCallback } from 'react'
import {
  useRive,
  useViewModel,
  useViewModelInstance,
  Layout,
  Fit,
  Alignment,
  EventType,
  RiveEventType,
  StateMachineInput,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Toaster, toast } from 'sonner'
import { Upload, Download, Camera, Settings } from 'lucide-react'
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
  Status,
  ArtboardInfo,
  AssetInfo,
} from '@/components/rive'
import { TextRunsCard } from '@/components/rive/TextRunsCard'
import { EventsCard } from '@/components/rive/EventsCard'
import { DataBindingCard } from '@/components/rive/DataBindingCard'
import { ControlsCard } from '@/components/rive/ControlsCard'
import {
  LayoutCard,
  fitValues,
  alignValues,
  AlignFitIndex,
} from '@/components/rive/LayoutCard'
import { ArtboardCard } from '@/components/rive/ArtboardCard'
import { AssetsCard } from '@/components/rive/AssetsCard'

export default function Home() {
  const previewRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // File state
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)
  const [filename, setFilename] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<string | null>(null)

  // Core state
  const [status, setStatus] = useState<Status>({
    current: PlayerState.Idle,
    hovering: false,
  })
  const [animationList, setAnimationList] = useState<RiveAnimations | null>(null)
  const [stateMachineList, setStateMachineList] = useState<RiveStateMachines | null>(null)
  const [stateMachineInputs, setStateMachineInputs] = useState<StateMachineInput[]>([])
  const [isPlaying, setIsPlaying] = useState<boolean>(true)
  const [controller, setController] = useState<RiveController>({
    active: 'animations',
  })
  const [background, setBackground] = useState<BackgroundColor>('black')
  const [alignFitIndex, setAlignFitIndex] = useState<AlignFitIndex>({
    alignment: alignValues.indexOf('Center'),
    fit: fitValues.indexOf('Contain'),
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
  const [isTouchScrollEnabled, setIsTouchScrollEnabled] = useState<boolean>(true)
  const [autoHandleEvents, setAutoHandleEvents] = useState<boolean>(true)
  const [artboards, setArtboards] = useState<ArtboardInfo[]>([])
  const [activeArtboard, setActiveArtboard] = useState<string | null>(null)
  const [assets, setAssets] = useState<AssetInfo[]>([])
  const frameCountRef = useRef<number>(0)
  const lastFpsUpdateRef = useRef<number>(performance.now())

  // useRive hook - only initialize when we have a buffer
  const { rive, RiveComponent } = useRive(
    fileBuffer
      ? {
          buffer: fileBuffer,
          autoplay: true,
          layout: new Layout({
            fit: Fit[fitValues[alignFitIndex.fit]],
            alignment: Alignment[alignValues[alignFitIndex.alignment]],
          }),
          isTouchScrollEnabled,
          automaticallyHandleEvents: autoHandleEvents,
          enableRiveAssetCDN: true,
          onLoad: () => {
            setStatus({ current: PlayerState.Active, error: null })
          },
          onLoadError: () => {
            setStatus({ current: PlayerState.Error, error: 'Failed to load animation' })
            toast.error('Failed to load animation')
          },
          onPlay: () => setIsPlaying(true),
          onPause: () => setIsPlaying(false),
          onStop: () => setIsPlaying(false),
        }
      : null,
    {
      shouldResizeCanvasToContainer: true,
      fitCanvasToArtboardHeight: false,
    }
  )

  // ViewModel hooks for Data Binding
  const viewModel = useViewModel(rive, { useDefault: true })
  const viewModelInstance = useViewModelInstance(viewModel, { rive })

  // Handle Rive events
  useEffect(() => {
    if (!rive) return

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

    rive.on(EventType.RiveEvent, handleRiveEvent)
    rive.on(EventType.Advance, handleAdvance)

    return () => {
      rive.off(EventType.RiveEvent, handleRiveEvent)
      rive.off(EventType.Advance, handleAdvance)
    }
  }, [rive])

  // Initialize animation list and state machines when rive is loaded
  useEffect(() => {
    if (!rive) return

    // Get animations
    const animations = rive.animationNames
    if (animations && animations.length > 0) {
      setAnimationList({ animations, active: animations[0] })
    }

    // Get state machines
    const stateMachines = rive.stateMachineNames
    if (stateMachines && stateMachines.length > 0) {
      setStateMachineList({ stateMachines, active: stateMachines[0] })

      // If default controller is state-machines, we need to play the state machine
      // to get the inputs. Otherwise, inputs won't be available until played.
      if (controller.active === 'state-machines') {
        rive.stop()
        rive.play(stateMachines[0])
        // Small delay to ensure state machine is initialized before getting inputs
        setTimeout(() => {
          const inputs = rive.stateMachineInputs(stateMachines[0])
          if (inputs) setStateMachineInputs(inputs)
        }, 50)
      } else {
        // For animations mode, still try to get inputs (they may be empty)
        const inputs = rive.stateMachineInputs(stateMachines[0])
        if (inputs) setStateMachineInputs(inputs)
      }
    }

    // Get text runs
    getTextRuns()

    // Get ViewModel properties
    getViewModelProperties()

    // Get artboards and assets
    getArtboards()
    getAssets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rive])

  // Update layout when alignFitIndex changes
  useEffect(() => {
    if (rive) {
      rive.layout = new Layout({
        fit: Fit[fitValues[alignFitIndex.fit]],
        alignment: Alignment[alignValues[alignFitIndex.alignment]],
      })
    }
  }, [alignFitIndex, rive])

  // Get text runs from animation
  const getTextRuns = useCallback(() => {
    if (!rive) return
    try {
      const foundTextRuns: TextRun[] = []
      const commonNames = [
        'title', 'subtitle', 'label', 'text', 'heading',
        'description', 'name', 'value', 'count', 'message',
      ]
      for (const name of commonNames) {
        try {
          const value = rive.getTextRunValue(name)
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
  }, [rive])

  // Get ViewModel properties
  const getViewModelProperties = useCallback(() => {
    if (!rive) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const riveInstance = rive as any
      const props: ViewModelProperty[] = []

      // Check viewModelCount and iterate through all ViewModels
      if (typeof riveInstance.viewModelCount === 'number' && riveInstance.viewModelCount > 0) {
        for (let i = 0; i < riveInstance.viewModelCount; i++) {
          const vm = riveInstance.viewModelByIndex(i)
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
      if (typeof riveInstance.defaultViewModel === 'function') {
        const defaultVM = riveInstance.defaultViewModel()
        if (defaultVM && defaultVM.properties) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          defaultVM.properties.forEach((prop: any) => {
            const exists = props.some((p) => p.name.includes(`/${prop.name}`))
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
  }, [rive])

  // Get artboards from Rive file
  const getArtboards = useCallback(() => {
    if (!rive) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const riveInstance = rive as any
      const artboardList: ArtboardInfo[] = []

      // Try to get artboard names from the file
      if (typeof riveInstance.artboardNames === 'object' && Array.isArray(riveInstance.artboardNames)) {
        riveInstance.artboardNames.forEach((name: string) => {
          artboardList.push({
            name,
            width: 0,
            height: 0,
          })
        })
      }

      // Get current artboard info
      const currentArtboard = riveInstance.artboard
      if (currentArtboard) {
        const name = currentArtboard.name || 'Default'
        const existing = artboardList.find((a) => a.name === name)
        if (existing) {
          existing.width = currentArtboard.width || 0
          existing.height = currentArtboard.height || 0
        } else {
          artboardList.push({
            name,
            width: currentArtboard.width || 0,
            height: currentArtboard.height || 0,
          })
        }
        setActiveArtboard(name)
      }

      setArtboards(artboardList)
      if (artboardList.length > 0) {
        console.log('Found artboards:', artboardList)
      }
    } catch (error) {
      console.log('Artboards not available:', error)
      setArtboards([])
    }
  }, [rive])

  // Get assets from Rive file
  const getAssets = useCallback(() => {
    if (!rive) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const riveInstance = rive as any
      const assetList: AssetInfo[] = []

      // Try to get assets from the file
      if (typeof riveInstance.assetCount === 'number') {
        for (let i = 0; i < riveInstance.assetCount; i++) {
          const asset = riveInstance.assetByIndex?.(i)
          if (asset) {
            let assetType: AssetInfo['type'] = 'unknown'
            if (asset.isImage || asset.type === 'image') assetType = 'image'
            else if (asset.isFont || asset.type === 'font') assetType = 'font'
            else if (asset.isAudio || asset.type === 'audio') assetType = 'audio'

            assetList.push({
              name: asset.name || `Asset ${i}`,
              type: assetType,
              cdnUuid: asset.cdnUuid,
            })
          }
        }
      }

      setAssets(assetList)
      if (assetList.length > 0) {
        console.log('Found assets:', assetList)
      }
    } catch (error) {
      console.log('Assets not available:', error)
      setAssets([])
    }
  }, [rive])

  // Select artboard
  const selectArtboard = useCallback(
    (name: string) => {
      if (!rive) return
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const riveInstance = rive as any
        if (typeof riveInstance.load === 'function' && fileBuffer) {
          // Reload with new artboard
          riveInstance.load({
            buffer: fileBuffer,
            artboard: name,
            autoplay: true,
          })
          setActiveArtboard(name)
          toast.success(`Switched to artboard: ${name}`)
        }
      } catch (error) {
        console.error('Failed to select artboard:', error)
        toast.error(`Failed to switch artboard: ${name}`)
      }
    },
    [rive, fileBuffer]
  )

  // Update color property in ViewModel
  const updateColorProperty = useCallback(
    (name: string, r: number, g: number, b: number, a: number) => {
      if (!rive) return
      try {
        const parts = name.split('/')
        const propName = parts.pop() || name
        const viewModelName = parts.join('/') || 'default'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const riveInstance = rive as any

        let vm = null
        if (viewModelName === 'default') {
          vm = riveInstance.defaultViewModel?.()
        } else {
          vm = riveInstance.viewModelByName?.(viewModelName)
        }

        if (vm) {
          const instance = vm.defaultInstance?.() || vm.instance?.()
          if (instance && typeof instance.color === 'function') {
            const colorProp = instance.color(propName)
            if (colorProp) {
              // Set color value (RGBA format varies by Rive version)
              colorProp.value = { r, g, b, a }
              console.log('Set color:', propName, { r, g, b, a })
            }
          }
        }

        // Update state
        setViewModelProps((prev) =>
          prev.map((p) =>
            p.name === name ? { ...p, colorValue: { r, g, b, a } } : p
          )
        )
        toast.success(`Updated color: ${propName}`)
      } catch (error) {
        console.error('Failed to update color property:', error)
        toast.error(`Failed to update color: ${name}`)
      }
    },
    [rive]
  )

  // Update text run value
  const updateTextRun = useCallback(
    (name: string, value: string) => {
      if (!rive) return
      try {
        rive.setTextRunValue(name, value)
        setTextRuns((prev) =>
          prev.map((tr) => (tr.name === name ? { ...tr, value } : tr))
        )
      } catch (error) {
        console.error('Failed to update text run:', error)
        toast.error(`Failed to update text run: ${name}`)
      }
    },
    [rive]
  )

  // Update ViewModel property value
  const updateViewModelProperty = useCallback(
    (name: string, value: unknown) => {
      if (!rive) {
        console.log('No rive instance available')
        return
      }
      try {
        // Parse the property path (e.g., "View Model 1/max kcal" -> viewModelName="View Model 1", propName="max kcal")
        const parts = name.split('/')
        const propName = parts.pop() || name
        const viewModelName = parts.join('/') || 'default'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const riveInstance = rive as any

        // Try to get the ViewModel and its instance
        let vm = null
        if (viewModelName === 'default') {
          vm = riveInstance.defaultViewModel?.()
        } else {
          vm = riveInstance.viewModelByName?.(viewModelName)
        }

        if (vm) {
          // Get default instance
          const instance = vm.defaultInstance?.() || vm.instance?.()
          if (instance) {
            // Try different methods to set the value
            if (typeof instance.setNumberValue === 'function' && typeof value === 'number') {
              instance.setNumberValue(propName, value)
              console.log('Set number value:', propName, value)
            } else if (typeof instance.setStringValue === 'function' && typeof value === 'string') {
              instance.setStringValue(propName, value)
              console.log('Set string value:', propName, value)
            } else if (typeof instance.setBooleanValue === 'function' && typeof value === 'boolean') {
              instance.setBooleanValue(propName, value)
              console.log('Set boolean value:', propName, value)
            } else if (typeof instance.number === 'function' && typeof value === 'number') {
              // Alternative API: instance.number(propName).value = value
              const prop = instance.number(propName)
              if (prop) prop.value = value
              console.log('Set number via property:', propName, value)
            } else {
              console.log('No suitable setter found, trying direct assignment')
              instance[propName] = value
            }
          }
        }

        // Also try viewModelInstance from hook
        if (viewModelInstance) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const vmi = viewModelInstance as any
          if (typeof vmi.number === 'function' && typeof value === 'number') {
            const prop = vmi.number(propName)
            if (prop) {
              prop.value = value
              console.log('Set via viewModelInstance.number:', propName, value)
            }
          }
        }

        setViewModelProps((prev) =>
          prev.map((p) => (p.name === name ? { ...p, value } : p))
        )
        console.log('Updated ViewModel property:', name, value)
        toast.success(`Updated: ${propName} = ${value}`)
      } catch (error) {
        console.error('Failed to update ViewModel property:', error)
        toast.error(`Failed to update property: ${name}`)
      }
    },
    [rive, viewModelInstance]
  )

  // Helper functions
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes'
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    else return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const load = (file: File) => {
    setFilename(file.name)
    setFileSize(formatFileSize(file.size))
    setStatus({ current: PlayerState.Loading })

    const reader = new FileReader()
    reader.onload = () => {
      setFileBuffer(reader.result as ArrayBuffer)
    }
    reader.onerror = () => {
      toast.error('Failed to read file')
      setStatus({ current: PlayerState.Error, error: 'Failed to read file' })
    }
    reader.readAsArrayBuffer(file)
    sendGAEvent('event', 'upload', { filename: file.name, fileSize: file.size })
  }

  const reset = () => {
    setIsPlaying(true)
    setFilename(null)
    setFileSize(null)
    setFileBuffer(null)
    setAnimationList(null)
    setStateMachineList(null)
    setStateMachineInputs([])
    setTextRuns([])
    setRiveEvents([])
    setViewModelProps([])
    setPerformanceStats({ fps: 0, frameTime: 0, lastAdvanceTime: 0 })
    setArtboards([])
    setActiveArtboard(null)
    setAssets([])
    frameCountRef.current = 0
    lastFpsUpdateRef.current = performance.now()
    setStatus({ current: PlayerState.Idle })
  }

  const togglePlayback = () => {
    if (!rive) return
    if (isPlaying) {
      rive.pause()
    } else {
      rive.play()
    }
  }

  const setControllerState = (state: string) => {
    if (state !== 'animations' && state !== 'state-machines') return

    // Stop all current playback before switching modes
    if (rive) {
      rive.stop()
    }

    setController({
      ...controller,
      active: state === 'animations' ? 'animations' : 'state-machines',
    })

    if (state === 'animations' && animationList) {
      // Play the active animation in animations mode
      rive?.play(animationList.active)
    } else if (state === 'state-machines' && stateMachineList) {
      // Play the active state machine
      rive?.play(stateMachineList.active)
      // Delay getting inputs to ensure state machine is fully initialized
      setTimeout(() => {
        const inputs = rive?.stateMachineInputs(stateMachineList.active)
        if (inputs) setStateMachineInputs(inputs)
      }, 50)
    }
  }

  const setActiveAnimation = (animation: string) => {
    if (!rive || !animationList) return
    // Stop all animations before playing a new one
    rive.stop()
    setAnimationList({ ...animationList, active: animation })
    rive.play(animation)
  }

  const setActiveStateMachine = (stateMachine: string) => {
    if (!rive || !stateMachineList) return
    // Stop all before switching state machines
    rive.stop()
    setStateMachineList({ ...stateMachineList, active: stateMachine })
    rive.play(stateMachine)
    // Delay getting inputs to ensure state machine is fully initialized
    setTimeout(() => {
      const inputs = rive.stateMachineInputs(stateMachine)
      if (inputs) setStateMachineInputs(inputs)
    }, 50)
  }

  // Drag and drop handlers
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
    const files = e.dataTransfer.files
    if (files && files[0]) {
      load(files[0])
    }
    e.preventDefault()
    e.stopPropagation()
  }

  const shouldDisplayCanvas = () =>
    [PlayerState.Active, PlayerState.Loading].includes(status.current) && fileBuffer !== null

  // Export functions
  const exportToPNG = useCallback(() => {
    if (!previewRef.current) {
      toast.error('No canvas available')
      return
    }
    const canvas = previewRef.current.querySelector('canvas')
    if (!canvas) {
      toast.error('No canvas found')
      return
    }
    try {
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = filename ? `${filename.replace('.riv', '')}.png` : 'rive-export.png'
      link.href = dataUrl
      link.click()
      toast.success('PNG exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export PNG')
    }
  }, [filename])

  const copyToClipboard = useCallback(async () => {
    if (!previewRef.current) {
      toast.error('No canvas available')
      return
    }
    const canvas = previewRef.current.querySelector('canvas')
    if (!canvas) {
      toast.error('No canvas found')
      return
    }
    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png')
      })
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        toast.success('Copied to clipboard')
      }
    } catch (error) {
      console.error('Copy failed:', error)
      toast.error('Failed to copy to clipboard')
    }
  }, [])

  return (
    <>
      <main className='flex-1 font-[family-name:var(--font-geist-sans)]'>
        <Toaster richColors visibleToasts={10} />
        <div id='container' className='px-4 sm:px-8 max-w-350 mx-auto overflow-x-hidden'>
          {/* Header */}
          <div className='relative flex w-full flex-col items-start'>
            <section className='mx-auto flex flex-col items-start gap-2 px-4 py-8 md:py-12 md:pb-8 lg:py-12 lg::pb-10 w-full'>
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
                  href='https://github.com/ysya/rive-rip'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <Button size='xs'>GitHub</Button>
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
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <CardTitle>Preview</CardTitle>
                      {filename && status.current === PlayerState.Active && (
                        <span className={`text-xs font-mono ${
                          performanceStats.fps >= 50 ? 'text-green-500' :
                          performanceStats.fps >= 30 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {performanceStats.fps} FPS
                        </span>
                      )}
                    </div>
                    <TooltipProvider>
                      <div className='flex gap-1'>
                        <Popover>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <PopoverTrigger asChild>
                                <Button size='sm' variant='outline'>
                                  <Settings className='w-4 h-4' />
                                </Button>
                              </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Runtime Settings</p>
                            </TooltipContent>
                          </Tooltip>
                          <PopoverContent className='w-64' align='end'>
                            <div className='flex flex-col gap-3'>
                              <div className='flex items-center justify-between'>
                                <Label htmlFor='touch-scroll' className='text-sm'>Touch Scroll</Label>
                                <Switch
                                  id='touch-scroll'
                                  checked={isTouchScrollEnabled}
                                  onCheckedChange={setIsTouchScrollEnabled}
                                />
                              </div>
                              <div className='flex items-center justify-between'>
                                <Label htmlFor='auto-events' className='text-sm'>Auto Events</Label>
                                <Switch
                                  id='auto-events'
                                  checked={autoHandleEvents}
                                  onCheckedChange={setAutoHandleEvents}
                                />
                              </div>
                              <p className='text-xs text-muted-foreground'>
                                Settings apply on next file load.
                              </p>
                            </div>
                          </PopoverContent>
                        </Popover>
                        {filename && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  onClick={exportToPNG}
                                >
                                  <Download className='w-4 h-4' />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Download PNG</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  onClick={copyToClipboard}
                                >
                                  <Camera className='w-4 h-4' />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy to Clipboard</p>
                              </TooltipContent>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </TooltipProvider>
                  </div>
                  <CardDescription>
                    {filename ? (
                      <span>
                        {filename}{' '}
                        <span className='text-muted-foreground'>({fileSize})</span>
                        <Button
                          variant='link'
                          size='sm'
                          className='ml-2 h-auto p-0'
                          onClick={reset}
                        >
                          Reset
                        </Button>
                      </span>
                    ) : (
                      'Choose a file to get started.'
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    ref={previewRef}
                    className={`relative w-full h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden ${
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
                    {shouldDisplayCanvas() && RiveComponent && (
                      <RiveComponent className='absolute inset-0 w-full h-full' />
                    )}
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
                          if (files && files[0]) load(files[0])
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
            </div>

            {/* Settings Row */}
            <div className='col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4'>
              <LayoutCard
                alignFitIndex={alignFitIndex}
                setAlignFitIndex={setAlignFitIndex}
                background={background}
                setBackground={setBackground}
              />
              <ArtboardCard
                artboards={artboards}
                activeArtboard={activeArtboard}
                onSelectArtboard={selectArtboard}
              />
              <AssetsCard assets={assets} />
            </div>

            {/* Features Row */}
            <div className='col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4'>
              <TextRunsCard
                textRuns={textRuns}
                setTextRuns={setTextRuns}
                riveAnimation={rive}
                updateTextRun={updateTextRun}
              />
              <EventsCard
                riveEvents={riveEvents}
                setRiveEvents={setRiveEvents}
              />
              <DataBindingCard
                viewModelProps={viewModelProps}
                updateViewModelProperty={updateViewModelProperty}
                updateColorProperty={updateColorProperty}
              />
            </div>

            {/* Code Snippets */}
            <div className='col-span-1 lg:col-span-2'>
              <Card className='w-full'>
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
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className='py-6 md:px-8 md:py-0 font-[family-name:var(--font-geist-sans)]'>
        <div className='container px-8 mx-5 flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row'>
          <p className='text-balance text-center text-sm leading-loose text-muted-foreground md:text-left'>
            Forked from{' '}
            <a
              href='https://github.com/albertcai101/rive-rip'
              target='_blank'
              rel='noopener noreferrer'
              className='font-medium underline underline-offset-4'
            >
              albertcai101/rive-rip
            </a>
            . Made to simplify the handoff from animators to developers.
          </p>
        </div>
      </footer>
    </>
  )
}
