import { useEffect, useMemo, memo } from 'react'
import { useRemainingTime } from '@/client/hooks/useRemainingTime'

interface CountdownProps {
  startTime: number | null | undefined
  totalSeconds: number
}

const Countdown: React.FC<CountdownProps> = ({ startTime, totalSeconds }) => {
  const remainingTime = useRemainingTime(startTime, totalSeconds)

  // Format the remaining time as MM:SS
  const formattedTime = useMemo(() => {
    if (remainingTime === null) return '--:--'

    const minutes = Math.floor(remainingTime / 60)
    const seconds = remainingTime % 60

    const paddedMinutes = String(minutes).padStart(2, '0')
    const paddedSeconds = String(seconds).padStart(2, '0')

    return `${paddedMinutes}:${paddedSeconds}`
  }, [remainingTime])

  return formattedTime
}

export default memo(Countdown)
