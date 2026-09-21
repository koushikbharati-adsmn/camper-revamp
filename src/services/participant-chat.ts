import axios from "axios"

export type ParticipantChatMessage = {
  id: string
  author: "coach" | "participant" | "system"
  text: string
  status?: "pending" | "sent" | "failed"
  createdAt?: number
}

export type ParticipantChatSessionStatus = "active" | "ended" | "invalid"

export type ParticipantChatSession = {
  sessionId: string | null
  messages: ParticipantChatMessage[]
  status: ParticipantChatSessionStatus
  statusMessage: string | null
}

export type ParticipantChatIdentity = {
  visitorId: string
  workshopCode: string
  ideaId: number
}

export type NewParticipantChatRequest = {
  session_id: null
  ref_id: string
  workshop_code: string
  coach_personality: string
  coach_file_key: string
  pillar_title: string
  user_idea: string
  message: string
}

export type ContinueParticipantChatRequest = {
  session_id: string
  workshop_code: string
  message: string
}

export type ParticipantChatRequest =
  NewParticipantChatRequest | ContinueParticipantChatRequest

export type ParticipantChatSuccessResponse = {
  success: true
  msg: string
  result: {
    session_id: string
    ref_id?: string
    workshop_code?: string
    coach_personality?: string
    coach_file_key?: string
    text: string
  }
}

export type ParticipantChatErrorResponse = {
  success: false
  msg: string
  error_code?: string
  result: null
}

export type ParticipantChatResponse =
  ParticipantChatSuccessResponse | ParticipantChatErrorResponse

type StoredIdeaChats = {
  version: 1
  revision: number
  sessions: Record<string, ParticipantChatSession>
  pendingDeletionSessionIds: string[]
}

const CHAT_STORAGE_PREFIX = "participant-sharpen-chats:v1"
const memoryIdeaChats = new Map<string, StoredIdeaChats>()
const volatileStorageKeys = new Set<string>()

function getStorageKey(identity: ParticipantChatIdentity) {
  return [
    CHAT_STORAGE_PREFIX,
    encodeURIComponent(identity.visitorId),
    encodeURIComponent(identity.workshopCode),
    identity.ideaId,
  ].join(":")
}

function getEmptyIdeaChats(): StoredIdeaChats {
  return {
    version: 1,
    revision: 0,
    sessions: {},
    pendingDeletionSessionIds: [],
  }
}

function isParticipantChatMessage(
  value: unknown
): value is ParticipantChatMessage {
  if (!value || typeof value !== "object") return false

  const message = value as Partial<ParticipantChatMessage>

  return (
    typeof message.id === "string" &&
    typeof message.text === "string" &&
    (message.author === "coach" ||
      message.author === "participant" ||
      message.author === "system") &&
    (message.status === undefined ||
      message.status === "pending" ||
      message.status === "sent" ||
      message.status === "failed") &&
    (message.createdAt === undefined || typeof message.createdAt === "number")
  )
}

function isParticipantChatSession(
  value: unknown
): value is ParticipantChatSession {
  if (!value || typeof value !== "object") return false

  const session = value as Partial<ParticipantChatSession>

  return (
    (session.sessionId === null || isSafePathSegment(session.sessionId)) &&
    Array.isArray(session.messages) &&
    session.messages.every(isParticipantChatMessage) &&
    (session.status === "active" ||
      session.status === "ended" ||
      session.status === "invalid") &&
    (session.statusMessage === null ||
      typeof session.statusMessage === "string")
  )
}

function readIdeaChats(identity: ParticipantChatIdentity): StoredIdeaChats {
  const storageKey = getStorageKey(identity)
  const fallback = memoryIdeaChats.get(storageKey) ?? getEmptyIdeaChats()

  if (typeof window === "undefined") return fallback
  if (volatileStorageKeys.has(storageKey)) return fallback

  try {
    const value = sessionStorage.getItem(storageKey)

    if (!value) return fallback

    const parsed = JSON.parse(value) as Partial<StoredIdeaChats>

    if (
      parsed.version !== 1 ||
      !parsed.sessions ||
      typeof parsed.sessions !== "object" ||
      !Array.isArray(parsed.pendingDeletionSessionIds)
    ) {
      return fallback
    }

    const sessions = Object.fromEntries(
      Object.entries(parsed.sessions).filter((entry) =>
        isParticipantChatSession(entry[1])
      )
    )

    const result: StoredIdeaChats = {
      version: 1,
      revision:
        typeof parsed.revision === "number" &&
        Number.isInteger(parsed.revision) &&
        parsed.revision >= 0
          ? parsed.revision
          : 0,
      sessions,
      pendingDeletionSessionIds:
        parsed.pendingDeletionSessionIds.filter(isSafePathSegment),
    }

    memoryIdeaChats.set(storageKey, result)

    return result
  } catch {
    volatileStorageKeys.add(storageKey)
    return fallback
  }
}

