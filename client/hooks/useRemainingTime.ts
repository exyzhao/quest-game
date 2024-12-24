import { useEffect, useState } from 'react'

export function useRemainingTime(
  startTime: number | null | undefined,
  totalSeconds: number,
) {
  const [remainingTime, setRemainingTime] = useState<number | null>(null)

  useEffect(() => {
    if (!startTime) return

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const timeLeft = Math.max(0, totalSeconds - elapsed)
      setRemainingTime(timeLeft)
    }

    tick() // run on mount
    const intervalId = setInterval(tick, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [startTime, totalSeconds])

  return remainingTime
}
