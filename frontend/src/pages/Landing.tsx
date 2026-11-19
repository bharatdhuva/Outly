import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronDown, ChevronRight, FileText, Pause, Plane, Play, Plus, Search, Send, ShieldCheck, Target, X } from 'lucide-react'
import { prefetchRoute, prefetchOnIdle } from '@/lib/prefetch'
import gmailLogo from '@/assets/logos/google-gmail.svg'
import calendarLogo from '@/assets/logos/google-calendar.svg'
import linkedinLogo from '@/assets/logos/linkedin-icon.svg'
import naukriLogo from '@/assets/logos/naukri-seeklogo.svg'
import wellfoundLogo from '@/assets/logos/wellfound.svg'
import workdayLogo from '@/assets/logos/workday-icon.svg'
import geminiLogo from '@/assets/logos/gemini-icon-seeklogo.svg'
import indeedLogo from '@/assets/logos/jobboards/indeed.svg'
import glassdoorLogo from '@/assets/logos/jobboards/glassdoor.svg'
import monsterLogo from '@/assets/logos/jobboards/monster.svg'
import founditLogo from '@/assets/logos/jobboards/foundit.ico'
import naukriBoardLogo from '@/assets/logos/jobboards/naukri.ico'
import instahyreLogo from '@/assets/logos/jobboards/instahyre.ico'
import shineLogo from '@/assets/logos/jobboards/shine.ico'
import timesJobsLogo from '@/assets/logos/jobboards/timesjobs.ico'
import remotiveLogo from '@/assets/logos/jobboards/remotive.ico'
import remoteOkLogo from '@/assets/logos/jobboards/remoteok.ico'
import flexJobsLogo from '@/assets/logos/jobboards/flexjobs.ico'
import handshakeLogo from '@/assets/logos/jobboards/handshake.ico'
import diceLogo from '@/assets/logos/jobboards/dice.ico'
import pricingSeaImage from '@/assets/pricing-sea.webp'
import pricingFieldImage from '@/assets/pricing-field.webp'
import pricingCatImage from '@/assets/pricing-cat.webp'
import './Landing.css'

const slides = [
  { title: 'a better match, before you apply.', label: 'ats score', copy: '27 checks, one clear next step.', content: 'score' },
  { title: 'an introduction that sounds like you.', label: 'smart outreach', copy: 'A thoughtful note, ready when you are.', content: 'mail' },
  { title: 'one resume, shaped for every role.', label: 'resume vault', copy: 'Your master copy, plus every tailored version.', content: 'vault' },
  { title: 'every application, in its place.', label: 'your tracker', copy: 'See what is moving and what needs a nudge.', content: 'board' },
  { title: 'a small nudge at the right time.', label: 'morning brief', copy: 'The useful bits, before the day gets busy.', content: 'brief' },
  { title: 'the next conversation, on your calendar.', label: 'interview prep', copy: 'Your interview and calendar, in sync.', content: 'calendar' },
]
const faq = [
  ['is Outly really free?', 'Yes. The free plan includes three ATS checks every 12 hours, Resume Vault, AI job search, your tracker board and the cold-mail generator. Pro is there when you need more room.'],
  ['how does ATS scoring work?', 'Each application gets a 27-factor score, a keyword-gap breakdown and practical recruiter-style fixes. The score is a guide, not a guarantee.'],
  ['will my resume be sold or used for training?', 'No. Your resume and job-search data stay yours. We do not sell them or use them to train external models.'],
  ['which job boards and ATS does it work with?', 'Bring a job description from the places you already search. Outly helps you understand and organize the role; it does not pretend to be a job board.'],
  ['how does cold-mail outreach work?', 'Outly finds relevant recruiters and drafts a personal note in your voice. You review it and choose what to send.'],
  ['can i cancel anytime?', 'Yes. You can cancel Pro at any time. Your saved application history remains yours.'],
  ['is my Gmail safe?', 'Outly only uses connected services for the features you choose. You stay in control of what gets drafted and sent.'],
  ['how do i get started?', 'Upload a master resume. That is the setup. Find a role you like and Outly will help with the next step.'],
]

