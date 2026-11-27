import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  Check,
  ClipboardCheck,
  FileText,
  FlaskConical,
  GraduationCap,
  Layers3,
  Microscope,
  Sparkles,
  Timer,
} from "lucide-react";

const resources = [
  {
    icon: FileText,
    number: "01 / PYQ LIBRARY",
    title: "Solved previous year questions",
    description: "Work through exam questions with accurate answers, explanations and the concepts behind them.",
    href: "/pyq",
  },
  {
    icon: BookOpenCheck,
    number: "02 / QUESTION BANK",
    title: "Chapter-wise MCQ practice",
    description: "Build understanding topic by topic, with revision notes and guided practice modes.",
    href: "/question-bank",
  },
  {
    icon: Layers3,
    number: "03 / PREPARATION",
    title: "Combined preparation package",
    description: "Bring question practice, solved papers, revision resources and mock tests together.",
    href: "/package",
  },
  {
    icon: Timer,
    number: "04 / TEST SERIES",
    title: "Full-length mock tests",
    description: "Practise to a clock, review your answers and understand where to focus next.",
    href: "/mock-tests",
  },
];

const subjects = ["Dairy Microbiology", "Dairy Chemistry", "Dairy Engineering", "Dairy Technology", "Dairy Processing"];

const benefits = [
  "Subject-focused learning paths",
  "Practice with clear explanations",
  "Progress kept in one place",
  "Designed for phone and desktop",
];

const steps = [
  { number: "01", title: "Choose your path", body: "Explore a subject, prepare with solved papers or start a structured package." },
  { number: "02", title: "Learn and practise", body: "Study focused material, then apply what you know with guided question practice." },
  { number: "03", title: "Evaluate and improve", body: "Use mock tests and review tools to identify what deserves your attention next." },
];

const faqs = [
  { question: "Who is Dairy Learning Academy for?", answer: "The academy is designed for learners preparing in Dairy Science and Dairy Technology, including students working toward competitive examinations." },
  { question: "Can I study on my phone?", answer: "Yes. The website is designed to adapt to phones, tablets and desktop screens. An installable app experience is also included where the browser supports it." },
  { question: "How do paid materials become available?", answer: "Access is granted only after a payment is verified by the server. Course pricing, checkout and protected content access remain unavailable until the academy's service credentials are configured." },
  { question: "Can I preview questions before purchasing?", answer: "Public sample content can be made available by the academy. Paid question sets and documents are kept behind account and enrollment checks." },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <img
          className="hero-photo"
          src="https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=2200&q=85"
          alt="Dairy cows in a green pasture"
          fetchPriority="high"
        />
        <div className="hero-shade" />
        <div className="page-width hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">A focused learning platform</span>
            <h1>DAIRY LEARNING <span>ACADEMY</span></h1>
            <p>Learn. Practice. Evaluate. Excel. A specialist learning platform for Dairy Science and Dairy Technology aspirants.</p>
            <div className="hero-actions">
              <Link className="button button-green" href="/courses">Explore courses <ArrowUpRight size={17} /></Link>
              <Link className="button button-light" href="/question-bank">Start preparing <ArrowRight size={16} /></Link>
            </div>
            <div className="hero-note"><span className="note-rule" />Built around the subjects you are preparing for</div>
          </div>
          <div aria-hidden="true" className="hero-stamp"><Sparkles size={16} /><span>Learn with purpose</span></div>
        </div>
      </section>

      <section className="section section-white" id="resources">
        <div className="page-width">
          <div className="section-head">
            <div><span className="section-kicker">Your preparation, organised</span><h2>Everything you need<br />to move forward.</h2></div>
            <p>From the first concept to a full-length test, build a study routine that works for you.</p>
          </div>
          <div className="resource-grid">
            {resources.map(({ icon: Icon, number, title, description, href }) => (
              <article className="resource-card" key={number}>
                <span className="resource-icon"><Icon size={20} strokeWidth={1.8} /></span>
                <span className="resource-number">{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <Link className="text-link" href={href}>Explore <ArrowRight size={15} /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-width why-section">
          <div className="why-copy">
            <span className="section-kicker">Why the academy</span>
            <h2>Specialist subjects.<br />A clearer way to prepare.</h2>
            <p>Dairy Science deserves learning resources built for its breadth. Keep concepts, practice and evaluation connected as you prepare.</p>
            <ul className="benefit-list">
              {benefits.map((benefit) => <li key={benefit}><Check size={17} />{benefit}</li>)}
            </ul>
          </div>
          <div aria-label="Learning approach highlights" className="stat-panel">
            <div className="stat-cell"><span>01</span><p>Subject-first learning structure</p></div>
            <div className="stat-cell"><span>02</span><p>Learn, practise and evaluate</p></div>
            <div className="stat-cell"><span>03</span><p>Study material in one place</p></div>
            <div className="stat-cell"><span>04</span><p>Your progress, at your pace</p></div>
          </div>
        </div>
      </section>

      <section className="section process-section">
        <div className="page-width">
          <div className="section-head">
            <div><span className="section-kicker">A simple study rhythm</span><h2>Make each session count.</h2></div>
            <p>Keep your preparation moving with clear next steps and useful feedback.</p>
          </div>
          <div className="process-grid">
            {steps.map((step) => <article className="process-step" key={step.number}><span className="step-number">{step.number}</span><h3>{step.title}</h3><p>{step.body}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section section-white">
        <div className="page-width">
          <div className="section-head">
            <div><span className="section-kicker">Explore the discipline</span><h2>Subjects for a stronger foundation.</h2></div>
            <Link className="text-link" href="/courses">View courses <ArrowRight size={15} /></Link>
          </div>
          <div className="subject-grid">
            {subjects.map((subject, index) => <Link className="subject" href={`/courses?subject=${encodeURIComponent(subject)}`} key={subject}><span>{subject}</span>{index === 0 ? <Microscope size={18} /> : index === 1 ? <FlaskConical size={18} /> : index === 2 ? <Layers3 size={18} /> : index === 3 ? <GraduationCap size={18} /> : <ClipboardCheck size={18} />}</Link>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-width">
          <div className="section-head">
            <div><span className="section-kicker">Questions, answered</span><h2>A few useful details.</h2></div>
            <Link className="text-link" href="/contact">Ask us a question <ArrowRight size={15} /></Link>
          </div>
          <div className="faq-list">
            {faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}
          </div>
        </div>
      </section>

      <section className="section section-white">
        <div className="page-width">
          <div className="contact-band">
            <div><span className="section-kicker">Your next step starts here</span><h2>Make your preparation more deliberate.</h2></div>
            <Link className="button button-light" href="/courses">Explore the academy <ArrowDownRight size={17} /></Link>
          </div>
        </div>
      </section>
    </>
  );
}