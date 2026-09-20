import { useEffect, useEffectEvent, useRef, useState } from "react"

import {
  buildCoachFileKey,
  createParticipantChatSocket,
  discardInvalidatedParticipantChatSession,
  getParticipantChatRevision,
  isParticipantChatStorageVolatile,
  loadParticipantChatSession,
  parseParticipantChatResponse,
  saveParticipantChatSession,
  type ParticipantChatIdentity,
  type ParticipantChatMessage,
  type ParticipantChatRequest,
  type ParticipantChatSession,
} from "@/services/participant-chat"
import type {
  ParticipantIdea,
  ParticipantWorkshopCoach,
} from "@/services/participants"

export type ParticipantChatConnectionStatus =
  "connecting" | "connected" | "reconnecting" | "error"

export const PARTICIPANT_CHAT_MESSAGE_MAX_LENGTH = 4000

type PendingRequest = {
  coachKey: string
  revision: number
  previousSessionId: string | null
  messages: ParticipantChatMessage[]
}

const EMPTY_SESSION: ParticipantChatSession = {
  sessionId: null,
  messages: [],
  status: "active",
  statusMessage: null,
}

const STORAGE_WARNING =
  "Chat history is available for this page only because browser storage is unavailable."
const STALE_SESSION_MESSAGE =
  "This idea changed while the coach was responding. Start a new conversation with the updated idea."

function getInitialSession(coach: ParticipantWorkshopCoach) {
  return {
    ...EMPTY_SESSION,
    messages: [
      {
        id: `coach-introduction-${coach.CoachKey}`,
        author: "coach" as const,
        text: `Hi, I'm ${coach.CoachName}. What would you like to explore first?`,
        status: "sent" as const,
        createdAt: Date.now(),
      },
    ],
  }
}

function updateMessageStatus(
  messages: ParticipantChatMessage[],
  status: "sent" | "failed"
) {
  return messages.map((message) =>
    message.status === "pending" ? { ...message, status } : message
  )
}

