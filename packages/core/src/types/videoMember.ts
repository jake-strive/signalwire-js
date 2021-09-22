import { PRODUCT_PREFIX_VIDEO } from '../utils/constants'
import { toExternalJSON } from '../utils'
import type { SwEvent } from '.'
import type {
  CamelToSnakeCase,
  SnakeToCamelCase,
  EntityUpdated,
  ToInternalVideoEvent,
  OnlyStateProperties,
  OnlyFunctionProperties,
  AssertSameType,
} from './utils'
import * as Rooms from '../rooms'

/**
 * Used to not duplicate member fields across constants and types
 * and generate `MEMBER_UPDATED_EVENTS` below.
 * `key`: `type`
 */
export const INTERNAL_MEMBER_UPDATABLE_PROPS = {
  audio_muted: true,
  video_muted: true,
  deaf: true,
  on_hold: true,
  visible: true,
  input_volume: 1,
  output_volume: 1,
  input_sensitivity: 1,
}
export type InternalVideoMemberUpdatableProps =
  typeof INTERNAL_MEMBER_UPDATABLE_PROPS

export const INTERNAL_MEMBER_UPDATED_EVENTS = Object.keys(
  INTERNAL_MEMBER_UPDATABLE_PROPS
).map((key) => {
  return `${PRODUCT_PREFIX_VIDEO}.member.updated.${
    key as keyof InternalVideoMemberUpdatableProps
  }` as const
})

type VideoMemberUpdatablePropsMain = {
  [K in keyof InternalVideoMemberUpdatableProps as SnakeToCamelCase<K>]: InternalVideoMemberUpdatableProps[K]
}

type VideoMemberUpdatableProps = AssertSameType<
  VideoMemberUpdatablePropsMain,
  {
    /** Whether the outbound audio is muted (e.g., from the microphone) */
    audioMuted: boolean
    /** Whether the outbound video is muted */
    videoMuted: boolean
    /** Whether the inbound audio is muted */
    deaf: boolean
    /** Whether the member is on hold */
    onHold: boolean
    /** Whether the member is visible */
    visible: boolean
    /** Input volume (e.g., of the microphone). Values range from -50 to 50, with a default of 0. */
    inputVolume: number
    /** Output volume (e.g., of the speaker). Values range from -50 to 50, with a default of 0. */
    outputVolume: number
    /** Input level at which the participant is identified as currently speaking.
     * The default value is 30 and the scale goes from 0 (lowest sensitivity,
     * essentially muted) to 100 (highest sensitivity). */
    inputSensitivity: number
  }
>

// @ts-expect-error
export const MEMBER_UPDATABLE_PROPS: VideoMemberUpdatableProps = toExternalJSON(
  INTERNAL_MEMBER_UPDATABLE_PROPS
)

export const MEMBER_UPDATED_EVENTS = Object.keys(MEMBER_UPDATABLE_PROPS).map(
  (key) => {
    return `member.updated.${key as keyof VideoMemberUpdatableProps}` as const
  }
)

/**
 * Public event types
 */
export type MemberJoined = 'member.joined'
export type MemberLeft = 'member.left'
export type MemberUpdated = 'member.updated'
export type MemberTalking = 'member.talking'

// Generated by the SDK

/**
 * See {@link MEMBER_UPDATED_EVENTS} for the full list of events.
 */
export type MemberUpdatedEventNames = typeof MEMBER_UPDATED_EVENTS[number]
export type MemberTalkingStarted = 'member.talking.started'
export type MemberTalkingEnded = 'member.talking.ended'
/**
 * Use `member.talking.started` instead
 * @deprecated
 */
export type MemberTalkingStart = 'member.talking.start'
/**
 * Use `member.talking.ended` instead
 * @deprecated
 */
export type MemberTalkingStop = 'member.talking.stop'

export type MemberTalkingEventNames =
  | MemberTalking
  | MemberTalkingStarted
  | MemberTalkingEnded
  | MemberTalkingStart
  | MemberTalkingStop

/**
 * List of public events
 */
export type VideoMemberEventNames =
  | MemberJoined
  | MemberLeft
  | MemberUpdated
  | MemberUpdatedEventNames
  | MemberTalkingEventNames

/**
 * List of internal events
 * @internal
 */
export type InternalVideoMemberEventNames =
  | ToInternalVideoEvent<
      MemberJoined | MemberLeft | MemberUpdated | MemberTalkingEventNames
    >
  | typeof INTERNAL_MEMBER_UPDATED_EVENTS[number]

export type VideoMemberType = 'member' | 'screen' | 'device'

/**
 * Public Contract for a VideoMember
 */
export interface VideoMemberContract extends VideoMemberUpdatableProps {
  /** Unique id of this member. */
  id: string
  /** Id of the room associated to this member. */
  roomId: string
  /** Id of the room session associated to this member. */
  roomSessionId: string
  /** Name of this member. */
  name: string
  /** Id of the parent video member, if it exists. */
  parentId?: string
  /** Type of this video member. Can be `'member'`, `'screen'`, or `'device'`. */
  type: VideoMemberType

  /**
   * Mutes the outbound audio for this member (e.g., the one coming from a
   * microphone). The other participants will not hear audio from the muted
   * participant anymore.
   *
   * @example
   * ```typescript
   * await member.audioMute()
   * ```
   */
  audioMute(): Rooms.AudioMuteMember

  /**
   * Unmutes the outbound audio for this member (e.g., the one coming from a
   * microphone) if it had been previously muted.
   *
   * @example
   * ```typescript
   * await member.audioUnmute()
   * ```
   */
  audioUnmute(): Rooms.AudioUnmuteMember

