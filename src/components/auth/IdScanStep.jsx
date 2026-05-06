import { useState, useRef } from 'react'
import { createWorker } from 'tesseract.js'
import useAuthStore from '../../store/useAuthStore'

/* ── OCR helpers ───────────────────────────────────────────── */

async function runOCR(file) {
  const worker = await createWorker(['tur', 'eng'])
  const { data: { text } } = await worker.recognize(file)
  await worker.terminate()
  return text
}

function extractFieldsFromOCR(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  // TC No: 11 consecutive digits
  const tcMatch = text.match(/\b(\d{11})\b/)
  const tcNo    = tcMatch ? tcMatch[1] : null

  // Birth date: DD.MM.YYYY or DD/MM/YYYY
  const dateMatch = text.match(/\b(\d{2}[./]\d{2}[./]\d{4})\b/)
  const birthDate = dateMatch ? dateMatch[1] : null

  const SKIP = new Set([
    'TÜRKİYE', 'CUMHURİYETİ', 'REPUBLIC', 'TURKEY',
    'KİMLİK', 'IDENTITY', 'CARD', 'NO', 'TC', 'TÜRK',
  ])

  const cleanNameStr = (str) =>
    str
      .replace(/[^A-ZÇĞİÖŞÜa-zçğışöüÇĞİÖŞÜ\s\-]/g, '')
      .trim()
      .split(/\s+/)
      .filter((w) => w.length >= 2)
      .join(' ')

  // Label-based extraction takes priority over the caps-line fallback
  let surname   = null
  let givenName = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase()

    if (/(soyad|surname)/.test(line) && lines[i + 1]) {
      surname = cleanNameStr(lines[i + 1]) || null
    }
    if (/(^adı|adı\s*\/|given name|^ad\s*$)/.test(line) && lines[i + 1]) {
      givenName = cleanNameStr(lines[i + 1]) || null
    }
  }

  const nameLines = lines
    .filter((l) => {
      const clean = cleanNameStr(l)
      return (
        /^[A-ZÇĞİÖŞÜ\s\-]+$/.test(clean) &&
        clean.length >= 4 &&
        !SKIP.has(clean) &&
        clean.split(/\s+/).every((w) => w.length >= 2)
      )
    })
    .map((l) => cleanNameStr(l))

  let fullName = null
  if (surname && givenName) fullName = givenName + ' ' + surname
  else if (surname)         fullName = surname
  else if (givenName)       fullName = givenName
  else                      fullName = nameLines.sort((a, b) => b.length - a.length)[0] ?? null

  if (fullName) {
    fullName = fullName
      .split(/\s+/)
      .filter((w) => w.length >= 2)
      .join(' ')
  }

  return { tcNo, birthDate, fullName }
}

/* ── Upload zone ───────────────────────────────────────────── */

function UploadZone({ label, hint, preview, processing, onFile }) {
  const inputRef = useRef(null)

  const pick = (e) => {
    const f = e.target.files?.[0]
    if (f) onFile(f)
  }
  const drop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f?.type.startsWith('image/')) onFile(f)
  }

  return (
    <div
      className={[
        'relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-3',
        'cursor-pointer min-h-[160px] transition-all duration-200',
        preview
          ? 'border-[#5865F2] bg-[#5865F2]/8'
          : 'border-[#949BA4]/30 hover:border-[#5865F2]/50 hover:bg-[#5865F2]/5',
        processing ? 'pointer-events-none' : '',
      ].join(' ')}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={drop}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={pick} />

      {preview ? (
        <img src={preview} alt={label} className="max-h-28 rounded-lg object-contain" />
      ) : (
        <>
          <div className="w-12 h-12 rounded-full bg-[#5865F2]/15 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#5865F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[#DCDDDE]">{label}</p>
            <p className="text-xs text-[#949BA4] mt-0.5">{hint}</p>
          </div>
        </>
      )}

      {processing && (
        <div className="absolute inset-0 bg-[#2B2D31]/85 rounded-xl flex flex-col items-center justify-center gap-2">
          <div className="w-7 h-7 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#949BA4]">OCR taranıyor…</p>
        </div>
      )}
    </div>
  )
}

/* ── Field row ─────────────────────────────────────────────── */

