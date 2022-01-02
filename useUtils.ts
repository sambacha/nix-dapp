
   
import { useCallback, useEffect, useState, useMemo, useRef } from 'react'

export function useWindowSize(): { width: number | undefined; height: number | undefined } {
  function getSize(): ReturnType<typeof useWindowSize> {
    const isClient = typeof window === 'object'
    return {
      width: isClient ? window.innerWidth : undefined,
      height: isClient ? window.innerHeight : undefined,
    }
  }

  const [windowSize, setWindowSize] = useState(getSize())
  useEffect(() => {
    const handleResize = (): void => {
      setWindowSize(getSize())
    }
    window.addEventListener('resize', handleResize)
    return (): void => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return windowSize
}

// https://usehooks.com/useDebounce/
export function useDefaultedDebounce<T>(value: T, initialValue: T, delay: number): T {
  const [defaultedDebounce, setDefaultedDebounce] = useState(initialValue)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDefaultedDebounce(value)
    }, delay)

    return (): void => {
      clearTimeout(handler)
      setDefaultedDebounce(initialValue)
    }
  }, [value, initialValue, delay])

  return defaultedDebounce
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useBodyKeyDown(targetKey: string, onKeyDown: (event?: any) => void, suppress = false): void {
  const downHandler = useCallback(
    (event) => {
      if (
        !suppress &&
        event.key === targetKey &&
        event.target.tagName === 'BODY' &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey
      ) {
        onKeyDown(event)
      }
    },
    [suppress, targetKey, onKeyDown]
  )
  useEffect(() => {
    window.addEventListener('keydown', downHandler)
    return (): void => {
      window.removeEventListener('keydown', downHandler)
    }
  }, [suppress, targetKey, downHandler])
}