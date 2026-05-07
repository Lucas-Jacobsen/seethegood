import { useEffect, useState } from 'react';
import './App.css';
import bannerImage from './assets/SeeTheGoodBanner.png';
import scrollImage from './assets/SeeTheGoodScroll.png';

const features = [
  { title: 'Uplifting', description: 'Good stories' },
  { title: 'Meaningful', description: 'Real impact' },
  { title: 'Feel-Good', description: 'Positivity, always' },
];

const issueCards = [
  { issue: 'Issue 52', title: 'Small Wins', label: 'This week' },
  { issue: 'Issue 51', title: 'Notice More', label: 'Past issue' },
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

function App() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!email.trim()) {
      return;
    }

    setSubmitted(true);
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
            <label className="sr-only" htmlFor="hero-email">Email address</label>
            <input
              id="hero-email"
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <button type="submit">Sign up</button>
          </form>

          <p className="privacy-note">No spam. Unsubscribe anytime.</p>
          {submitted && <p className="success-message">You’re on the list. More good is coming.</p>}
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
        {issueCards.map((card) => (
          <article className="issue-card" key={card.issue}>
            <div
              className="issue-image"
              style={{ backgroundImage: `url(${bannerImage})` }}
              aria-hidden="true"
            />
            <div>
              <p>{card.issue}</p>
              <h2>{card.title}</h2>
              <span>{card.label}</span>
            </div>
            <a href="#archive" aria-label={`${card.title} issue`}>→</a>
          </article>
        ))}
      </section>

      <section className="closing-cta" id="subscribe">
        <div>
          <LogoMark className="small-logo" />
          <h2>Let’s see more good.</h2>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="footer-email">Email address</label>
          <input
            id="footer-email"
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <button type="submit">Subscribe</button>
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
