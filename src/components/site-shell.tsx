import Link from "next/link";
import { ArrowUpRight, Menu, Milk } from "lucide-react";

const navigation = [
  { label: "Courses", href: "/courses" },
  { label: "Solved PYQs", href: "/pyq" },
  { label: "Question bank", href: "/question-bank" },
  { label: "Mock tests", href: "/mock-tests" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner page-width">
        <Link aria-label="Dairy Learning Academy home" className="brand" href="/">
          <span className="brand-mark"><Milk size={20} strokeWidth={1.8} /></span>
          <span className="brand-name">Dairy Learning <b>Academy</b></span>
        </Link>
        <nav aria-label="Main navigation" className="desktop-nav">
          {navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
        <div className="header-actions">
          <Link className="login-link" href="/login">Log in</Link>
          <Link className="button button-small button-dark" href="/courses">Get started <ArrowUpRight size={15} /></Link>
        </div>
        <details className="mobile-menu">
          <summary aria-label="Open navigation"><Menu size={21} /></summary>
          <nav aria-label="Mobile navigation">
            {navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
            <Link href="/login">Student login</Link>
            <Link href="/admin/login">Admin login</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-width footer-main">
        <div className="footer-brand-block">
          <Link aria-label="Dairy Learning Academy home" className="brand brand-footer" href="/">
            <span className="brand-mark"><Milk size={19} strokeWidth={1.8} /></span>
            <span className="brand-name">Dairy Learning <b>Academy</b></span>
          </Link>
          <p>Focused learning for the next generation of dairy professionals.</p>
        </div>
        <div className="footer-links">
          <div><h2>Explore</h2><Link href="/courses">Courses</Link><Link href="/pyq">Solved PYQs</Link><Link href="/mock-tests">Mock tests</Link></div>
          <div><h2>Academy</h2><Link href="/about">About us</Link><Link href="/contact">Contact</Link><Link href="/login">Student login</Link></div>
          <div><h2>Account</h2><Link href="/dashboard">Student dashboard</Link><Link href="/admin/login">Admin access</Link></div>
        </div>
      </div>
      <div className="page-width footer-bottom"><span>© {new Date().getFullYear()} Dairy Learning Academy</span><span>Learn. Practice. Evaluate. Excel.</span></div>
    </footer>
  );
}