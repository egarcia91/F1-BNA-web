import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useGaleria, type MediaItem } from '../hooks/useGaleria'
import styles from './GaleriaCarrera.module.css'

interface GaleriaCarreraProps {
  torneoId: string
  carreraId: string
}

function extraerYoutubeId(url: string): string | null {
  const m =
    url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/) ??
    url.match(/^([a-zA-Z0-9_-]{11})$/)
  return m?.[1] ?? null
}

function extraerYoutubePlaylistId(url: string): string | null {
  const m = url.match(/[?&]list=([a-zA-Z0-9_-]+)/)
  return m?.[1] ?? null
}

function VideoEmbed({ url }: { url: string }) {
  const playlistId = extraerYoutubePlaylistId(url)
  if (playlistId) {
    return (
      <iframe
        className={styles.videoIframe}
        src={`https://www.youtube.com/embed/videoseries?list=${playlistId}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Playlist de YouTube"
      />
    )
  }
  const ytId = extraerYoutubeId(url)
  if (ytId) {
    return (
      <iframe
        className={styles.videoIframe}
        src={`https://www.youtube.com/embed/${ytId}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video"
      />
    )
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.videoLink}>
      Ver video ↗
    </a>
  )
}

export function GaleriaCarrera({ torneoId, carreraId }: GaleriaCarreraProps) {
  const { user } = useAuth()
  const { items, cargando, subirFoto, agregarVideo, eliminar } = useGaleria(torneoId, carreraId)
  const [videoUrl, setVideoUrl] = useState('')
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fotos = items.filter((i) => i.tipo === 'foto')
  const videos = items.filter((i) => i.tipo === 'video')

  const handleSubirFotos = async (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      await subirFoto(file, user?.email ?? undefined)
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleAgregarVideo = async () => {
    const url = videoUrl.trim()
    if (!url) return
    await agregarVideo(url, user?.email ?? undefined)
    setVideoUrl('')
  }

  const handleEliminar = (item: MediaItem) => {
    if (confirm('¿Eliminar este elemento?')) eliminar(item)
  }

  return (
    <div className={styles.galeria}>
      <h3 className={styles.titulo}>Galería</h3>

      {user && (
        <div className={styles.controles}>
          <div className={styles.controlFoto}>
            <label className={styles.botonSubir}>
              {cargando ? 'Subiendo…' : 'Subir fotos'}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className={styles.inputOculto}
                onChange={(e) => handleSubirFotos(e.target.files)}
                disabled={cargando}
              />
            </label>
          </div>
          <div className={styles.controlVideo}>
            <input
              type="text"
              className={styles.inputVideo}
              placeholder="Link de YouTube o video"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAgregarVideo() }}
            />
            <button
              type="button"
              className={styles.botonAgregar}
              onClick={handleAgregarVideo}
              disabled={!videoUrl.trim()}
            >
              Agregar
            </button>
          </div>
        </div>
      )}

      {fotos.length > 0 && (
        <div className={styles.seccion}>
          <h4 className={styles.seccionTitulo}>Fotos</h4>
          <div className={styles.gridFotos}>
            {fotos.map((item) => (
              <div key={item.id} className={styles.fotoWrapper}>
                <img
                  src={item.url}
                  alt=""
                  className={styles.fotoThumb}
                  onClick={() => setFotoAmpliada(item.url)}
                  loading="lazy"
                />
                {user && (
                  <button
                    type="button"
                    className={styles.botonEliminar}
                    onClick={() => handleEliminar(item)}
                    title="Eliminar"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div className={styles.seccion}>
          <h4 className={styles.seccionTitulo}>Videos</h4>
          <div className={styles.gridVideos}>
            {videos.map((item) => (
              <div key={item.id} className={styles.videoWrapper}>
                <VideoEmbed url={item.url} />
                {user && (
                  <button
                    type="button"
                    className={styles.botonEliminar}
                    onClick={() => handleEliminar(item)}
                    title="Eliminar"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <p className={styles.vacio}>
          {user ? 'Aún no hay fotos ni videos. ¡Subí el primero!' : 'Aún no hay fotos ni videos.'}
        </p>
      )}

      {fotoAmpliada && (
        <div className={styles.lightbox} onClick={() => setFotoAmpliada(null)}>
          <img src={fotoAmpliada} alt="" className={styles.lightboxImg} />
          <button type="button" className={styles.lightboxCerrar} onClick={() => setFotoAmpliada(null)}>✕</button>
        </div>
      )}
    </div>
  )
}