function writeIdeaChats(
  identity: ParticipantChatIdentity,
  value: StoredIdeaChats
) {
  const storageKey = getStorageKey(identity)

  memoryIdeaChats.set(storageKey, value)

  if (typeof window === "undefined") return false

  try {
    if (
      Object.keys(value.sessions).length === 0 &&
      value.pendingDeletionSessionIds.length === 0 &&
      value.revision === 0
    ) {
      sessionStorage.removeItem(storageKey)
      memoryIdeaChats.delete(storageKey)
      volatileStorageKeys.delete(storageKey)
      return true
    }

    sessionStorage.setItem(storageKey, JSON.stringify(value))
    volatileStorageKeys.delete(storageKey)
    return true
  } catch {
    // Chat still works for the current page when browser storage is unavailable.
    volatileStorageKeys.add(storageKey)
    return false
  }
}

export function loadParticipantChatSession(
  identity: ParticipantChatIdentity,
  coachKey: string
) {
  return readIdeaChats(identity).sessions[coachKey] ?? null
}

export function hasParticipantChatSession(identity: ParticipantChatIdentity) {
  return Object.values(readIdeaChats(identity).sessions).some(
    (session) => session.sessionId !== null
  )
}

export function getParticipantChatRevision(identity: ParticipantChatIdentity) {
  return readIdeaChats(identity).revision
}

export function isParticipantChatStorageVolatile(
  identity: ParticipantChatIdentity
) {
  return volatileStorageKeys.has(getStorageKey(identity))
}

export function saveParticipantChatSession(
  identity: ParticipantChatIdentity,
  coachKey: string,
  session: ParticipantChatSession,
  expectedRevision: number
) {
  const stored = readIdeaChats(identity)

  if (stored.revision !== expectedRevision) {
    return {
      saved: false,
      persisted: !isParticipantChatStorageVolatile(identity),
    }
  }

  const persisted = writeIdeaChats(identity, {
    ...stored,
    sessions: {
      ...stored.sessions,
      [coachKey]: session,
    },
  })

  return { saved: true, persisted }
}

function getChatWebSocketUrl() {
  const url = String(import.meta.env.VITE_CHAT_WEBSOCKET_URL ?? "").trim()

  if (!/^wss?:\/\//i.test(url)) {
    throw new Error("The chat WebSocket URL is not configured.")
  }

  return url
}

function getChatApiBaseUrl() {
  const url = String(import.meta.env.VITE_CHAT_API_BASE_URL ?? "").trim()

  if (!/^https?:\/\//i.test(url)) {
    throw new Error("The chat API URL is not configured.")
  }

  return url
}

export function createParticipantChatSocket() {
  return new WebSocket(getChatWebSocketUrl())
}

function assertSafePathSegment(value: string, label: string) {
  if (!isSafePathSegment(value)) {
    throw new Error(`${label} cannot be used to create the coach prompt path.`)
  }
}

function isSafePathSegment(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]+$/.test(value)
}

export function buildCoachFileKey({
  workshopCode,
  coachKey,
  categoryId,
}: {
  workshopCode: string
  coachKey: string
  categoryId: number
}) {
  assertSafePathSegment(workshopCode, "Workshop code")
  assertSafePathSegment(coachKey, "Coach key")

  if (!Number.isInteger(categoryId) || categoryId < 0) {
    throw new Error(
      "Category ID cannot be used to create the coach prompt path."
    )
  }

  return `workshop/${workshopCode}/prompt/coach/${coachKey}/system-prompt-${categoryId}.txt`
}