const heroWords = [
  { text: 'job search,', icon: Search, bg: '#12A394' },
  { text: 'career,', icon: Target, bg: '#111111' },
  { text: 'outreach,', icon: Send, bg: '#7C3AED' },
  { text: 'resume,', icon: FileText, bg: '#EA580C' },
  { text: 'interviews,', icon: CalendarDays, bg: '#059669' },
]

const jobPlatformBrands = [
  { name: 'LinkedIn Jobs', logo: linkedinLogo },
  { name: 'Naukri', logo: naukriBoardLogo },
  { name: 'Wellfound', logo: wellfoundLogo },
  { name: 'Indeed', logo: indeedLogo },
  { name: 'Glassdoor', logo: glassdoorLogo },
  { name: 'Monster', logo: monsterLogo },
  { name: 'Foundit', logo: founditLogo },
  { name: 'Instahyre', logo: instahyreLogo },
  { name: 'Shine', logo: shineLogo },
  { name: 'TimesJobs', logo: timesJobsLogo },
  { name: 'Remotive', logo: remotiveLogo },
  { name: 'Remote OK', logo: remoteOkLogo },
  { name: 'FlexJobs', logo: flexJobsLogo },
  { name: 'Handshake', logo: handshakeLogo },
  { name: 'Dice', logo: diceLogo },
]

function HeroRotator() {
  const [index, setIndex] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => {
      setAnimating(true)
      setTimeout(() => {
        setIndex(prev => (prev + 1) % heroWords.length)
        setAnimating(false)
      }, 280)
    }, 2800)
    return () => clearInterval(timer)
  }, [])

  const current = heroWords[index]
  const Icon = current.icon

  return (
    <span className="hero-rotator">
      <span className={`hero-rotator-item ${animating ? 'is-exiting' : 'is-entering'}`}>
        <span
          className="hero-rotator-icon-box"
          style={{ background: current.bg }}
        >
          <Icon strokeWidth={2.4} />
        </span>
        <span className="hero-rotator-text">{current.text}</span>
      </span>
    </span>
  )
}

function Brand() { return <a className="brand" href="#top" aria-label="Outly home" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><span className="brand-mark"><Send size={20} strokeWidth={2} /></span><span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: '-0.02em' }}>Outly</span></a> }

function MiniWindow({ type }: { type: string }) {
  if (type === 'score') return <div className="mini-window score-ui"><div className="mini-top"><span>role match</span><span className="tiny-dot" /> Product designer · Stripe</div><div className="score-layout"><div className="score-ring"><span>86<small>%</small></span></div><div className="score-lines"><b>strong match</b><span>keyword coverage</span><div className="meter"><i style={{ width: '86%' }} /></div><span>recruiter fixes</span><div className="meter"><i style={{ width: '72%' }} /></div><small>3 keywords to add</small></div></div></div>
  if (type === 'mail') return <div className="mini-window mail-ui"><div className="mail-head"><span>to</span><b>Priya Sharma · Stripe recruiter</b><span className="draft-tag">draft</span></div><div className="mail-body"><b>Application · Product Designer</b><p>Hi Priya, I saw the product design role at Stripe and was drawn to the work on making payments feel simple. My recent work on...</p><div className="typing"><i /> written in your voice</div></div></div>
  if (type === 'vault') return <div className="mini-window vault-ui"><div className="mini-top"><span>resume vault</span><span>3 versions</span></div>{[['Master resume', 'Updated just now'], ['Stripe · Product Designer', 'Tailored today'], ['Linear · Product Designer', 'Tailored yesterday']].map(([a, b], i) => <div className="file-row" key={a}><FileText size={16} /><span><b>{a}</b><small>{b}</small></span><span className={i ? 'file-arrow' : 'file-master'}>{i ? '↗' : 'master'}</span></div>)}</div>
  if (type === 'board') return <div className="mini-window board-ui"><div className="board-column"><label>saved <em>3</em></label><div className="board-card"><b>Figma</b><small>Product Designer</small></div><div className="board-card"><b>Linear</b><small>Product Designer</small></div></div><div className="board-column"><label>interview <em>1</em></label><div className="board-card active-board"><b>Stripe</b><small>Interview · 2:30 PM</small></div></div><div className="board-column"><label>offer <em>0</em></label><div className="empty-card">you&apos;ll get here</div></div></div>
  if (type === 'brief') return <div className="mini-window brief-ui"><div className="brief-title"><span className="brief-sun">☼</span><div><small>tuesday · morning brief</small><b>good morning, rohan.</b></div><span className="brief-count">2 things</span></div><div className="brief-item"><span className="brief-bullet teal" /><span><b>Stripe recruiter replied</b><small>reply before Friday</small></span><ArrowUpRight size={15} /></div><div className="brief-item"><span className="brief-bullet yellow" /><span><b>Your Figma interview</b><small>tomorrow at 2:30 PM · synced</small></span><CalendarDays size={15} /></div></div>
  return <div className="mini-window calendar-ui"><div className="calendar-head"><b>April 2026</b><span>‹ &nbsp; ›</span></div><div className="calendar-grid">{'MTWTFSS'.split('').map((d, i) => <small key={i}>{d}</small>)}{Array.from({ length: 14 }, (_, i) => <span key={i} className={i === 9 ? 'calendar-selected' : ''}>{i + 1}</span>)}</div><div className="calendar-event"><span /> Stripe Interview <b>2:30 PM</b><small>calendar synced</small></div></div>
}