  /**
   * Mutes the outbound video for this member (e.g., the one coming from a
   * webcam). Participants will see a mute image instead of the video stream.
   *
   * @example
   * ```typescript
   * await member.videoMute()
   * ```
   */
  videoMute(): Rooms.VideoMuteMember

  /**
   * Unmutes the outbound video for this member (e.g., the one coming from a
   * webcam) if it had been previously muted. Participants will start seeing the
   * video stream again.
   *
   * @example
   * ```typescript
   * await member.videoUnmute()
   * ```
   */
  videoUnmute(): Rooms.VideoUnmuteMember

  /**
   * Mutes or unmutes the inbound audio for the member (e.g., the one that get
   * played through this member's speakers). When the inbound audio is muted,
   * the affected participant will not hear audio from the other participants
   * anymore.
   *
   * @param value whether to mute the audio
   *
   * @example
   * ```typescript
   * await member.setDeaf(true)
   * ```
   */
  setDeaf(value: boolean): Rooms.SetDeaf

  /**
   * @deprecated Use {@link setInputVolume} instead.
   * `setMicrophoneVolume` will be removed in v4.0.0
   */
  setMicrophoneVolume(params: { volume: number }): Rooms.SetInputVolumeMember

  /**
   * Sets the input volume for the member (e.g., the microphone input level).
   *
   * @param params
   * @param params.volume desired volume. Values range from -50 to 50, with a
   * default of 0.
   *
   * @example
   * ```typescript
   * await member.setInputVolume({volume: -10})
   * ```
   */
  setInputVolume(params: { volume: number }): Rooms.SetInputVolumeMember
  /**
   * @deprecated Use {@link setOutputVolume} instead.
   * `setSpeakerVolume` will be removed in v4.0.0
   */

  setSpeakerVolume(params: { volume: number }): Rooms.SetOutputVolumeMember

  /**
   * Sets the output volume for the member (e.g., the speaker output level).
   *
   * @param params
   * @param params.volume desired volume. Values range from -50 to 50, with a
   * default of 0.
   *
   * @example
   * ```typescript
   * await member.setOutputVolume({volume: -10})
   * ```
   */
  setOutputVolume(params: { volume: number }): Rooms.SetOutputVolumeMember

  /**
   * Sets the input level at which the participant is identified as currently
   * speaking.
   *
   * @param params
   * @param params.value desired sensitivity. The default value is 30 and the
   * scale goes from 0 (lowest sensitivity, essentially muted) to 100 (highest
   * sensitivity).
   *
   * @example
   * ```typescript
   * await member.setInputSensitivity({value: 80})
   * ```
   */
  setInputSensitivity(params: {
    value: number
  }): Rooms.SetInputSensitivityMember

  /**
   * Removes this member from the room.
   *
   * @example
   * ```typescript
   * await member.remove()
   * ```
   */
  remove(): Rooms.RemoveMember
}

/**
 * VideoMember properties
 */
export type VideoMemberEntity = OnlyStateProperties<VideoMemberContract>
/**
 * VideoMember methods
 */
export type VideoMemberMethods = OnlyFunctionProperties<VideoMemberContract>

/**
 * VideoMemberEntity entity plus `updated` field
 */
export type VideoMemberEntityUpdated = EntityUpdated<VideoMemberEntity>

/**
 * VideoMemberEntity entity for internal usage (converted to snake_case)
 * @internal
 */
export type InternalVideoMemberEntity = {
  [K in NonNullable<
    keyof VideoMemberEntity
  > as CamelToSnakeCase<K>]: VideoMemberEntity[K]
}

/**
 * VideoMember entity plus `updated` field
 * for internal usage (converted to snake_case)
 * @internal
 */
export type InternalVideoMemberEntityUpdated =
  EntityUpdated<InternalVideoMemberEntity>

/**
 * ==========
 * ==========
 * Server-Side Events
 * ==========
 * ==========
 */

/**
 * 'video.member.joined'
 */
export interface VideoMemberJoinedEventParams {
  room_session_id: string
  room_id: string
  member: InternalVideoMemberEntity
}

export interface VideoMemberJoinedEvent extends SwEvent {
  event_type: ToInternalVideoEvent<MemberJoined>
  params: VideoMemberJoinedEventParams
}

/**
 * 'video.member.updated'
 */
export interface VideoMemberUpdatedEventParams {
  room_session_id: string
  room_id: string
  member: InternalVideoMemberEntityUpdated
}

export interface VideoMemberUpdatedEvent extends SwEvent {
  event_type: ToInternalVideoEvent<MemberUpdated>
  params: VideoMemberUpdatedEventParams
}

/**
 * 'video.member.left'
 */
export interface VideoMemberLeftEventParams {
  room_session_id: string
  room_id: string
  member: InternalVideoMemberEntity
}

export interface VideoMemberLeftEvent extends SwEvent {
  event_type: ToInternalVideoEvent<MemberLeft>
  params: VideoMemberLeftEventParams
}

/**
 * 'video.member.talking'
 */
export interface VideoMemberTalkingEventParams {
  room_session_id: string
  room_id: string
  member: {
    id: string
    talking: boolean
  }
}

export interface VideoMemberTalkingEvent extends SwEvent {
  event_type: ToInternalVideoEvent<MemberTalking>
  params: VideoMemberTalkingEventParams
}

export type VideoMemberEvent =
  | VideoMemberJoinedEvent
  | VideoMemberLeftEvent
  | VideoMemberUpdatedEvent
  | VideoMemberTalkingEvent

export type VideoMemberEventParams =
  | VideoMemberJoinedEventParams
  | VideoMemberLeftEventParams
  | VideoMemberUpdatedEventParams
  | VideoMemberTalkingEventParams
