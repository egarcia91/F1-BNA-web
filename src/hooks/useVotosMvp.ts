import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useVotosMvp(
  torneoId: string | null,
  carreraId: string | null,
  userEmail: string | undefined
): {
  counts: Map<string, number>
  mvpPilotoId: string | null
  myVote: string | null
  loading: boolean
  refetch: () => void
} {
  const [snapshot, setSnapshot] = useState<{ email: string; votedFor: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  useEffect(() => {
    if (!db || !torneoId || !carreraId) {
      setSnapshot([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    getDocs(collection(db, 'torneos', torneoId, 'carreras', carreraId, 'votos'))
      .then((snap) => {
        if (cancelled) return
        const list: { email: string; votedFor: string }[] = []
        snap.forEach((doc) => {
          const d = doc.data()
          if (typeof d.votedFor === 'string') {
            list.push({ email: doc.id, votedFor: d.votedFor })
          }
        })
        setSnapshot(list)
      })
      .catch(() => {
        if (!cancelled) setSnapshot([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [torneoId, carreraId, refetchTrigger])

  const counts = new Map<string, number>()
  snapshot.forEach(({ votedFor }) => {
    counts.set(votedFor, (counts.get(votedFor) ?? 0) + 1)
  })

  let mvpPilotoId: string | null = null
  let maxCount = 0
  counts.forEach((count, pilotId) => {
    if (count > maxCount) {
      maxCount = count
      mvpPilotoId = pilotId
    }
  })

  const myVote = userEmail ? snapshot.find((v) => v.email === userEmail)?.votedFor ?? null : null

  return {
    counts,
    mvpPilotoId,
    myVote,
    loading,
    refetch: () => setRefetchTrigger((t) => t + 1),
  }
}
