import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronDown, ChevronRight, FileText, Menu, Plane, Plus, Search, Send, ShieldCheck, Target, X } from 'lucide-react'
import gmailLogo from '@/assets/logos/google-gmail.svg'
import calendarLogo from '@/assets/logos/google-calendar.svg'
import linkedinLogo from '@/assets/logos/linkedin-icon.svg'
import naukriLogo from '@/assets/logos/naukri-seeklogo.svg'
import wellfoundLogo from '@/assets/logos/wellfound.svg'
import workdayLogo from '@/assets/logos/workday-icon.svg'
import geminiLogo from '@/assets/logos/gemini-icon-seeklogo.svg'
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

function Brand() { return <a className="brand" href="/" aria-label="Outly home" onClick={(event)=>{event.preventDefault();window.location.reload()}}><span className="brand-mark"><Send size={25} strokeWidth={1.7}/></span><span>Outly</span></a> }

function MiniWindow({ type }: { type: string }) {
  if (type === 'score') return <div className="mini-window score-ui"><div className="mini-top"><span>role match</span><span className="tiny-dot"/> Product designer · Stripe</div><div className="score-layout"><div className="score-ring"><span>86<small>%</small></span></div><div className="score-lines"><b>strong match</b><span>keyword coverage</span><div className="meter"><i style={{width:'86%'}}/></div><span>recruiter fixes</span><div className="meter"><i style={{width:'72%'}}/></div><small>3 keywords to add</small></div></div></div>
  if (type === 'mail') return <div className="mini-window mail-ui"><div className="mail-head"><span>to</span><b>Priya Sharma · Stripe recruiter</b><span className="draft-tag">draft</span></div><div className="mail-body"><b>Application · Product Designer</b><p>Hi Priya, I saw the product design role at Stripe and was drawn to the work on making payments feel simple. My recent work on...</p><div className="typing"><i/> written in your voice</div></div></div>
  if (type === 'vault') return <div className="mini-window vault-ui"><div className="mini-top"><span>resume vault</span><span>3 versions</span></div>{[['Master resume','Updated just now'],['Stripe · Product Designer','Tailored today'],['Linear · Product Designer','Tailored yesterday']].map(([a,b],i)=><div className="file-row" key={a}><FileText size={16}/><span><b>{a}</b><small>{b}</small></span><span className={i?'file-arrow':'file-master'}>{i?'↗':'master'}</span></div>)}</div>
  if (type === 'board') return <div className="mini-window board-ui"><div className="board-column"><label>saved <em>3</em></label><div className="board-card"><b>Figma</b><small>Product Designer</small></div><div className="board-card"><b>Linear</b><small>Product Designer</small></div></div><div className="board-column"><label>interview <em>1</em></label><div className="board-card active-board"><b>Stripe</b><small>Interview · 2:30 PM</small></div></div><div className="board-column"><label>offer <em>0</em></label><div className="empty-card">you&apos;ll get here</div></div></div>
  if (type === 'brief') return <div className="mini-window brief-ui"><div className="brief-title"><span className="brief-sun">☼</span><div><small>tuesday · morning brief</small><b>good morning, rohan.</b></div><span className="brief-count">2 things</span></div><div className="brief-item"><span className="brief-bullet teal"/><span><b>Stripe recruiter replied</b><small>reply before Friday</small></span><ArrowUpRight size={15}/></div><div className="brief-item"><span className="brief-bullet yellow"/><span><b>Your Figma interview</b><small>tomorrow at 2:30 PM · synced</small></span><CalendarDays size={15}/></div></div>
  return <div className="mini-window calendar-ui"><div className="calendar-head"><b>April 2026</b><span>‹ &nbsp; ›</span></div><div className="calendar-grid">{'MTWTFSS'.split('').map((d,i)=><small key={i}>{d}</small>)}{Array.from({length:14},(_,i)=><span key={i} className={i===9?'calendar-selected':''}>{i+1}</span>)}</div><div className="calendar-event"><span/> Stripe Interview <b>2:30 PM</b><small>calendar synced</small></div></div>
}

function PixelLandscape({ kind = 'sea' }: {kind?: string}) {
  const [sunBlink, setSunBlink] = useState(false)
  const blinkSun = () => {
    setSunBlink(true)
    window.setTimeout(() => setSunBlink(false), 220)
  }
  return <div className={`pixel-landscape ${kind}`}><span className="pixel-cloud cloud-a"/><span className="pixel-cloud cloud-b"/><span className="pixel-cloud cloud-c"/><span className={`pixel-sun ${sunBlink ? 'sun-blink' : ''}`} onClick={blinkSun} role="button" tabIndex={0} aria-label="Blinking sun"/><span className="pixel-hill hill-a"/><span className="pixel-hill hill-b"/><span className="pixel-water"/><span className="pixel-boat boat-a"/><span className="pixel-boat boat-b"/><span className="pixel-sand"/></div>
}

