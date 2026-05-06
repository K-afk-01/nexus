import { useState, useRef, useEffect } from 'react'
import * as faceapi from 'face-api.js'
import useAuthStore from '../../store/useAuthStore'

const MODELS_PATH     = '/models'
const MATCH_THRESHOLD = 50    // % (beta: lower bar for faster onboarding)
const MATCH_HOLD_MS   = 1000  // consecutive ms required (1 s for faster UX)
const DETECT_INTERVAL = 500   // ms between detection runs

function loadHTMLImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src     = src
  })
}

/* ── Score ring ─────────────────────────────────────────────── */
function ScoreRing({ score, status }) {
  const color =
    status === 'match'     ? '#22c55e' :
    status === 'detecting' ? '#eab308' : '#ef4444'
  return (
    <div
      className="absolute bottom-3 right-3 w-14 h-14 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
      style={{ background: `conic-gradient(${color} ${score * 3.6}deg, #383A40 0deg)` }}
    >
      <span className="w-10 h-10 rounded-full bg-[#2B2D31] flex items-center justify-center">
        {score}%
      </span>
    </div>
  )
}

/* ── Main ────────────────────────────────────────────────────── */
export default function FaceMatchStep({ onNext }) {
  const idFrontImage = useAuthStore((s) => s.idFrontImage)

  // Status flow: models-loading → camera-starting → no-face / detecting / match
  const [status,     setStatus]     = useState('models-loading')
  const [loadingMsg, setLoadingMsg] = useState('Yüz tanıma modelleri yükleniyor…')
  const [errorMsg,   setErrorMsg]   = useState(null)
  const [similarity, setSimilarity] = useState(0)
  const [countdown,  setCountdown]  = useState(null)
  const [idFaceOk,   setIdFaceOk]   = useState(null)

  /* All mutable values that live inside the rAF loop use refs to avoid stale closures */
  const videoRef      = useRef(null)
  const streamRef     = useRef(null)
  const rafIdRef      = useRef(null)
  const matchStartRef = useRef(null)
  const idDescRef     = useRef(null)
  const stoppedRef    = useRef(false)   // single kill-switch for all async work
  const onNextRef     = useRef(onNext)
  useEffect(() => { onNextRef.current = onNext }, [onNext])

  /* ── Phase 1: load models + extract ID face ─────────────────
     Runs once on mount. On success, transitions to 'camera-starting'
     which causes the video element to enter the DOM for Phase 2.    */
  useEffect(() => {
    stoppedRef.current = false

    async function loadModelsAndId() {
      try {
        setLoadingMsg('Yüz tanıma modelleri yükleniyor…')
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_PATH),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_PATH),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_PATH),
        ])
        if (stoppedRef.current) return

        setLoadingMsg('Kimlik fotoğrafı analiz ediliyor…')
        if (idFrontImage) {
          const img = await loadHTMLImage(idFrontImage)
          if (stoppedRef.current) return
          const det = await faceapi
            .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 608, scoreThreshold: 0.25 }))
            .withFaceLandmarks()
            .withFaceDescriptor()
          if (!stoppedRef.current) {
            idDescRef.current = det?.descriptor ?? null
            setIdFaceOk(!!det)
          }
        }
        if (stoppedRef.current) return

        // Transition → renders the <video> element so Phase 2 can assign srcObject
        setStatus('camera-starting')
      } catch (err) {
        if (stoppedRef.current) return
        setErrorMsg(
          '/public/models/ klasörüne yüz tanıma modellerini indirmeniz gerekiyor.\n' +
          'face-api.js GitHub deposundaki weights/ klasöründen:\n' +
          '• tiny_face_detector_model\n• face_landmark_68_model\n• face_recognition_model',
        )
        setStatus('error')
      }
    }

    loadModelsAndId()

    return () => {
      stoppedRef.current = true
      cancelAnimationFrame(rafIdRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [idFrontImage])

  /* ── Phase 2: start camera ───────────────────────────────────
     Fires after the render that shows the <video> element.
     videoRef.current is guaranteed to be populated here.            */
  useEffect(() => {
    if (status !== 'camera-starting') return

    function getMediaDevices() {
      if (navigator.mediaDevices?.getUserMedia) return navigator.mediaDevices

      const legacyFn =
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia    ||
        navigator.msGetUserMedia

      if (legacyFn) {
        return {
          getUserMedia: (constraints) =>
            new Promise((resolve, reject) =>
              legacyFn.call(navigator, constraints, resolve, reject)
            ),
        }
      }
      return null
    }

    async function startCamera() {
      const mediaDevices = getMediaDevices()

      if (!mediaDevices) {
        setErrorMsg(
          'Kamera erişimi için HTTPS gereklidir.\n' +
          'Lütfen güvenli bağlantı (https://) kullanın.',
        )
        setStatus('error')
        return
      }

      try {
        const stream = await mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        })
        if (stoppedRef.current) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream
        const video = videoRef.current
        if (!video) return   // guard: element disappeared between render and effect

        video.srcObject = stream

        // Only start detection after the browser confirms the video is playing
        video.onloadedmetadata = () => {
          video.play()
            .then(() => {
              if (stoppedRef.current) return
              setStatus('no-face')
              startDetection()
            })
            .catch(() => {
              if (stoppedRef.current) return
              setErrorMsg('Video başlatılamadı. Sayfayı yenileyip tekrar deneyin.')
              setStatus('error')
            })
        }
      } catch (err) {
        if (stoppedRef.current) return
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMsg('Kamera izni reddedildi. Tarayıcı ayarlarından kamera iznini verin.')
        } else if (err.name === 'NotFoundError') {
          setErrorMsg('Kamera bulunamadı.')
        } else {
          setErrorMsg('Kamera hatası: ' + err.message)
        }
        setStatus('error')
      }
    }

    startCamera()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  /* ── Detection loop (requestAnimationFrame, throttled) ───────
     Called once after video.play() resolves. The rAF loop runs at
     display frequency but only fires the async detection every
     DETECT_INTERVAL ms. A 'busy' flag prevents overlapping calls. */
  function startDetection() {
    let busy = false
    let last = 0

    const loop = async () => {
      if (stoppedRef.current) return

      const now = Date.now()
      if (!busy && now - last >= DETECT_INTERVAL) {
        busy = true
        last = now
        try {
          const video = videoRef.current
          if (video && !video.paused && video.readyState >= 2) {
            const det = await faceapi
              .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
              .withFaceLandmarks()
              .withFaceDescriptor()
            if (!stoppedRef.current) handleDetection(det)
          }
        } finally {
          busy = false
        }
      }

      rafIdRef.current = requestAnimationFrame(loop)
    }

    rafIdRef.current = requestAnimationFrame(loop)
  }

  function handleDetection(det) {
    if (!det) {
      setStatus('no-face')
      setSimilarity(0)
      matchStartRef.current = null
      setCountdown(null)
      return
    }

    let score = 0
    if (idDescRef.current) {
      const dist = faceapi.euclideanDistance(idDescRef.current, det.descriptor)
      score = Math.max(0, Math.min(100, Math.round((1 - dist) * 100)))
    } else {
      score = 100  // no ID face — liveness check only
    }
    setSimilarity(score)

    if (score >= MATCH_THRESHOLD) {
      setStatus('match')
      if (!matchStartRef.current) matchStartRef.current = Date.now()
      const elapsed   = Date.now() - matchStartRef.current
      const remaining = Math.ceil((MATCH_HOLD_MS - elapsed) / 1000)
      setCountdown(remaining > 0 ? remaining : 0)

      if (elapsed >= MATCH_HOLD_MS) {
        stoppedRef.current = true
        cancelAnimationFrame(rafIdRef.current)
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        onNextRef.current()
      }
    } else {
      setStatus('detecting')
      matchStartRef.current = null
      setCountdown(null)
    }
  }

  /* ── Derived UI values ───────────────────────────────────────*/
  const borderColor =
    status === 'match'     ? 'border-green-500  shadow-green-500/20'  :
    status === 'detecting' ? 'border-yellow-500 shadow-yellow-500/20' :
    status === 'no-face'   ? 'border-red-500    shadow-red-500/20'    :
                             'border-[#383A40]'

  const statusLabel =
    status === 'match'           ? `Yüz eşleşti! ${countdown > 0 ? `${countdown}s içinde devam…` : 'İşleniyor…'}` :
    status === 'detecting'       ? 'Yüz algılandı, karşılaştırılıyor…'                                              :
    status === 'no-face'         ? 'Yüzünüzü kameraya gösterin'                                                     :
    status === 'camera-starting' ? 'Kamera başlatılıyor…'                                                           : ''

  const statusBg =
    status === 'match'     ? 'bg-green-500/15  text-green-400'  :
    status === 'detecting' ? 'bg-yellow-500/15 text-yellow-400' :
    status === 'no-face'   ? 'bg-red-500/15    text-red-400'    :
                             'bg-[#383A40] text-[#949BA4]'

  /* ── Render: error ───────────────────────────────────────────*/
  if (status === 'error') {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center space-y-3">
        <p className="text-red-400 text-sm font-medium">Hata oluştu</p>
        <p className="text-red-300/70 text-xs whitespace-pre-line">{errorMsg}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded-lg transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    )
  }

  /* ── Render: model loading spinner ───────────────────────────*/
  if (status === 'models-loading') {
    return (
      <div className="bg-[#2B2D31] rounded-xl p-10 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#949BA4]">{loadingMsg}</p>
      </div>
    )
  }

  /* ── Render: camera view (camera-starting / no-face / detecting / match) ── */
  return (
    <div className="space-y-5">
      {idFaceOk === false && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs rounded-xl px-4 py-3">
          Kimlik kartında yüz tespit edilemedi — herhangi bir yüz algılanırsa ilerlenecektir.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* ID reference crop */}
        <div className="flex flex-col gap-2">
          <p className="text-xs text-[#949BA4] text-center">Kimlik Fotoğrafı</p>
          <div className="bg-[#383A40] rounded-xl overflow-hidden aspect-square flex items-center justify-center">
            {idFrontImage ? (
              <img src={idFrontImage} alt="Kimlik" className="w-full h-full object-cover object-top" />
            ) : (
              <p className="text-xs text-[#949BA4]">Fotoğraf yok</p>
            )}
          </div>
        </div>

        {/* Live webcam */}
        <div className="flex flex-col gap-2">
          <p className="text-xs text-[#949BA4] text-center">Canlı Kamera</p>
          <div
            className={`relative bg-[#383A40] rounded-xl overflow-hidden aspect-square border-2 transition-all duration-300 shadow-lg ${borderColor}`}
          >
            {/* Inline styles ensure objectFit/transform survive any CSS purge */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width:      '100%',
                height:     '100%',
                objectFit:  'cover',
                transform:  'scaleX(-1)',  // mirror so user sees themselves naturally
                display:    'block',
              }}
            />

            {/* Spinner overlay while stream is negotiating */}
            {status === 'camera-starting' && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#2B2D31]/70">
                <div className="w-8 h-8 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {(status === 'no-face' || status === 'detecting' || status === 'match') && (
              <ScoreRing score={similarity} status={status} />
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className={`rounded-xl px-4 py-3 text-sm text-center font-medium transition-all duration-300 ${statusBg}`}>
        {statusLabel || 'Hazırlanıyor…'}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-[#949BA4]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />Yüz yok
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />Algılanıyor
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />Eşleşti
        </span>
      </div>
    </div>
  )
}
