import { socket } from "@/lib/socket"
import { useEffect, useRef, useState } from "react"

export type TimerStatus = "idle" | "running" | "paused"

export type TimerState = {
  status: TimerStatus
  durationSeconds: number
  remainingSeconds: number
}

type TimerStatePayload = {
  roomId: string
  status: TimerStatus
  durationSeconds: number
  remainingMs: number
}

const INITIAL_TIMER: TimerState = {
  status: "idle",
  durationSeconds: 0,
  remainingSeconds: 0,
}

const getRemainingSeconds = (endsAt: number) =>
  Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))

export function useWorkshopTimer(roomId: string) {
  const [timer, setTimer] = useState<TimerState>(INITIAL_TIMER)
  const endsAtRef = useRef<number | null>(null)

  useEffect(() => {
    const syncTimer = (data: TimerStatePayload) => {
      if (data.roomId !== roomId) return

      const remainingMs = Math.max(0, data.remainingMs)

      endsAtRef.current =
        data.status === "running" ? Date.now() + remainingMs : null

      setTimer({
        status: data.status,
        durationSeconds: data.durationSeconds,
        remainingSeconds: Math.ceil(remainingMs / 1000),
      })
    }

    const syncRoom = () => {
      socket.emit("join_room", { roomId })
      socket.emit("get_timer_state", { roomId })
    }

    socket.on("connect", syncRoom)
    socket.on("timer_state", syncTimer)

    if (socket.connected) {
      syncRoom()
    }

    return () => {
      socket.off("connect", syncRoom)
      socket.off("timer_state", syncTimer)
    }
  }, [roomId])

  useEffect(() => {
    if (timer.status !== "running") return

    const tick = () => {
      if (endsAtRef.current === null) return

      const remainingSeconds = getRemainingSeconds(endsAtRef.current)

      setTimer((current) => ({
        ...current,
        status: remainingSeconds === 0 ? "idle" : current.status,
        remainingSeconds,
      }))
    }

    tick()

    const interval = window.setInterval(tick, 250)

    return () => window.clearInterval(interval)
  }, [timer.status])

  const setDuration = (durationSeconds: number) => {
    if (timer.status === "running") return

    setTimer((current) => ({
      ...current,
      durationSeconds,
      remainingSeconds: durationSeconds,
    }))

    socket.emit("set_timer_duration", {
      roomId,
      duration: durationSeconds,
    })
  }

  const start = () => {
    if (timer.remainingSeconds <= 0) return

    socket.emit("start_timer", {
      roomId,
      duration: timer.durationSeconds,
    })
  }

  const pause = () => {
    socket.emit("pause_timer", { roomId })
  }

  const resume = () => {
    socket.emit("resume_timer", { roomId })
  }

  const reset = () => {
    socket.emit("reset_timer", { roomId })
  }

  return {
    timer,
    setDuration,
    start,
    pause,
    resume,
    reset,
  }
}
