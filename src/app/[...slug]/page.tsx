import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, CircleHelp, FileLock2 } from "lucide-react";
import { AuthForm, PasswordUpdateForm } from "@/components/auth-form";
import { getDashboard } from "@/backend/services/dashboard-service";

const pages: Record<string, { title: string; description: string; eyebrow: string; points: string[]; action?: { label: string; href: string } }> = {
  courses: { title: "Courses and preparation", eyebrow: "Build your foundation", description: "Explore structured learning for Dairy Science and Dairy Technology. Course content and access are managed by the academy.", points: ["Dairy Microbiology", "Dairy Chemistry", "Dairy Engineering", "Dairy Technology", "Dairy Processing"], action: { label: "Student sign in", href: "/login" } },
  pyq: { title: "Solved previous year questions", eyebrow: "Learn from the exam", description: "Browse examination questions by year, subject and topic. Explanations help connect the correct answer to the underlying concept.", points: ["Filter by examination and year", "Browse subject-wise questions", "Reveal answers and explanations", "Save important questions"], action: { label: "Access your learning", href: "/login" } },
  "question-bank": { title: "Chapter-wise MCQ question bank", eyebrow: "Practice with purpose", description: "Move from subject to chapter to topic. Choose a learning flow for immediate explanations or a practice flow for a review at the end.", points: ["Learning and practice modes", "Topic and difficulty filters", "Bookmarks and retry incorrect answers", "Chapter notes and key facts"], action: { label: "Student sign in", href: "/login" } },
  package: { title: "Combined preparation package", eyebrow: "A complete study path", description: "Bring solved papers, chapter-wise questions, revision material and full-length mock tests into one preparation plan.", points: ["Solved previous year questions", "Chapter-wise question bank", "Revision notes", "Full-length mock tests"], action: { label: "View your account", href: "/login" } },
  "mock-tests": { title: "Online mock test series", eyebrow: "Evaluate your preparation", description: "Practise with timed examinations, review your responses and track performance. Test scoring must be validated by the server.", points: ["Timed exam interface", "Question palette and review markers", "Automatic submission at time limit", "Detailed score and answer review"], action: { label: "Student sign in", href: "/login" } },
  about: { title: "About the academy", eyebrow: "Specialist learning", description: "Dairy Learning Academy is focused on helping learners build knowledge and exam readiness across Dairy Science and Dairy Technology.", points: ["Subject-focused learning", "Concepts connected to practice", "Preparation designed for varied devices"] },
  contact: { title: "Contact the academy", eyebrow: "We are here to help", description: "For enrolment, access or course questions, contact details can be configured by the academy owner in the deployment settings.", points: ["Course and package enquiries", "Student account support", "Payment and access assistance"] },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const route = slug.join("/");
  if (route === "login") return { title: "Student login" };
  if (route === "admin/login") return { title: "Admin login" };
  if (route === "reset-password") return { title: "Reset password" };
  if (route === "admin") return { title: "Admin dashboard" };
  if (route === "dashboard") return { title: "Student dashboard" };
  return { title: pages[route]?.title ?? "Academy" };
}

export default async function RoutedPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const route = slug.join("/");

  if (route === "login") return <PortalFrame title="Your learning starts here" eyebrow="Student account" description="Sign in to reach your courses, saved questions and learning progress."><AuthForm /></PortalFrame>;
  if (route === "admin/login") return <PortalFrame title="A private workspace for academy administrators" eyebrow="Admin access" description="Administrator permissions are verified against the account role on the server."><AuthForm admin /></PortalFrame>;
  if (route === "reset-password") return <PortalFrame title="Recover your account" eyebrow="Password reset" description="Follow the secure recovery link sent to your email, then choose a new password."><PasswordUpdateForm /></PortalFrame>;
  if (route === "admin") return <ProtectedNotice admin />;
  if (route === "dashboard") return <ProtectedNotice />;

  const page = pages[route];
  if (!page) notFound();

  return (
    <PortalFrame title={page.title} eyebrow={page.eyebrow} description={page.description}>
      <div className="portal-content">
        <div className="setup-notice"><FileLock2 size={18} /><span>Learning content and access are served from the configured academy database. No sample student data, questions, prices or payment outcomes are being presented as real.</span></div>
        <ul className="portal-list">{page.points.map((point) => <li key={point}><Check size={17} />{point}</li>)}</ul>
        {page.action && <div className="portal-actions"><Link className="button button-dark" href={page.action.href}>{page.action.label} <ArrowRight size={16} /></Link><Link className="button button-outline" href="/contact">Contact <CircleHelp size={16} /></Link></div>}
      </div>
    </PortalFrame>
  );
}

function PortalFrame({ title, eyebrow, description, children }: { title: string; eyebrow: string; description: string; children: React.ReactNode }) {
  return <section className="portal-page"><div className="page-width"><div className="portal-heading"><span className="section-kicker">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{children}</div></section>;
}

async function ProtectedNotice({ admin = false }: { admin?: boolean }) {
  const { redirect } = await import("next/navigation");
  const dashboard = await getDashboard(admin);
  if (dashboard.status === "unconfigured") return <PortalFrame title={admin ? "Admin workspace" : "Your learning dashboard"} eyebrow="Service setup required" description="Supabase must be configured before this protected workspace can load."><SetupNotice /></PortalFrame>;
  if (dashboard.status === "unauthenticated") redirect(admin ? "/admin/login" : "/login");
  if (dashboard.status === "forbidden") {
    return <PortalFrame title="Administrator access required" eyebrow="Restricted area" description="This account does not have administrator privileges. Admin access is granted by the owner and cannot be self-selected."><div className="portal-actions"><Link className="button button-dark" href="/dashboard">Go to student dashboard <ArrowRight size={16} /></Link></div></PortalFrame>;
  }

  if (admin) {
    return <PortalFrame title="Academy overview" eyebrow="Admin dashboard" description={`Signed in as ${dashboard.email ?? "academy administrator"}. All figures are queried from the configured database.`}><div className="admin-counts">{dashboard.metrics.map((metric) => <div className="admin-count" key={metric.label}><span>{metric.count ?? "—"}</span><p>{metric.label}</p></div>)}</div><div className="setup-notice admin-note"><FileLock2 size={18} /><span>Management screens for courses, materials, question authoring, tests, students and transactions are the next build stage. The database enforces admin-only writes.</span></div></PortalFrame>;
  }

  return <PortalFrame title={`Welcome${dashboard.fullName ? `, ${dashboard.fullName}` : " back"}`} eyebrow="Student dashboard" description="Your learning and account activity will appear here as you enrol and practise."><div className="admin-counts student-counts">{dashboard.metrics.map((metric) => <div className="admin-count" key={metric.label}><span>{metric.count ?? "—"}</span><p>{metric.label}</p></div>)}</div><div className="portal-actions"><Link className="button button-dark" href="/courses">Explore courses <ArrowRight size={16} /></Link><form action="/api/auth/signout" method="post"><button className="button button-outline" type="submit">Sign out</button></form></div></PortalFrame>;
}

function SetupNotice() {
  return <div className="setup-notice"><FileLock2 size={18} /><span>Set the Supabase project URL and publishable key, apply the database migration and restart the app. Protected content will remain inaccessible until the server can authorize the request.</span></div>;
}