function Field({ label, value, ok }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-[#949BA4] w-28 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`text-sm font-medium truncate ${value ? 'text-[#DCDDDE]' : 'text-[#949BA4]/40'}`}>
          {value ?? '—'}
        </span>
        {ok && (
          <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
  )
}

/* ── Main component ────────────────────────────────────────── */

export default function IdScanStep({ onNext }) {
  const setIdData = useAuthStore((s) => s.setIdData)

  const [frontPreview, setFrontPreview]     = useState(null)
  const [backPreview,  setBackPreview]      = useState(null)
  const [procFront,    setProcFront]        = useState(false)
  const [procBack,     setProcBack]         = useState(false)
  const [extracted,    setExtracted]        = useState({ tcNo: null, fullName: null, birthDate: null })
  const [error,        setError]            = useState(null)
  const [rawOcrText,   setRawOcrText]       = useState('')

  const frontUrlRef = useRef(null)
  const backUrlRef  = useRef(null)

  async function handleFront(file) {
    if (frontUrlRef.current) URL.revokeObjectURL(frontUrlRef.current)
    const url = URL.createObjectURL(file)
    frontUrlRef.current = url
    setFrontPreview(url)
    setProcFront(true)
    setError(null)
    try {
      const raw    = await runOCR(file)
      const parsed = extractFieldsFromOCR(raw)
      setRawOcrText(raw)
      setExtracted((prev) => ({ ...prev, ...parsed }))
    } catch {
      setError('Ön yüz okunamadı. Daha net bir fotoğraf deneyin.')
    } finally {
      setProcFront(false)
    }
  }

  async function handleBack(file) {
    if (backUrlRef.current) URL.revokeObjectURL(backUrlRef.current)
    const url = URL.createObjectURL(file)
    backUrlRef.current = url
    setBackPreview(url)
    setProcBack(true)
    try {
      const raw    = await runOCR(file)
      const parsed = extractFieldsFromOCR(raw)
      setRawOcrText((prev) => prev + '\n\n--- ARKA YÜZ ---\n' + raw)
      setExtracted((prev) => ({
        tcNo:      prev.tcNo      ?? parsed.tcNo,
        fullName:  prev.fullName  ?? parsed.fullName,
        birthDate: prev.birthDate ?? parsed.birthDate,
      }))
    } catch {
      /* back side failure is non-critical */
    } finally {
      setProcBack(false)
    }
  }

  const tcValid  = /^\d{11}$/.test(extracted.tcNo ?? '')
  const canProceed =
    !!frontPreview && !!backPreview && !procFront && !procBack && tcValid

  function handleNext() {
    setIdData({
      tcNo:         extracted.tcNo,
      fullName:     extracted.fullName,
      birthDate:    extracted.birthDate,
      idFrontImage: frontUrlRef.current,
      idBackImage:  backUrlRef.current,
    })
    onNext()
  }

  const hasAnyData = extracted.tcNo || extracted.fullName || extracted.birthDate

  return (
    <div className="space-y-5">
      <p className="text-sm text-[#949BA4] text-center">
        TC kimlik kartınızın ön ve arka yüzünü yükleyin.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <UploadZone
          label="Kimlik Ön Yüzü"
          hint="Fotoğraflı taraf"
          preview={frontPreview}
          processing={procFront}
          onFile={handleFront}
        />
        <UploadZone
          label="Kimlik Arka Yüzü"
          hint="Barkodlu taraf"
          preview={backPreview}
          processing={procBack}
          onFile={handleBack}
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {hasAnyData && (
        <div className="bg-[#383A40] rounded-xl px-4 py-3 space-y-1">
          <p className="text-[10px] font-semibold text-[#949BA4] uppercase tracking-widest mb-2">
            Tespit Edilen Bilgiler
          </p>
          <Field label="Ad Soyad"     value={extracted.fullName}  />
          <Field label="TC Kimlik No" value={extracted.tcNo}      ok={tcValid} />
          <Field label="Doğum Tarihi" value={extracted.birthDate} />
          {!tcValid && (
            <p className="text-xs text-yellow-400 pt-1">
              TC Kimlik No (11 hane) okunamadı — daha net fotoğraf yükleyin.
            </p>
          )}

          {import.meta.env.DEV && rawOcrText && (
            <details className="mt-2">
              <summary className="text-[10px] text-[#949BA4]/60 cursor-pointer hover:text-[#949BA4] select-none">
                Ham OCR çıktısı (dev)
              </summary>
              <pre className="mt-1 text-[10px] text-[#949BA4]/70 bg-[#1e1f22] rounded p-2 max-h-28 overflow-auto whitespace-pre-wrap break-all leading-4">
                {rawOcrText}
              </pre>
            </details>
          )}
        </div>
      )}

      <button
        onClick={canProceed ? handleNext : undefined}
        disabled={!canProceed}
        className={[
          'w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200',
          canProceed
            ? 'bg-[#5865F2] hover:bg-[#4752C4] text-white active:scale-[0.98] cursor-pointer'
            : 'bg-[#383A40] text-[#949BA4] cursor-not-allowed',
        ].join(' ')}
      >
        Devam Et →
      </button>
    </div>
  )
}
