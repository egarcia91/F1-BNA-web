import { useCallback, useEffect, useState } from 'react'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../lib/firebase'

export interface MediaItem {
  id: string
  tipo: 'foto' | 'video'
  url: string
  storagePath?: string
  autor?: string
  creadoEn?: unknown
}

export function useGaleria(torneoId: string | null, carreraId: string | null) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (!db || !torneoId || !carreraId) { setItems([]); return }
    const colRef = collection(db, 'torneos', torneoId, 'carreras', carreraId, 'galeria')
    const q = query(colRef, orderBy('creadoEn', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as MediaItem))
      )
    })
    return unsub
  }, [torneoId, carreraId])

  const subirFoto = useCallback(
    async (file: File, autorEmail?: string) => {
      if (!db || !storage || !torneoId || !carreraId) return
      setCargando(true)
      try {
        const ts = Date.now()
        const path = `galeria/${torneoId}/${carreraId}/${ts}_${file.name}`
        const storageRef = ref(storage, path)
        await uploadBytes(storageRef, file)
        const url = await getDownloadURL(storageRef)
        const colRef = collection(db, 'torneos', torneoId, 'carreras', carreraId, 'galeria')
        await addDoc(colRef, {
          tipo: 'foto',
          url,
          storagePath: path,
          autor: autorEmail ?? null,
          creadoEn: serverTimestamp(),
        })
      } finally {
        setCargando(false)
      }
    },
    [torneoId, carreraId]
  )

  const agregarVideo = useCallback(
    async (url: string, autorEmail?: string) => {
      if (!db || !torneoId || !carreraId) return
      const colRef = collection(db, 'torneos', torneoId, 'carreras', carreraId, 'galeria')
      await addDoc(colRef, {
        tipo: 'video',
        url,
        autor: autorEmail ?? null,
        creadoEn: serverTimestamp(),
      })
    },
    [torneoId, carreraId]
  )

  const eliminar = useCallback(
    async (item: MediaItem) => {
      if (!db || !torneoId || !carreraId) return
      if (item.storagePath && storage) {
        try { await deleteObject(ref(storage, item.storagePath)) } catch { /* ya borrado */ }
      }
      await deleteDoc(doc(db, 'torneos', torneoId, 'carreras', carreraId, 'galeria', item.id))
    },
    [torneoId, carreraId]
  )

  return { items, cargando, subirFoto, agregarVideo, eliminar }
}
