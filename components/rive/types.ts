import { Rive, StateMachineInput } from '@rive-app/react-canvas'

export type TextRun = {
  name: string
  value: string
}

export type RiveEvent = {
  name: string
  type: string
  properties: Record<string, unknown>
  timestamp: number
}

export type ViewModelProperty = {
  name: string
  type: 'boolean' | 'string' | 'number' | 'color' | 'trigger' | 'enum' | 'list' | 'artboard'
  value?: unknown
  enumValues?: string[]
  colorValue?: { r: number; g: number; b: number; a: number }
}

export type ArtboardInfo = {
  name: string
  width: number
  height: number
}

export type AssetInfo = {
  name: string
  type: 'image' | 'font' | 'audio' | 'unknown'
  cdnUuid?: string
}

export type PerformanceStats = {
  fps: number
  frameTime: number
  lastAdvanceTime: number
}

export type BackgroundColor = 'transparent' | 'white' | 'black'

export type RiveAnimations = {
  animations: string[]
  active: string
}

export type RiveStateMachines = {
  stateMachines: string[]
  active: string
}

export type RiveController = {
  active: 'animations' | 'state-machines'
}

export enum PlayerState {
  Idle,
  Loading,
  Active,
  Error,
}

export enum PlayerError {
  NoAnimation,
}

export type Status = {
  current: PlayerState
  hovering?: boolean
  error?: PlayerError | string | null
}

export interface RiveContextValue {
  riveAnimation: Rive | null
  animationList: RiveAnimations | null
  stateMachineList: RiveStateMachines | null
  stateMachineInputs: StateMachineInput[]
  textRuns: TextRun[]
  riveEvents: RiveEvent[]
  viewModelProps: ViewModelProperty[]
  performanceStats: PerformanceStats
  isPlaying: boolean
  status: Status
  controller: RiveController
  background: BackgroundColor
  isTouchScrollEnabled: boolean
  autoHandleEvents: boolean
  // Actions
  setActiveAnimation: (animation: string) => void
  setActiveStateMachine: (stateMachine: string) => void
  setControllerState: (state: string) => void
  togglePlayback: () => void
  updateTextRun: (name: string, value: string) => void
  setTextRuns: React.Dispatch<React.SetStateAction<TextRun[]>>
  setRiveEvents: React.Dispatch<React.SetStateAction<RiveEvent[]>>
  setBackground: React.Dispatch<React.SetStateAction<BackgroundColor>>
  setIsTouchScrollEnabled: React.Dispatch<React.SetStateAction<boolean>>
  setAutoHandleEvents: React.Dispatch<React.SetStateAction<boolean>>
}
