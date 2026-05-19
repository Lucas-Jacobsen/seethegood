import { useEffect, useState } from 'react';
import './App.css';
import bannerImage from './assets/SeeTheGoodBanner.png';
import scrollImage from './assets/SeeTheGoodScroll.png';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

const features = [
  { title: 'Uplifting', description: 'Good stories' },
  { title: 'Meaningful', description: 'Real impact' },
  { title: 'Feel-Good', description: 'Positivity, always' },
];

function LogoMark({ className = '' }) {
  return (
    <svg className={`logo-mark ${className}`} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M14 40c3.2-9.5 11.2-16 18-16s14.8 6.5 18 16" />
      <path d="M8 44h48" />
      <path d="M32 10v7" />
      <path d="M13.5 18.5l5 5" />
      <path d="M50.5 18.5l-5 5" />
      <path d="M5 32h8" />
      <path d="M51 32h8" />
    </svg>
  );
}

function getIssueLabel(issue) {
  if (issue.issueNumber) {
    return `Issue ${issue.issueNumber}`;
  }

  return 'Issue';
}

function renderMarkdown(markdown) {
  if (!markdown) {
    return null;
  }

  return markdown
    .split('\n')
    .filter((line) => line.trim())
    .map((line, index) => {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('# ')) {
        return <h3 key={index}>{trimmedLine.replace('# ', '')}</h3>;
      }

      if (trimmedLine.startsWith('## ')) {
        return <h4 key={index}>{trimmedLine.replace('## ', '')}</h4>;
      }

      const imageMatch = trimmedLine.match(/^!\[(.*?)\]\((.*?)\)$/);

      if (imageMatch) {
        const [, altText, imageUrl] = imageMatch;

        return (
          <img
            className="issue-reader-image"
            key={index}
            src={imageUrl}
            alt={altText || 'Newsletter image'}
            loading="lazy"
          />
        );
      }

      return <p key={index}>{trimmedLine}</p>;
    });
}

