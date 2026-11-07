import { useCallback, useEffect, useState } from 'react'
import { list } from '../../api'

export function useRefresh<T>(load: () => Promise<T[] | { content: T[] }>) {
  const [items, setItems] = useState<T[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setError('')
    try {
      setItems(list(await load()))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as solicitações.')
    } finally {
      setLoading(false)
    }
  }, [load])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), 15_000)
    return () => window.clearInterval(timer)
  }, [refresh])

  return { items, error, loading, refresh }
}
