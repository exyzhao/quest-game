import { useEffect, useState } from 'react'

export function useRemainingTime(
  startTime: number | null | undefined,
  totalSeconds: number,
) {
  const [remainingTime, setRemainingTime] = useState<number | null>(null)

  useEffect(() => {
    if (!startTime) return

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const timeLeft = totalSeconds - elapsed
      setRemainingTime(timeLeft > 0 ? timeLeft : 0)

      if (timeLeft <= 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, totalSeconds])

  return remainingTime
}