export function parseParticipantChatResponse(
  value: string
): ParticipantChatResponse {
  const parsed = JSON.parse(value) as Partial<ParticipantChatResponse>

  if (parsed.success === true) {
    const result = parsed.result

    if (
      !result ||
      typeof result !== "object" ||
      typeof result.session_id !== "string" ||
      !isSafePathSegment(result.session_id) ||
      typeof result.text !== "string"
    ) {
      throw new Error("The coach returned an invalid response.")
    }

    return {
      ...parsed,
      success: true,
      msg: typeof parsed.msg === "string" ? parsed.msg : "",
      result,
    }
  }

  if (parsed.success === false) {
    return {
      success: false,
      msg:
        typeof parsed.msg === "string" && parsed.msg
          ? parsed.msg
          : "The coach could not respond.",
      error_code:
        typeof parsed.error_code === "string" ? parsed.error_code : undefined,
      result: null,
    }
  }

  throw new Error("The coach returned an invalid response.")
}

async function deleteParticipantChatSession(
  workshopCode: string,
  sessionId: string
) {
  assertSafePathSegment(workshopCode, "Workshop code")
  assertSafePathSegment(sessionId, "Session ID")

  const response = await axios.post<{
    success: boolean
    msg: string
  }>(
    "/api/chat/session/delete",
    {
      file_key: `chat_sessions/${workshopCode}/${sessionId}.txt`,
    },
    {
      baseURL: getChatApiBaseUrl(),
      headers: {
        "Content-Type": "application/json",
      },
    }
  )

  if (!response.data.success) {
    throw new Error(response.data.msg || "Unable to delete chat session.")
  }
}

async function deletePendingSessions(identity: ParticipantChatIdentity) {
  const stored = readIdeaChats(identity)
  const sessionIds = [...new Set(stored.pendingDeletionSessionIds)]

  if (sessionIds.length === 0) {
    return {
      deletedCount: 0,
      failedCount: 0,
      storageFailed: isParticipantChatStorageVolatile(identity),
    }
  }

  const results = await Promise.allSettled(
    sessionIds.map((sessionId) =>
      deleteParticipantChatSession(identity.workshopCode, sessionId)
    )
  )
  const successfulSessionIds = new Set(
    sessionIds.filter(
      (_sessionId, index) => results[index].status === "fulfilled"
    )
  )
  const latest = readIdeaChats(identity)

  const persisted = writeIdeaChats(identity, {
    ...latest,
    pendingDeletionSessionIds: latest.pendingDeletionSessionIds.filter(
      (sessionId) => !successfulSessionIds.has(sessionId)
    ),
  })

  return {
    deletedCount: successfulSessionIds.size,
    failedCount: sessionIds.length - successfulSessionIds.size,
    storageFailed: !persisted,
  }
}

export async function invalidateParticipantChatSessions(
  identity: ParticipantChatIdentity
) {
  const stored = readIdeaChats(identity)
  const activeSessionIds = Object.values(stored.sessions)
    .map((session) => session.sessionId)
    .filter((sessionId): sessionId is string => Boolean(sessionId))

  const persisted = writeIdeaChats(identity, {
    version: 1,
    revision: stored.revision + 1,
    sessions: {},
    pendingDeletionSessionIds: [
      ...new Set([...stored.pendingDeletionSessionIds, ...activeSessionIds]),
    ],
  })

  const result = await deletePendingSessions(identity)

  return {
    ...result,
    storageFailed: !persisted || result.storageFailed,
  }
}

export async function discardInvalidatedParticipantChatSession(
  identity: ParticipantChatIdentity,
  sessionId: string
) {
  assertSafePathSegment(sessionId, "Session ID")

  const stored = readIdeaChats(identity)
  const persisted = writeIdeaChats(identity, {
    ...stored,
    pendingDeletionSessionIds: [
      ...new Set([...stored.pendingDeletionSessionIds, sessionId]),
    ],
  })
  const result = await deletePendingSessions(identity)

  return {
    ...result,
    storageFailed: !persisted || result.storageFailed,
  }
}

export function retryPendingParticipantChatDeletions(
  identity: ParticipantChatIdentity
) {
  return deletePendingSessions(identity)
}