function PlanList() {
  const ref = useRef<HTMLDivElement>(null)
  // 0 = idle, 1 = running, 2 = done
  const [states, setStates] = useState<number[]>(Array(6).fill(0))

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Stagger: each step starts running 480ms after previous one starts
          Array(6).fill(null).forEach((_, i) => {
            setTimeout(() => {
              setStates(prev => { const n = [...prev]; n[i] = 1; return n })
              setTimeout(() => {
                setStates(prev => { const n = [...prev]; n[i] = 2; return n })
              }, 820)
            }, i * 480)
          })
          observer.disconnect()
        }
      },
      { threshold: 0.25 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const steps: [string, string, string][] = [
    ['research the role', 'Know what the team needs.', 'analysing JD'],
    ['tailor the resume', 'Show the experience that fits.', 'rewriting bullets'],
    ['score the match', 'See the gaps, not guess.', '27 factors'],
    ['draft the outreach', 'Reach out like yourself.', 'your voice'],
    ['track the reply', 'Keep the next step in view.', 'reply detected'],
    ['prep the interview', 'Walk in with a plan.', 'brief ready'],
  ]

  const doneCount = states.filter(s => s === 2).length
  const fillPct = (doneCount / 6) * 100

  return (
    <div className="pl-wrap" ref={ref}>
      {/* left rail */}
      <div className="pl-rail">
        <div className="pl-rail-fill" style={{ height: `${fillPct}%` }} />
        {states.map((s, i) => (
          <span
            key={i}
            className={`pl-node${s === 1 ? ' pl-node-running' : s === 2 ? ' pl-node-done' : ''}`}
            style={{ top: `${(i / 5) * 100}%` }}
          >
            {s === 2 && (
              <svg viewBox="0 0 8 8" fill="none">
                <path className="pl-check" d="M1.5 4l1.8 1.8L6.5 2.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        ))}
      </div>

      {/* step rows */}
      <div className="pl-rows">
        {steps.map(([title, desc, tag], i) => (
          <div
            key={title}
            className={`pl-row${states[i] === 1 ? ' pl-row-running' : states[i] === 2 ? ' pl-row-done' : ''}`}
          >
            <div className="pl-row-main">
              <span className="pl-title">{title}</span>
              {states[i] === 1 && <span className="pl-tag pl-tag-run">{tag} <span className="pl-dots"><i /><i /><i /></span></span>}
              {states[i] === 2 && <span className="pl-tag pl-tag-done">done</span>}
            </div>
            <span className="pl-desc">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PixelLandscape({ kind = 'sea' }: { kind?: string }) {
  const [sunBlink, setSunBlink] = useState(false)
  const blinkSun = () => {
    setSunBlink(true)
    window.setTimeout(() => setSunBlink(false), 220)
  }
  return <div className={`pixel-landscape ${kind}`}><span className="pixel-cloud cloud-a" /><span className="pixel-cloud cloud-b" /><span className="pixel-cloud cloud-c" /><span className={`pixel-sun ${sunBlink ? 'sun-blink' : ''}`} onClick={blinkSun} role="button" tabIndex={0} aria-label="Blinking sun" /><span className="pixel-hill hill-a" /><span className="pixel-hill hill-b" /><span className="pixel-water" /><span className="pixel-boat boat-a" /><span className="pixel-boat boat-b" /><span className="pixel-sand" /></div>
}

export default function OutlyLanding() {
  const showcaseRef = useRef<HTMLDivElement>(null)
  const particleCanvasRef = useRef<HTMLCanvasElement>(null)
  const particlePointerRef = useRef({ x: -1000, y: -1000, active: false })
  const [slide, setSlide] = useState(0)
  const [paused, setPaused] = useState(false)
  const [tapePaused, setTapePaused] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [yearly, setYearly] = useState(false)
  const [displayPrice, setDisplayPrice] = useState(9)
  const priceValueRef = useRef(9)
  const [activeNav, setActiveNav] = useState('features')
  useEffect(() => {
    prefetchOnIdle(['/login', '/pricing'])
  }, [])
  useEffect(() => { if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; const timer = window.setInterval(() => setSlide(s => (s + 1) % slides.length), 5000); return () => window.clearInterval(timer) }, [paused])
  useEffect(() => {
    const target = yearly ? 99 : 9
    const start = priceValueRef.current
    const duration = 400
    const started = performance.now()
    let frame = 0
    const animate = (now: number) => {
      const progress = Math.min((now - started) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const value = Math.round(start + (target - start) * eased)
      priceValueRef.current = value
      setDisplayPrice(value)
      if (progress < 1) frame = window.requestAnimationFrame(animate)
    }
    frame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frame)
  }, [yearly])
  useEffect(() => { const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) setActiveNav(entry.target.id) }), { rootMargin: '-28% 0px -62% 0px' }); document.querySelectorAll('section[id]').forEach(section => observer.observe(section)); return () => observer.disconnect() }, [])
  useEffect(() => {
    const canvas = particleCanvasRef.current
    const showcase = showcaseRef.current
    if (!canvas || !showcase || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const context = canvas.getContext('2d')
    if (!context) return
    const particles: { x: number; y: number; size: number }[] = []
    let frame = 0
    let width = 0
    let height = 0

    const resize = () => {
      const bounds = showcase.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      width = bounds.width
      height = bounds.height
      canvas.width = width * ratio
      canvas.height = height * ratio
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      particles.length = 0
      const spacing = width < 600 ? 15 : 18
      for (let y = spacing / 2; y < height; y += spacing) {
        for (let x = spacing / 2; x < width; x += spacing) {
          particles.push({ x, y, size: .65 + Math.random() * .45 })
        }
      }
    }

    let isVisible = true
    const io = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
      if (isVisible) {
        window.cancelAnimationFrame(frame)
        frame = window.requestAnimationFrame(animate)
      } else {
        window.cancelAnimationFrame(frame)
      }
    }, { threshold: 0.05 })
    io.observe(showcase)

    const animate = () => {
      if (!isVisible) return
      context.clearRect(0, 0, width, height)
      const pointer = particlePointerRef.current
      particles.forEach(particle => {
        const dx = particle.x - pointer.x
        const dy = particle.y - pointer.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1
        const highlight = pointer.active && distance < 190 ? 1 - distance / 190 : 0
        context.fillStyle = highlight ? '#4A94B2' : '#68798f'
        context.globalAlpha = .28 + highlight * .72
        context.beginPath()
        context.arc(particle.x, particle.y, particle.size * (1 + highlight * .35), 0, Math.PI * 2)
        context.fill()
      })
      context.globalAlpha = 1
      frame = window.requestAnimationFrame(animate)
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })
    frame = window.requestAnimationFrame(animate)
    return () => {
      io.disconnect()
      window.removeEventListener('resize', resize)
      window.cancelAnimationFrame(frame)
    }
  }, [])
  const handleShowcasePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const showcase = showcaseRef.current
    if (!showcase || event.pointerType === 'touch') return
    const bounds = showcase.getBoundingClientRect()
    particlePointerRef.current = { x: event.clientX - bounds.left, y: event.clientY - bounds.top, active: true }
  }
  const handleShowcasePointerLeave = () => {
    particlePointerRef.current.active = false
  }
  return <>
    {createPortal(<nav className="nav-pill" aria-label="Main navigation">
      <Brand />
      <span className="nav-mobile-divider" aria-hidden="true" />
      <div className="nav-links">{[['features', 'Overview'], ['how-it-works', 'How it works'], ['pricing', 'Pricing'], ['faq', 'FAQ']].map(([id, label]) => <a href={`#${id}`} key={id}>{label}</a>)}</div>
      <div className="nav-mobile-links">
        <a href="#features">Overview</a>
        <a href="#pricing">Pricing</a>
      </div>
      <div className="nav-actions">
        <Link className="nav-signin-link" to="/login" onMouseEnter={() => prefetchRoute('/login')} onFocus={() => prefetchRoute('/login')}>Sign in</Link>
      </div>
    </nav>, document.body)}

    <main id="top" onMouseEnter={() => { }}>
      <section className="hero" aria-labelledby="hero-title"><h1 id="hero-title"><span className="hero-title-line"><span className="hero-static-your">Your</span><HeroRotator /></span><br /><i>one place.</i></h1><p className="hero-copy">Find the right roles, tailor your resume, and keep every application moving. <br />Your whole search, in one place.</p><div className="hero-actions"><Link className="button button-teal landing-hero-cta" to="/login" onMouseEnter={() => prefetchRoute('/login')} onFocus={() => prefetchRoute('/login')}>Start your search <ArrowUpRight size={17} /></Link><a className="button button-outline" href="#pricing">View pricing</a></div><div className="tool-chips" aria-label="Outly integrations"><div className="tool-chips-track"><div className="tool-chips-set"><b><img className="tool-logo" src={geminiLogo} alt="" />Gemini</b><b><img className="tool-logo gmail-logo" src={gmailLogo} alt="" />Gmail</b><b><img className="tool-logo calendar-logo" src={calendarLogo} alt="" />Calendar</b><b><img className="tool-logo linkedin-logo" src={linkedinLogo} alt="" />LinkedIn</b><b><img className="tool-logo tool-logo-naukri naukri-logo" src={naukriLogo} alt="" />Naukri</b><b><img className="tool-logo wellfound-logo" src={wellfoundLogo} alt="" />Wellfound</b><b><img className="tool-logo workday-logo" src={workdayLogo} alt="" />Workday</b></div><div className="tool-chips-set" aria-hidden="true"><b><img className="tool-logo" src={geminiLogo} alt="" />Gemini</b><b><img className="tool-logo gmail-logo" src={gmailLogo} alt="" />Gmail</b><b><img className="tool-logo calendar-logo" src={calendarLogo} alt="" />Calendar</b><b><img className="tool-logo linkedin-logo" src={linkedinLogo} alt="" />LinkedIn</b><b><img className="tool-logo tool-logo-naukri naukri-logo" src={naukriLogo} alt="" />Naukri</b><b><img className="tool-logo wellfound-logo" src={wellfoundLogo} alt="" />Wellfound</b><b><img className="tool-logo workday-logo" src={workdayLogo} alt="" />Workday</b></div></div></div></section>
      <section className="features-section" id="features"><div className="section-heading"><div><h2>Less searching.<br /><i>More actual work.</i></h2></div><p>From the first job description to the interview invite, Outly helps with the parts that take your time.</p></div><div className="bento-grid">{[
        { title: 'Resume ATS score', desc: 'A 27-factor score, clear fixes, and a target worth working toward.', type: 'score', tag: 'know where you stand' },
        { title: 'Resume Tailor', desc: 'Shape your resume around the role without losing your own voice.', type: 'keywords', tag: 'make the match clear' },
        { title: 'Resume Vault', desc: 'Keep your master resume and every tailored version together.', type: 'vault', tag: 'one source of truth' },
        { title: 'AI Job Search', desc: 'Find roles that fit your experience and what you want next.', type: 'search', tag: 'find your next' },
        { title: 'Application Tracker', desc: 'Move each role from saved to applied, interview, and offer.', type: 'board', tag: 'keep your place' },
        { title: 'Cold Mail Engine', desc: 'Find the right recruiter and draft a personal note in your own voice.', type: 'mail', tag: 'reach out with care' },
      ].map((card, i) => <article className={`feature-card feature-${card.type}`} key={card.title}><div className="feature-visual">{card.type === 'search' ? <div className="search-visual"><Search /><span>Product designer · remote</span><b>match 94%</b><div className="search-result"><span>Stripe</span><strong>Senior Product Designer</strong><small>Remote · posted 2 days ago</small></div></div> : card.type === 'keywords' ? <div className="keyword-ui"><div className="mini-top">keyword gap <b>3 to add</b></div>{[['product strategy', true], ['design systems', true], ['experimentation', false], ['stakeholder work', true]].map(([w, ok]) => <div className="keyword-row" key={String(w)}><span className={ok ? 'keyword-ok' : ''}>{ok ? '✓' : '+'}</span>{w}</div>)}</div> : card.type === 'privacy' ? <div className="privacy-visual"><ShieldCheck size={28} /><b>your resume, your rules.</b><span>stored privately · never sold</span><div className="privacy-line"><i /> training use <b>off</b></div></div> : <MiniWindow type={card.type} />}</div><div className="feature-copy"><h3>{card.title}</h3><p>{card.desc}</p></div></article>)}</div></section>
      <section className="steps-section" id="how-it-works"><div className="section-heading"><div><h2>From upload to a<br /><i>better next step.</i></h2></div><p>A clear start, then one good move at a time. Most people are ready in about two minutes.</p></div><div className="steps-grid">{[['01', 'Upload your master resume', 'Outly takes it from there. Keep your original close.', 'resume'], ['02', 'Find a role worth your time', 'Paste a description or discover a match.', 'search'], ['03', 'Make your application fit', 'Get a tailored resume and the ATS score to improve it.', 'tailor'], ['04', 'Reach out and track it', 'Review the note, send when ready, and track the reply.', 'send']].map(([num, title, desc, icon], i) => <article className={`step-card step-${i + 1}`} key={num}><div className="step-illustration">{icon === 'resume' ? <FileText /> : icon === 'search' ? <Search /> : icon === 'tailor' ? <Target /> : <Send />}</div><h3>{title}</h3><p>{desc}</p><div className="pixel-stair" /></article>)}</div></section>
      <section className="ats-marquee" aria-label="Job search platforms"><div className="marquee-band"><div className={`marquee-track ${tapePaused ? 'marquee-paused' : ''}`}>{[0, 1].map(copy => <span className="marquee-set" key={copy} aria-hidden={copy === 1}>{jobPlatformBrands.map((brand, index) => <span className="marquee-brand" key={`${copy}-${brand.name}-${index}`} role={copy === 0 ? 'img' : undefined} aria-label={copy === 0 ? brand.name : undefined}><img src={brand.logo} alt="" aria-hidden="true" loading="eager" /><span>{brand.name}</span></span>)}</span>)}</div><button onClick={() => setTapePaused(!tapePaused)} className="tape-pause" aria-label={tapePaused ? 'Play job board logos' : 'Pause job board logos'} aria-pressed={tapePaused} title={tapePaused ? 'Play logos' : 'Pause logos'}>{tapePaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}</button></div></section>
      <section className="plan-section"><div className="plan-scene"><PixelLandscape /><div className="plan-float"><h2>Give every<br />application <i>its own plan.</i></h2><PlanList /><Link className="button button-dark" to="/login" onMouseEnter={() => prefetchRoute('/login')} onFocus={() => prefetchRoute('/login')}>Get started, it&apos;s free <ArrowUpRight size={16} /></Link></div></div></section>
      <section className="trust-section"><div className="section-heading"><div><h2>Where your data<br /><i>lives with you.</i></h2></div><p>A job search is personal. Outly is built to treat it that way, from the first upload to the last follow-up.</p></div><div className="trust-grid"><article><PixelLandscape kind="local-scene" /><h3>Stored for your search</h3><p>Your master resume and tailored versions stay in your private Outly account, ready when you need them.</p></article><article><PixelLandscape kind="cloud-scene" /><h3>Private cloud</h3><p>Your search stays accessible without turning your personal documents into public information.</p></article><article><PixelLandscape kind="quiet-scene" /><h3>Never used for training</h3><p>We do not sell your information or use your resume to train external models. Your next move is yours.</p></article></div></section>
      <section className="pricing-section" id="pricing"><div className="pricing-glow" /><div className="pricing-header"><div><h2>Start free.<br /><i>Upgrade when you need more room.</i></h2></div><div className="billing-toggle"><span className={`billing-slider ${yearly ? 'billing-slider-yearly' : ''}`} aria-hidden="true" /><button className={`billing-monthly ${!yearly ? 'billing-active' : ''}`} onClick={() => setYearly(false)}>Monthly</button><button className={`billing-yearly ${yearly ? 'billing-active' : ''}`} onClick={() => setYearly(true)}>Yearly <span>save 20%</span></button></div></div><div className="pricing-grid"><article className="price-card free-card"><div className="pricing-cat"><img src={pricingCatImage} alt="" /><span>z</span><span>z</span></div><img className="pricing-art" src={pricingSeaImage} alt="" /><div className="price-content"><h3>Free</h3><p>Everything you need to get moving.</p><div className="price"><b>₹0</b><span>forever</span></div><ul>{['3 ATS checks every 12 hours', 'Resume Vault', 'AI job search', 'Application tracker board', 'Cold-mail generator'].map(x => <li key={x}><Check size={15} />{x}</li>)}<li className="unavailable"><X size={15} />Unlimited tailoring</li></ul><Link className="button button-white" to="/login" onMouseEnter={() => prefetchRoute('/login')} onFocus={() => prefetchRoute('/login')}>Get started <ArrowUpRight size={16} /></Link></div></article><article className="price-card pro-card"><img className="pricing-art" src={pricingFieldImage} alt="" /><div className="price-content"><div className="pro-label">best for active job seekers</div><h3>Pro</h3><p>More room for every application.</p><div className="price"><b>₹{displayPrice}</b><span>{yearly ? '/ year' : '/ month'}</span></div><ul>{['Unlimited ATS checks · 27-factor score', 'Unlimited resume tailoring', 'Deep keyword-gap insights', 'Unlimited Resume Vault & tracking', 'Full cold-mail automation'].map(x => <li key={x}><Check size={15} />{x}</li>)}</ul><Link className="button button-teal" to="/login" onMouseEnter={() => prefetchRoute('/login')} onFocus={() => prefetchRoute('/login')}>Try now <ArrowUpRight size={16} /></Link><Link className="buy-link" to="/pricing" onMouseEnter={() => prefetchRoute('/pricing')} onFocus={() => prefetchRoute('/pricing')}>or buy now</Link></div></article></div><p className="pricing-note"><ShieldCheck size={14} /> your data stays yours on every plan. no pressure, cancel anytime.</p></section>
      <section className="faq-section" id="faq"><h2 className="faq-title">FAQ</h2><div className="faq-list">{faq.map(([q, a], i) => <article className={`faq-item ${openFaq === i ? 'faq-open' : ''}`} key={q}><button aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)}><span>{q}</span><span className="faq-plus"><ChevronRight size={15} /></span></button><div className="faq-answer"><p>{a}</p></div></article>)}</div></section>
      <section className="closing"><div className="closing-pixels" /><h2>Meet your next<br /><i>good thing.</i></h2><p>It could be working in two minutes.<br />Free to start. Yours to steer.</p><div className="closing-actions"><Link className="button button-dark" to="/login" onMouseEnter={() => prefetchRoute('/login')} onFocus={() => prefetchRoute('/login')}>Get started, it&apos;s free <ArrowUpRight size={16} /></Link><Link className="button button-white" to="/login" onMouseEnter={() => prefetchRoute('/login')} onFocus={() => prefetchRoute('/login')}>Sign in</Link></div><PixelLandscape kind="closing-sea" /></section>
      <footer className="footer-simple"><span>© 2026 Outly</span><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></footer>
    </main>
  </>
}