function App() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [issuesError, setIssuesError] = useState('');

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedIssueLoading, setSelectedIssueLoading] = useState(false);
  const [selectedIssueError, setSelectedIssueError] = useState('');

  const displayedIssues = issues.slice(0, 2);

  useEffect(() => {
    let frameId = null;

    const updateScrollAnimation = () => {
      const scrollOffset = Math.round(window.scrollY * 0.18);
      document.documentElement.style.setProperty('--scroll-offset', `${scrollOffset}px`);
      frameId = null;
    };

    const handleScroll = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(updateScrollAnimation);
      }
    };

    updateScrollAnimation();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchIssues = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/issues`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Could not load issues.');
        }

        if (isMounted) {
          setIssues(Array.isArray(data.issues) ? data.issues : []);
          setIssuesError('');
        }
      } catch (error) {
        if (isMounted) {
          setIssuesError('Could not load issues.');
        }
      } finally {
        if (isMounted) {
          setIssuesLoading(false);
        }
      }
    };

    fetchIssues();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleIssueOpen = async (slug) => {
    setSelectedIssueLoading(true);
    setSelectedIssueError('');
    setSelectedIssue(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/issues/${slug}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not load issue.');
      }

      setSelectedIssue(data.issue);

      setTimeout(() => {
        document.getElementById('issue-reader')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 50);
    } catch (error) {
      setSelectedIssueError('Could not load this issue.');
    } finally {
      setSelectedIssueLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setSubmitted(false);
      setFormMessage('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    setFormMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitted(false);
        setFormMessage(data.message || 'Something went wrong. Please try again.');
        return;
      }

      setSubmitted(true);
      setFormMessage(data.message || 'You’re on the list. More good is coming.');
      setEmail('');
    } catch (error) {
      setSubmitted(false);
      setFormMessage('Could not connect to the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="site-shell">
      <header className="site-header" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="See the Good home">
          <LogoMark />
          <span>See the Good</span>
        </a>

        <nav className="nav-links" aria-label="Site links">
          <a href="#issues">Issues</a>
          <a href="#about">About</a>
          <a href="#archive">Archive</a>
          <a className="nav-button" href="#subscribe">Subscribe</a>
        </nav>
      </header>

      <section className="hero-section" id="top">
        <div className="hero-copy">
          <p className="eyebrow">A positivity newsletter, delivered weekly.</p>

          <h1>
            A little more <span>good.</span>
          </h1>

          <p className="hero-summary">
            Good news, thoughtful stories, and small reminders to notice what is going right.
          </p>

          <form className="signup-form hero-form" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="hero-email">
              Email address
            </label>

            <input
              id="hero-email"
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing up...' : 'Sign up'}
            </button>
          </form>

          <p className="privacy-note">No spam. Unsubscribe anytime.</p>

          {formMessage && (
            <p className={submitted ? 'success-message' : 'error-message'}>
              {formMessage}
            </p>
          )}
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="hero-sun" />
          <div className="hero-cloud hero-cloud-one" />
          <div className="hero-cloud hero-cloud-two" />
          <div className="hero-hill hero-hill-back" />
          <div className="hero-hill hero-hill-front" />
          <div className="hero-path" />
          <div className="hero-leaf hero-leaf-one" />
          <div className="hero-leaf hero-leaf-two" />
          <div className="hero-flower hero-flower-one" />
          <div className="hero-flower hero-flower-two" />
        </div>
      </section>

      <section className="feature-row" id="about" aria-label="Newsletter benefits">
        {features.map((feature) => (
          <article className="feature-card" key={feature.title}>
            <div className="feature-icon" aria-hidden="true">
              {feature.title === 'Uplifting' && <span>☀</span>}
              {feature.title === 'Meaningful' && <span>♥</span>}
              {feature.title === 'Feel-Good' && <span>☕</span>}
            </div>

            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="scroll-story" aria-label="See the Good scroll animation">
        <p>Good is worth noticing.</p>

        <div
          className="scroll-mask"
          style={{ backgroundImage: `url(${scrollImage})` }}
        >
          See the Good
        </div>
      </section>

      <section className="issue-section" id="issues" aria-label="Recent issues">
        {issuesLoading && (
          <article className="issue-card">
            <div
              className="issue-image"
              style={{ backgroundImage: `url(${bannerImage})` }}
              aria-hidden="true"
            />

            <div>
              <p>Loading</p>
              <h2>Finding Good</h2>
              <span>Loading recent issues...</span>
            </div>

            <button className="issue-link" type="button" disabled aria-label="Loading issues">
              →
            </button>
          </article>
        )}

        {!issuesLoading && issuesError && (
          <article className="issue-card">
            <div
              className="issue-image"
              style={{ backgroundImage: `url(${bannerImage})` }}
              aria-hidden="true"
            />

            <div>
              <p>Issues</p>
              <h2>Try Again Soon</h2>
              <span>{issuesError}</span>
            </div>

            <button className="issue-link" type="button" disabled aria-label="Issues unavailable">
              →
            </button>
          </article>
        )}

        {!issuesLoading && !issuesError && issues.length === 0 && (
          <article className="issue-card">
            <div
              className="issue-image"
              style={{ backgroundImage: `url(${bannerImage})` }}
              aria-hidden="true"
            />

            <div>
              <p>Coming Soon</p>
              <h2>First Issue</h2>
              <span>The first See the Good issue is on the way.</span>
            </div>

            <a href="#subscribe" aria-label="Subscribe for the first issue">
              →
            </a>
          </article>
        )}

        {!issuesLoading && !issuesError && displayedIssues.map((issue) => (
          <article className="issue-card" key={issue.id || issue.slug}>
            <div
              className="issue-image"
              style={{ backgroundImage: `url(${issue.coverImageUrl || bannerImage})` }}
              aria-hidden="true"
            />

            <div>
              <p>{getIssueLabel(issue)}</p>
              <h2>{issue.title}</h2>
              <span>{issue.excerpt}</span>
            </div>

            <button
              className="issue-link"
              type="button"
              onClick={() => handleIssueOpen(issue.slug)}
              aria-label={`Read ${issue.title}`}
            >
              →
            </button>
          </article>
        ))}
      </section>

      <section className="issue-reader" id="issue-reader" aria-live="polite">
        {selectedIssueLoading && (
          <p className="issue-reader-status">Loading issue...</p>
        )}

        {selectedIssueError && (
          <p className="error-message">{selectedIssueError}</p>
        )}

       {selectedIssue && (
  <article className="issue-reader-card">
    <p className="issue-reader-label">
      {getIssueLabel(selectedIssue)}
    </p>

    <h2>{selectedIssue.title}</h2>

    <p className="issue-reader-excerpt">{selectedIssue.excerpt}</p>

    <div className="issue-reader-body">
      {renderMarkdown(selectedIssue.bodyMarkdown)}
    </div>
  </article>
)}
      </section>

      <section className="closing-cta" id="subscribe">
        <div>
          <LogoMark className="small-logo" />
          <h2>Let’s see more good.</h2>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="footer-email">
            Email address
          </label>

          <input
            id="footer-email"
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
      </section>

      <footer className="site-footer" id="archive">
        <a className="brand footer-brand" href="#top" aria-label="See the Good home">
          <LogoMark />
          <span>See the Good</span>
        </a>

        <p>© 2026 See the Good</p>

        <nav aria-label="Footer links">
          <a href="#subscribe">Privacy</a>
          <a href="#subscribe">Terms</a>
          <a href="#subscribe">Contact</a>
        </nav>
      </footer>
    </main>
  );
}

export default App;