export function useParticipantChat({
  open,
  visitorId,
  workshopCode,
  idea,
  coach,
}: {
  open: boolean
  visitorId: string
  workshopCode: string
  idea: ParticipantIdea
  coach: ParticipantWorkshopCoach | null
}) {
  const identity: ParticipantChatIdentity = {
    visitorId,
    workshopCode,
    ideaId: idea.ID,
  }
  const coachKey = coach?.CoachKey ?? null
  const socketRef = useRef<WebSocket | null>(null)
  const pendingRequestRef = useRef<PendingRequest | null>(null)
  const [connectionAttempt, setConnectionAttempt] = useState(0)
  const [connectionStatus, setConnectionStatus] =
    useState<ParticipantChatConnectionStatus>("connecting")
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [isWaiting, setIsWaiting] = useState(false)
  const [activeCoachKey, setActiveCoachKey] = useState(coachKey)
  const [session, setSession] = useState<ParticipantChatSession>(() =>
    coach
      ? (loadParticipantChatSession(identity, coach.CoachKey) ??
        getInitialSession(coach))
      : EMPTY_SESSION
  )
  const [persistenceError, setPersistenceError] = useState<string | null>(() =>
    isParticipantChatStorageVolatile(identity) ? STORAGE_WARNING : null
  )

  if (activeCoachKey !== coachKey) {
    setActiveCoachKey(coachKey)
    setIsWaiting(false)
    setRequestError(null)
    const nextSession = coach
      ? (loadParticipantChatSession(identity, coach.CoachKey) ??
        getInitialSession(coach))
      : EMPTY_SESSION

    setSession(nextSession)
    setPersistenceError(
      isParticipantChatStorageVolatile(identity) ? STORAGE_WARNING : null
    )
  }

  const persistSession = (
    sessionCoachKey: string,
    nextSession: ParticipantChatSession,
    expectedRevision: number
  ) => {
    const result = saveParticipantChatSession(
      identity,
      sessionCoachKey,
      nextSession,
      expectedRevision
    )

    setPersistenceError(result.persisted ? null : STORAGE_WARNING)

    return result.saved
  }

  const finishPendingRequest = useEffectEvent(
    ({ text, sessionId }: { text: string; sessionId: string }) => {
      const pending = pendingRequestRef.current

      if (!pending) return

      const nextSession: ParticipantChatSession = {
        sessionId,
        messages: [
          ...updateMessageStatus(pending.messages, "sent"),
          {
            id: crypto.randomUUID(),
            author: "coach",
            text,
            status: "sent",
            createdAt: Date.now(),
          },
        ],
        status: "active",
        statusMessage: null,
      }

      const isSaved = persistSession(
        pending.coachKey,
        nextSession,
        pending.revision
      )

      pendingRequestRef.current = null
      setIsWaiting(false)

      if (!isSaved) {
        const staleSession: ParticipantChatSession = {
          sessionId: null,
          messages: updateMessageStatus(pending.messages, "sent"),
          status: "invalid",
          statusMessage: STALE_SESSION_MESSAGE,
        }

        setRequestError(null)
        setSession(staleSession)
        void discardInvalidatedParticipantChatSession(identity, sessionId).then(
          ({ storageFailed }) => {
            if (storageFailed) setPersistenceError(STORAGE_WARNING)
          }
        )
        return
      }

      setRequestError(null)
      setSession(nextSession)
    }
  )

  const recordPendingFailure = ({
    message,
    terminalStatus,
    requestWasReceived,
  }: {
    message: string
    terminalStatus?: "ended" | "invalid"
    requestWasReceived: boolean
  }) => {
    const pending = pendingRequestRef.current

    if (!pending) {
      setRequestError(message)
      return
    }

    const nextSession: ParticipantChatSession = {
      sessionId: pending.previousSessionId,
      messages: updateMessageStatus(
        pending.messages,
        requestWasReceived ? "sent" : "failed"
      ),
      status: terminalStatus ?? "active",
      statusMessage: terminalStatus ? message : null,
    }

    pendingRequestRef.current = null
    setIsWaiting(false)
    const isSaved = persistSession(
      pending.coachKey,
      nextSession,
      pending.revision
    )

    if (!isSaved) {
      setRequestError(null)
      setSession({
        sessionId: null,
        messages: updateMessageStatus(pending.messages, "sent"),
        status: "invalid",
        statusMessage: STALE_SESSION_MESSAGE,
      })
      return
    }

    setRequestError(terminalStatus ? null : message)
    setSession(nextSession)
  }

  const failPendingRequest = useEffectEvent(recordPendingFailure)

  const handleSocketMessage = useEffectEvent((event: MessageEvent<string>) => {
    try {
      const response = parseParticipantChatResponse(event.data)

      if (response.success) {
        finishPendingRequest({
          sessionId: response.result.session_id,
          text: response.result.text,
        })
        return
      }

      if (response.error_code === "SESSION_ENDED") {
        failPendingRequest({
          message: response.msg,
          terminalStatus: "ended",
          requestWasReceived: true,
        })
        return
      }

      if (response.error_code === "INVALID_PAYLOAD") {
        failPendingRequest({
          message: response.msg,
          terminalStatus: "invalid",
          requestWasReceived: true,
        })
        return
      }

      failPendingRequest({
        message: response.msg,
        requestWasReceived: true,
      })
    } catch (error) {
      failPendingRequest({
        message:
          error instanceof Error
            ? error.message
            : "The coach returned an invalid response.",
        requestWasReceived: true,
      })
    }
  })

  const handleSocketDisconnect = useEffectEvent(() => {
    if (!pendingRequestRef.current) return

    failPendingRequest({
      message:
        "The connection closed before the coach responded. Your message was not retried.",
      requestWasReceived: false,
    })
  })

  useEffect(() => {
    if (!open || !coachKey) return

    let reconnectTimer: number | undefined
    let reconnectCount = 0
    let isDisposed = false

    const connect = () => {
      if (isDisposed) return

      setConnectionStatus(reconnectCount ? "reconnecting" : "connecting")
      setConnectionError(null)

      let socket: WebSocket

      try {
        socket = createParticipantChatSocket()
      } catch (error) {
        setConnectionStatus("error")
        setConnectionError(
          error instanceof Error
            ? error.message
            : "Unable to configure the coach connection."
        )
        return
      }

      socketRef.current = socket

      socket.addEventListener("open", () => {
        if (isDisposed) return

        reconnectCount = 0
        setConnectionStatus("connected")
        setConnectionError(null)
      })

      socket.addEventListener("message", handleSocketMessage)

      socket.addEventListener("close", () => {
        if (socketRef.current === socket) {
          socketRef.current = null
        }

        if (isDisposed) return

        handleSocketDisconnect()
        reconnectCount += 1
        setConnectionStatus("reconnecting")
        setConnectionError("Reconnecting to your coach...")

        reconnectTimer = window.setTimeout(
          connect,
          Math.min(1000 * 2 ** (reconnectCount - 1), 5000)
        )
      })
    }

    connect()

    return () => {
      isDisposed = true

      if (reconnectTimer !== undefined) {
        window.clearTimeout(reconnectTimer)
      }

      const socket = socketRef.current
      socketRef.current = null
      socket?.close()
    }
  }, [coachKey, connectionAttempt, open])

  const sendMessage = (value: string, replacingMessageId?: string) => {
    const text = value.trim()
    const socket = socketRef.current

    if (
      !text ||
      !coach ||
      isWaiting ||
      session.status !== "active" ||
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {
      return false
    }

    if (text.length > PARTICIPANT_CHAT_MESSAGE_MAX_LENGTH) {
      setRequestError(
        `Messages can be up to ${PARTICIPANT_CHAT_MESSAGE_MAX_LENGTH.toLocaleString()} characters.`
      )
      return false
    }

    let request: ParticipantChatRequest

    try {
      request = session.sessionId
        ? {
            session_id: session.sessionId,
            workshop_code: workshopCode,
            message: text,
          }
        : {
            session_id: null,
            ref_id: workshopCode,
            workshop_code: workshopCode,
            coach_personality: coach.CoachKey,
            coach_file_key: buildCoachFileKey({
              workshopCode,
              coachKey: coach.CoachKey,
              categoryId: idea.CategoryID,
            }),
            pillar_title: idea.CategoryName,
            user_idea: idea.Desc,
            message: text,
          }
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "Unable to prepare the coach request."
      )
      return false
    }

    const messages: ParticipantChatMessage[] = [
      ...session.messages.filter(
        (message) => message.id !== replacingMessageId
      ),
      {
        id: crypto.randomUUID(),
        author: "participant",
        text,
        status: "pending",
        createdAt: Date.now(),
      },
    ]

    pendingRequestRef.current = {
      coachKey: coach.CoachKey,
      revision: getParticipantChatRevision(identity),
      previousSessionId: session.sessionId,
      messages,
    }
    setSession((current) => ({ ...current, messages }))
    setIsWaiting(true)
    setRequestError(null)

    try {
      socket.send(JSON.stringify(request))
      return true
    } catch {
      recordPendingFailure({
        message: "Your message could not be sent. Please try again.",
        requestWasReceived: false,
      })
      return true
    }
  }

  const reconnect = () => {
    setConnectionAttempt((attempt) => attempt + 1)
  }

  const retryMessage = (messageId: string) => {
    const message = session.messages.find(
      (candidate) =>
        candidate.id === messageId &&
        candidate.author === "participant" &&
        candidate.status === "failed"
    )

    return message ? sendMessage(message.text, message.id) : false
  }

  return {
    connectionStatus,
    connectionError,
    requestError,
    persistenceError,
    isWaiting,
    session,
    sendMessage,
    retryMessage,
    reconnect,
  }
}
