import { useState, useEffect, useRef, FormEvent } from 'react'
import {
  Box, Paper, Typography, IconButton, Fab, Chip, TextField, Tooltip, Zoom, Alert, keyframes,
} from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import {
  faPlay, faPause, faStop, faBackwardStep, faForwardStep, faXmark,
  faMicrophone, faPaperPlane, faHeadset, faCircleQuestion,
} from '@fortawesome/free-solid-svg-icons'
import { ECOLIO_NAVY, ECOLIO_BLUE } from '../../theme'
import { GUIDE_CHAPTERS, GUIDE_FAQ, findAnswer } from './guideContent'

const SUGGESTED_QUESTIONS = [
  'Combien ça coûte ?',
  GUIDE_FAQ[0].question,
  GUIDE_FAQ[2].question,
  GUIDE_FAQ[7].question,
]

type Status = 'idle' | 'speaking' | 'paused'

// Types minimaux de la Web Speech API (reconnaissance), absente des typings DOM standards.
interface RecognitionResultEvent { results: ArrayLike<ArrayLike<{ transcript: string }>> }
interface Recognition {
  lang: string
  interimResults: boolean
  onresult: ((e: RecognitionResultEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}
type RecognitionCtor = new () => Recognition

const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
const RecognitionImpl: RecognitionCtor | undefined = typeof window !== 'undefined'
  ? ((window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }).SpeechRecognition
    || (window as unknown as { webkitSpeechRecognition?: RecognitionCtor }).webkitSpeechRecognition)
  : undefined

// Chrome coupe les énoncés longs (~15 s) : on lit le texte phrase par phrase.
const splitSentences = (text: string) => text.match(/[^.!?]+[.!?]*/g)?.map(s => s.trim()).filter(Boolean) ?? [text]

// Voix française la plus naturelle disponible sur l'appareil.
function pickFrenchVoice(): SpeechSynthesisVoice | null {
  const voices = synth?.getVoices().filter(v => v.lang.toLowerCase().startsWith('fr')) ?? []
  const preferred = ['google', 'denise', 'henri', 'hortense', 'amelie', 'amélie', 'audrey', 'thomas']
  return voices.find(v => v.lang === 'fr-FR' && preferred.some(p => v.name.toLowerCase().includes(p)))
    || voices.find(v => v.lang === 'fr-FR') || voices[0] || null
}

const soundBar = keyframes`
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
`
const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(46,134,171,0.55); }
  70% { box-shadow: 0 0 0 16px rgba(46,134,171,0); }
  100% { box-shadow: 0 0 0 0 rgba(46,134,171,0); }