export default function OutlyLanding() {
  const showcaseRef = useRef<HTMLDivElement>(null)
  const particleCanvasRef = useRef<HTMLCanvasElement>(null)
  const particlePointerRef = useRef({ x: -1000, y: -1000, active: false })
  const [slide, setSlide] = useState(0)
  const [paused, setPaused] = useState(false)
  const [tapePaused, setTapePaused] = useState(false)
  const [menu, setMenu] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [yearly, setYearly] = useState(false)
  const [displayPrice, setDisplayPrice] = useState(99)
  const priceValueRef = useRef(99)
  const [activeNav, setActiveNav] = useState('features')
  useEffect(() => { if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; const timer = window.setInterval(() => setSlide(s => (s + 1) % slides.length), 5000); return () => window.clearInterval(timer) }, [paused])
  useEffect(() => {
    const target = yearly ? 999 : 99
    const start = priceValueRef.current
    const duration = 550
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
  useEffect(() => { const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) setActiveNav(entry.target.id) }), {rootMargin:'-28% 0px -62% 0px'}); document.querySelectorAll('section[id]').forEach(section => observer.observe(section)); return () => observer.disconnect() }, [])
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
          particles.push({x, y, size:.65 + Math.random() * .45})
        }
      }
    }

    const animate = () => {
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
    window.addEventListener('resize', resize)
    frame = window.requestAnimationFrame(animate)
    return () => { window.removeEventListener('resize', resize); window.cancelAnimationFrame(frame) }
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
    {createPortal(<nav className="nav-pill" aria-label="Main navigation"><Brand/><div className="nav-links">{[['features','Overview'],['how-it-works','How it works'],['pricing','Pricing'],['faq','FAQ']].map(([id,label])=><a className={activeNav===id?'active':''} href={`#${id}`} key={id}>{label}</a>)}</div><div className="nav-actions"><a className="nav-signin" href="/login">Sign in</a></div></nav>, document.body)}
    <main id="top" onMouseEnter={()=>{}}>
    <section className="hero" aria-labelledby="hero-title"><div className="hero-badge"><b>Outly</b><span>AI job command center</span></div><h1 id="hero-title">Your job search,<br/><i>one calm place.</i></h1><p className="hero-copy">Find the right roles, tailor your resume, and keep every application moving.<br/>Your whole search, in one calm place.</p><div className="hero-actions"><a className="button button-teal" href="/login">Start your search <ArrowUpRight size={17}/></a><a className="button button-outline" href="#pricing">View pricing</a></div><div className="tool-chips" aria-label="Outly integrations"><div className="tool-chips-track"><div className="tool-chips-set"><b><img className="tool-logo" src={geminiLogo} alt="" />Gemini</b><b><img className="tool-logo gmail-logo" src={gmailLogo} alt="" />Gmail</b><b><img className="tool-logo calendar-logo" src={calendarLogo} alt="" />Calendar</b><b><img className="tool-logo linkedin-logo" src={linkedinLogo} alt="" />LinkedIn</b><b><img className="tool-logo tool-logo-naukri naukri-logo" src={naukriLogo} alt="" />Naukri</b><b><img className="tool-logo wellfound-logo" src={wellfoundLogo} alt="" />Wellfound</b><b><img className="tool-logo workday-logo" src={workdayLogo} alt="" />Workday</b></div><div className="tool-chips-set" aria-hidden="true"><b><img className="tool-logo" src={geminiLogo} alt="" />Gemini</b><b><img className="tool-logo gmail-logo" src={gmailLogo} alt="" />Gmail</b><b><img className="tool-logo calendar-logo" src={calendarLogo} alt="" />Calendar</b><b><img className="tool-logo linkedin-logo" src={linkedinLogo} alt="" />LinkedIn</b><b><img className="tool-logo tool-logo-naukri naukri-logo" src={naukriLogo} alt="" />Naukri</b><b><img className="tool-logo wellfound-logo" src={wellfoundLogo} alt="" />Wellfound</b><b><img className="tool-logo workday-logo" src={workdayLogo} alt="" />Workday</b></div></div></div></section>
    <section className="features-section" id="features"><div className="section-heading"><div><span className="eyebrow">the whole search, together</span><h2>Less searching.<br/><i>More actual work.</i></h2></div><p>From the first job description to the interview invite, Outly helps with the parts that take your time.</p></div><div className="bento-grid">{[
      {title:'Resume ATS score',desc:'A 27-factor score, clear fixes, and a target worth working toward.',type:'score',tag:'know where you stand'},
      {title:'Resume Tailor',desc:'Shape your resume around the role without losing your own voice.',type:'keywords',tag:'make the match clear'},
      {title:'Resume Vault',desc:'Keep your master resume and every tailored version together.',type:'vault',tag:'one source of truth'},
      {title:'AI Job Search',desc:'Find roles that fit your experience and what you want next.',type:'search',tag:'find your next'},
      {title:'Application Tracker',desc:'Move each role from saved to applied, interview, and offer.',type:'board',tag:'keep your place'},
      {title:'Cold Mail Engine',desc:'Find the right recruiter and draft a personal note in your own voice.',type:'mail',tag:'reach out with care'},
    ].map((card,i)=><article className={`feature-card feature-${card.type}`} key={card.title}><div className="feature-visual">{card.type==='search'?<div className="search-visual"><Search/><span>Product designer · remote</span><b>match 94%</b><div className="search-result"><span>Stripe</span><strong>Senior Product Designer</strong><small>Remote · posted 2 days ago</small></div></div>:card.type==='keywords'?<div className="keyword-ui"><div className="mini-top">keyword gap <b>3 to add</b></div>{[['product strategy',true],['design systems',true],['experimentation',false],['stakeholder work',true]].map(([w,ok])=><div className="keyword-row" key={String(w)}><span className={ok?'keyword-ok':''}>{ok?'✓':'+'}</span>{w}</div>)}</div>:card.type==='privacy'?<div className="privacy-visual"><ShieldCheck size={28}/><b>your resume, your rules.</b><span>stored privately · never sold</span><div className="privacy-line"><i/> training use <b>off</b></div></div>:<MiniWindow type={card.type}/>}</div><div className="feature-copy"><span className="eyebrow">{card.tag}</span><h3>{card.title}</h3><p>{card.desc}</p></div></article>)}</div></section>
    <section className="steps-section" id="how-it-works"><div className="section-heading"><div><span className="eyebrow">no elaborate setup</span><h2>From upload to a<br/><i>better next step.</i></h2></div><p>A clear start, then one good move at a time. Most people are ready in about two minutes.</p></div><div className="steps-grid">{[['01','Upload your master resume','Outly takes it from there. Keep your original close.','resume'],['02','Find a role worth your time','Paste a description or discover a match.','search'],['03','Make your application fit','Get a tailored resume and the ATS score to improve it.','tailor'],['04','Reach out and track it','Review the note, send when ready, and track the reply.','send']].map(([num,title,desc,icon],i)=><article className={`step-card step-${i+1}`} key={num}><div className="step-illustration">{icon==='resume'?<FileText/>:icon==='search'?<Search/>:icon==='tailor'?<Target/>:<Send/>}</div><h3>{title}</h3><p>{desc}</p><div className="pixel-stair"/></article>)}</div></section>
    <section className="ats-marquee" aria-label="Supported applicant tracking systems"><div className="marquee-band"><div className={`marquee-track ${tapePaused?'marquee-paused':''}`}>{[0,1].map(n=><span className="marquee-set" key={n}>{['Workday','Greenhouse','Lever','Taleo','iCIMS','SmartRecruiters'].map(x=><b key={x}><i/> {x}</b>)}</span>)}</div><button onClick={()=>setTapePaused(!tapePaused)} className="tape-pause">{tapePaused?'play':'pause'} the tape</button></div><div className="marquee-copy"><div><span className="eyebrow">made for the systems behind the job</span><p>Read the role where it lives. Bring it to Outly. Keep the parts that matter together.</p></div><div><b>Clear fit</b><span>Translate role requirements into a score you can act on.</span></div><div><b>Your call</b><span>You review every change and every message before it goes anywhere.</span></div></div></section>
    <section className="plan-section"><div className="plan-scene"><PixelLandscape/><div className="plan-float"><span className="eyebrow">one role at a time</span><h2>Give every<br/>application <i>its own plan.</i></h2><div className="plan-list">{[['research the role','Know what the team needs.'],['tailor the resume','Show the experience that fits.'],['score the match','See the gaps, not guess.'],['draft the outreach','Reach out like yourself.'],['track the reply','Keep the next step in view.'],['prep the interview','Walk in with a plan.']].map(([a,b],i)=><div key={a}><b>{a}<small>{b}</small></b></div>)}</div><a className="button button-dark" href="/login">Get started, it&apos;s free <ArrowUpRight size={16}/></a></div><div className="scene-note">a little structure goes a long way <ArrowDownRight size={15}/></div></div></section>
    <section className="trust-section"><div className="section-heading"><div><span className="eyebrow">your work, your rules</span><h2>Where your data<br/><i>lives with you.</i></h2></div><p>A job search is personal. Outly is built to treat it that way, from the first upload to the last follow-up.</p></div><div className="trust-grid"><article><PixelLandscape kind="local-scene"/><span className="eyebrow">your documents</span><h3>Stored for your search</h3><p>Your master resume and tailored versions stay in your private Outly account, ready when you need them.</p></article><article><PixelLandscape kind="cloud-scene"/><span className="eyebrow">your choice</span><h3>Private cloud</h3><p>Your search stays accessible without turning your personal documents into public information.</p></article><article><PixelLandscape kind="quiet-scene"/><span className="eyebrow">always yours</span><h3>Never used for training</h3><p>We do not sell your information or use your resume to train external models. Your next move is yours.</p></article></div></section>
    <section className="pricing-section" id="pricing"><div className="pricing-glow"/><div className="pricing-header"><div><span className="eyebrow">room to grow, never pressure</span><h2>Start free.<br/><i>Upgrade when you need more room.</i></h2></div><div className="billing-toggle"><span className={`billing-slider ${yearly?'billing-slider-yearly':''}`} aria-hidden="true"/><button className={`billing-monthly ${!yearly?'billing-active':''}`} onClick={()=>setYearly(false)}>Monthly</button><button className={`billing-yearly ${yearly?'billing-active':''}`} onClick={()=>setYearly(true)}>Yearly <span>save 20%</span></button></div></div><div className="pricing-grid"><article className="price-card free-card"><div className="pricing-cat"><img src={pricingCatImage} alt="" /><span>z</span><span>z</span></div><img className="pricing-art" src={pricingSeaImage} alt="" /><div className="price-content"><h3>Free</h3><p>Everything you need to get moving.</p><div className="price"><b>₹0</b><span>forever</span></div><ul>{['3 ATS checks every 12 hours','Resume Vault','AI job search','Application tracker board','Cold-mail generator'].map(x=><li key={x}><Check size={15}/>{x}</li>)}<li className="unavailable"><X size={15}/>Unlimited tailoring</li></ul><a className="button button-white" href="/login">Get started <ArrowUpRight size={16}/></a></div></article><article className="price-card pro-card"><img className="pricing-art" src={pricingFieldImage} alt="" /><div className="price-content"><div className="pro-label">best for active job seekers</div><h3>Pro</h3><p>More room for every application.</p><div className="price"><b>₹{displayPrice}</b><span>{yearly?'/ year':'/ month'}</span></div><ul>{['Unlimited ATS checks · 27-factor score','Unlimited resume tailoring','Deep keyword-gap insights','Unlimited Resume Vault & tracking','Full cold-mail automation'].map(x=><li key={x}><Check size={15}/>{x}</li>)}</ul><a className="button button-teal" href="/login">Try now <ArrowUpRight size={16}/></a><a className="buy-link" href="/pricing">or buy now</a></div></article></div><p className="pricing-note"><ShieldCheck size={14}/> your data stays yours on every plan. no pressure, cancel anytime.</p></section>
    <section className="faq-section" id="faq"><h2 className="faq-title">FAQ</h2><div className="faq-list">{faq.map(([q,a],i)=><article className={`faq-item ${openFaq===i?'faq-open':''}`} key={q}><button aria-expanded={openFaq===i} onClick={()=>setOpenFaq(openFaq===i?null:i)}><span>{q}</span><span className="faq-plus"><ChevronRight size={15}/></span></button><div className="faq-answer"><p>{a}</p></div></article>)}</div></section>
    <section className="closing"><div className="closing-pixels"/><span className="eyebrow">a fresh start looks good on you</span><h2>Meet your next<br/><i>good thing.</i></h2><p>It could be working in two minutes.<br/>Free to start. Yours to steer.</p><div className="closing-actions"><a className="button button-dark" href="/login">Get started, it&apos;s free <ArrowUpRight size={16}/></a><a className="button button-white" href="/login">Sign in</a></div><PixelLandscape kind="closing-sea"/></section>
    <footer className="footer"><div className="footer-main"><div className="footer-brand"><Brand/><p>Make room for the work<br/>that gets you there.</p></div>{[['product','Features','How it works','Pricing','Sign in'],['learn','Getting started','ATS scoring','Resume Vault','Privacy'],['company','About Outly','Contact','Updates','Careers'],['legal','Privacy policy','Terms','Security','Cookies']].map(col=><div className="footer-col" key={col[0]}><span>{col[0]}</span>{col.slice(1).map(item=><a key={item} href={item==='Pricing'?'#pricing':item==='Features'?'#features':item==='How it works'?'#how-it-works':item==='Sign in'?'/login':'#faq'}>{item}</a>)}</div>)}</div><div className="footer-bottom"><span>© 2026 Outly. Made with care.</span><span>the jobs and messages shown here are samples.</span><a href="#top">back to top ↑</a></div></footer>
    </main>
  </>
}