`

// Assistante vocale de la page d'accueil : présente oralement toutes les fonctionnalités
// d'Écolio et répond aux questions (texte ou micro) à partir de guideContent.ts.
export default function VoiceGuide() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [chapterIndex, setChapterIndex] = useState(0)
  const [answerMode, setAnswerMode] = useState(false)
  const [answerTitle, setAnswerTitle] = useState('')
  const [sentences, setSentences] = useState<string[]>(splitSentences(GUIDE_CHAPTERS[0].text))
  const [sentenceIndex, setSentenceIndex] = useState(-1)
  const [question, setQuestion] = useState('')
  const [listening, setListening] = useState(false)
  const runIdRef = useRef(0)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const recognitionRef = useRef<Recognition | null>(null)
  const subtitleRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!synth) return
    const loadVoice = () => { voiceRef.current = pickFrenchVoice() }
    loadVoice()
    synth.addEventListener('voiceschanged', loadVoice)
    return () => {
      synth.removeEventListener('voiceschanged', loadVoice)
      synth.cancel()
      recognitionRef.current?.stop()
    }
  }, [])

  useEffect(() => {
    subtitleRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [sentenceIndex])

  const stop = () => {
    runIdRef.current++
    synth?.cancel()
    setStatus('idle')
    setSentenceIndex(-1)
  }

  // Lit un texte phrase par phrase ; onDone n'est appelé que si la lecture n'a pas été interrompue.
  const speak = (text: string, onDone: () => void) => {
    const runId = ++runIdRef.current
    synth?.cancel()
    const parts = splitSentences(text)
    setSentences(parts)
    if (!synth) { setSentenceIndex(-1); return }
    setStatus('speaking')

    const sayPart = (i: number) => {
      if (runId !== runIdRef.current) return
      if (i >= parts.length) { setSentenceIndex(-1); onDone(); return }
      setSentenceIndex(i)
      const u = new SpeechSynthesisUtterance(parts[i])
      u.lang = 'fr-FR'
      u.rate = 1
      if (voiceRef.current) u.voice = voiceRef.current
      u.onend = () => sayPart(i + 1)
      u.onerror = () => { if (runId === runIdRef.current) setStatus('idle') }
      synth.speak(u)
    }
    sayPart(0)
  }

  const playChapter = (index: number, continueTour = true) => {
    setAnswerMode(false)
    setChapterIndex(index)
    speak(GUIDE_CHAPTERS[index].text, () => {
      if (continueTour && index + 1 < GUIDE_CHAPTERS.length) playChapter(index + 1, true)
      else setStatus('idle')
    })
  }

  const togglePlay = () => {
    if (!synth) return
    if (status === 'speaking') { synth.pause(); setStatus('paused') }
    else if (status === 'paused') { synth.resume(); setStatus('speaking') }
    else playChapter(answerMode ? 0 : chapterIndex)
  }

  const goTo = (index: number) => {
    const i = Math.max(0, Math.min(GUIDE_CHAPTERS.length - 1, index))
    if (synth) playChapter(i)
    else { setChapterIndex(i); setAnswerMode(false); setSentences(splitSentences(GUIDE_CHAPTERS[i].text)) }
  }

  const answer = (raw: string) => {
    const q = raw.trim()
    if (!q) return
    setQuestion('')
    const res = findAnswer(q)
    setAnswerMode(true)
    setAnswerTitle(res.title)
    if (res.chapterIndex !== null) setChapterIndex(res.chapterIndex)
    speak(res.text, () => setStatus('idle'))
  }

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); answer(question) }

  const toggleListening = () => {
    if (!RecognitionImpl) return
    if (listening) { recognitionRef.current?.stop(); return }
    stop()
    const rec = new RecognitionImpl()
    rec.lang = 'fr-FR'
    rec.interimResults = false
    rec.onresult = e => answer(e.results[0][0].transcript)
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recognitionRef.current = rec
    setListening(true)
    rec.start()
  }

  const close = () => { stop(); recognitionRef.current?.stop(); setOpen(false) }

  const chapter = GUIDE_CHAPTERS[chapterIndex]
  const speaking = status === 'speaking'

  return (
    <>
      {/* Bouton d'ouverture (en bas à gauche, le bas à droite étant pris par BackToTop) */}
      <Zoom in={!open}>
        <Box sx={{ position: 'fixed', bottom: { xs: 20, sm: 28 }, left: { xs: 20, sm: 28 }, zIndex: 1200, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Fab onClick={() => setOpen(true)} aria-label="Ouvrir l'assistante vocale Écolio" sx={{
            bgcolor: ECOLIO_BLUE, color: 'white', animation: `${pulse} 2.2s infinite`,
            '&:hover': { bgcolor: ECOLIO_NAVY },
          }}>
            <FontAwesomeIcon icon={faHeadset} style={{ fontSize: '1.35rem' }} />
          </Fab>
          <Paper onClick={() => setOpen(true)} sx={{
            display: { xs: 'none', sm: 'block' }, px: 2, py: 1, borderRadius: 999, cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(26,60,94,0.18)',
          }}>
            <Typography variant="body2" fontWeight={700} color={ECOLIO_NAVY}>Découvrir Écolio en vocal</Typography>
          </Paper>
        </Box>
      </Zoom>

      {/* Panneau de l'assistante */}
      <Zoom in={open} style={{ transformOrigin: 'bottom left' }}>
        <Paper role="dialog" aria-label="Assistante vocale Écolio" elevation={12} sx={{
          position: 'fixed', zIndex: 1300, bottom: { xs: 16, sm: 28 }, left: { xs: 16, sm: 28 },
          width: { xs: 'calc(100vw - 32px)', sm: 390 }, maxHeight: { xs: 'calc(100vh - 32px)', sm: 'min(640px, calc(100vh - 56px))' },
          borderRadius: 4, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          {/* En-tête */}
          <Box sx={{ background: `linear-gradient(135deg, ${ECOLIO_NAVY} 0%, ${ECOLIO_BLUE} 100%)`, color: 'white', p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 46, height: 46, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.15)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px',
            }}>
              {[0, 1, 2, 3].map(i => (
                <Box key={i} sx={{
                  width: 4, height: 20, borderRadius: 2, bgcolor: 'white', transformOrigin: 'center',
                  transform: 'scaleY(0.3)',
                  animation: speaking ? `${soundBar} 0.9s ease-in-out ${i * 0.15}s infinite` : 'none',
                }} />
              ))}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={800} lineHeight={1.2}>Assistante Écolio</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                {listening ? 'Je vous écoute…' : speaking ? 'En train de parler…' : status === 'paused' ? 'En pause' : 'Visite guidée vocale'}
              </Typography>
            </Box>
            <IconButton onClick={close} aria-label="Fermer l'assistante" sx={{ color: 'white' }}>
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: '1.1rem' }} />
            </IconButton>
          </Box>

          <Box sx={{ p: 2, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {!synth && (
              <Alert severity="info" sx={{ py: 0 }}>
                Votre navigateur ne prend pas en charge la lecture vocale : le texte reste consultable ci-dessous.
              </Alert>
            )}

            {/* Sous-titres */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FontAwesomeIcon icon={answerMode ? faCircleQuestion : chapter.icon} style={{ color: ECOLIO_BLUE }} />
                <Typography variant="subtitle2" fontWeight={800} color={ECOLIO_NAVY}>
                  {answerMode ? answerTitle : `${chapterIndex + 1}/${GUIDE_CHAPTERS.length} · ${chapter.title}`}
                </Typography>
              </Box>
              <Box ref={subtitleRef} aria-live="polite" sx={{ bgcolor: '#f4f7fb', borderRadius: 2, p: 1.5, maxHeight: 170, overflowY: 'auto' }}>
                <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                  {sentences.map((s, i) => (
                    <Box component="span" key={i} data-active={i === sentenceIndex} sx={{
                      transition: 'color 0.2s, background-color 0.2s', borderRadius: 1, px: 0.25,
                      color: sentenceIndex === -1 || i === sentenceIndex ? 'text.primary' : 'text.secondary',
                      bgcolor: i === sentenceIndex ? `${ECOLIO_BLUE}22` : 'transparent',
                      fontWeight: i === sentenceIndex ? 600 : 400,
                    }}>
                      {s}{' '}
                    </Box>
                  ))}
                </Typography>
              </Box>
            </Box>

            {/* Commandes de lecture */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Précédent">
                <span>
                  <IconButton onClick={() => goTo(chapterIndex - 1)} disabled={chapterIndex === 0 && !answerMode} aria-label="Chapitre précédent">
                    <FontAwesomeIcon icon={faBackwardStep} style={{ fontSize: '1rem' }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={speaking ? 'Pause' : status === 'paused' ? 'Reprendre' : 'Écouter la présentation'}>
                <span>
                  <Fab size="medium" onClick={togglePlay} disabled={!synth} aria-label={speaking ? 'Pause' : 'Lecture'} sx={{
                    bgcolor: ECOLIO_NAVY, color: 'white', boxShadow: '0 6px 16px rgba(26,60,94,0.3)',
                    '&:hover': { bgcolor: ECOLIO_BLUE },
                  }}>
                    <FontAwesomeIcon icon={speaking ? faPause : faPlay} style={{ fontSize: '1rem', marginLeft: speaking ? 0 : 2 }} />
                  </Fab>
                </span>
              </Tooltip>
              <Tooltip title="Arrêter">
                <span>
                  <IconButton onClick={stop} disabled={status === 'idle'} aria-label="Arrêter la lecture">
                    <FontAwesomeIcon icon={faStop} style={{ fontSize: '1rem' }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Suivant">
                <span>
                  <IconButton onClick={() => goTo(answerMode ? chapterIndex : chapterIndex + 1)} disabled={chapterIndex === GUIDE_CHAPTERS.length - 1 && !answerMode} aria-label="Chapitre suivant">
                    <FontAwesomeIcon icon={faForwardStep} style={{ fontSize: '1rem' }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>

            {/* Sommaire */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Sommaire
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.75 }}>
                {GUIDE_CHAPTERS.map((c, i) => {
                  const active = !answerMode && i === chapterIndex
                  return (
                    <Chip key={c.id} size="small" label={c.title} onClick={() => goTo(i)}
                      icon={<FontAwesomeIcon icon={c.icon} style={{ fontSize: '0.7rem', color: active ? 'white' : ECOLIO_BLUE }} />}
                      sx={{
                        fontWeight: 600, bgcolor: active ? ECOLIO_BLUE : '#eef3f8', color: active ? 'white' : ECOLIO_NAVY,
                        '&:hover': { bgcolor: active ? ECOLIO_NAVY : '#dfe8f2' },
                      }} />
                  )
                })}
              </Box>
            </Box>

            {/* Questions fréquentes */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Questions fréquentes
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.75 }}>
                {SUGGESTED_QUESTIONS.map(q => (
                  <Chip key={q} size="small" label={q} variant="outlined" onClick={() => answer(q)}
                    sx={{ fontWeight: 600, color: ECOLIO_NAVY, borderColor: '#d8e2ec', '&:hover': { bgcolor: '#eef3f8' } }} />
                ))}
              </Box>
            </Box>
          </Box>

          {/* Question libre */}
          <Box component="form" onSubmit={handleSubmit} sx={{ p: 1.5, borderTop: '1px solid #eef0f4', display: 'flex', gap: 1, alignItems: 'center' }}>
            {RecognitionImpl && (
              <Tooltip title={listening ? 'Arrêter l\'écoute' : 'Poser une question à voix haute'}>
                <IconButton onClick={toggleListening} aria-label="Poser une question au micro" sx={{
                  bgcolor: listening ? '#e11d48' : '#eef3f8', color: listening ? 'white' : ECOLIO_NAVY,
                  animation: listening ? `${pulse} 1.4s infinite` : 'none',
                  '&:hover': { bgcolor: listening ? '#be123c' : '#dfe8f2' },
                }}>
                  <FontAwesomeIcon icon={faMicrophone} style={{ fontSize: '0.95rem' }} />
                </IconButton>
              </Tooltip>
            )}
            <TextField size="small" fullWidth placeholder="Posez une question… (ex : combien ça coûte ?)"
              value={question} onChange={e => setQuestion(e.target.value)}
              inputProps={{ 'aria-label': 'Votre question' }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 999 } }} />
            <IconButton type="submit" disabled={!question.trim()} aria-label="Envoyer la question" sx={{ color: ECOLIO_BLUE }}>
              <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: '0.95rem' }} />
            </IconButton>
          </Box>
        </Paper>
      </Zoom>
    </>
  )
}
