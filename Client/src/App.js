import { useEffect, useState } from 'react';
import './App.css';
import bannerImage from './assets/SeeTheGoodBanner.png';
import scrollImage from './assets/SeeTheGoodScroll.png';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';


const staticPages = {
  '#/privacy': {
    eyebrow: 'Privacy',
    title: 'Privacy Policy',
    description: 'A placeholder privacy policy for See the Good.',
    sections: [
      {
        heading: 'Overview',
        body: 'This page will explain what information See the Good collects, how it is used, and how subscribers can manage their information.',
      },
      {
        heading: 'Email subscriptions',
        body: 'This section will describe how email addresses are stored and used for newsletter delivery.',
      },
      {
        heading: 'Your choices',
        body: 'This section will explain how subscribers can unsubscribe or contact See the Good with privacy questions.',
      },
    ],
  },
  '#/terms': {
    eyebrow: 'Terms',
    title: 'Terms of Use',
    description: 'A placeholder terms page for See the Good.',
    sections: [
      {
        heading: 'Use of the site',
        body: 'This section will describe the basic terms for using the See the Good website and newsletter.',
      },
      {
        heading: 'Content',
        body: 'This section will explain ownership, permitted use, and any limitations around newsletter content.',
      },
      {
        heading: 'Changes',
        body: 'This section will explain that these terms may be updated as the project grows.',
      },
    ],
  },
  '#/contact': {
    eyebrow: 'Contact',
    title: 'Contact',
    description: 'A placeholder contact page for See the Good.',
    sections: [
      {
        heading: 'General contact',
        body: 'This section can include your preferred contact email or a future contact form.',
      },
      {
        heading: 'Story ideas',
        body: 'This section can explain how readers can send positive stories, links, or recommendations for future issues.',
      },
      {
        heading: 'Partnerships',
        body: 'This section can be used later for collaborations, sponsorships, or media inquiries.',
      },
    ],
  },
};

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

function StaticPage({ page }) {
  return (
    <section className="static-page">
      <div className="static-card">
        <p className="eyebrow">{page.eyebrow}</p>
        <h1>{page.title}</h1>
        <p className="static-description">{page.description}</p>

        <div className="static-sections">
          {page.sections.map((section) => (
            <section className="static-section" key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdminPage({ nextIssueNumber }) {
  const [adminKey, setAdminKey] = useState('');
  const [selectedIssueId, setSelectedIssueId] = useState('');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [issueNumber, setIssueNumber] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [bodyHtml, setBodyHtml] = useState('');

  const [drafts, setDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [issueListLabel, setIssueListLabel] = useState('Drafts');

  const [adminMessage, setAdminMessage] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isSavingIssue, setIsSavingIssue] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [isSendingSubscribers, setIsSendingSubscribers] = useState(false);



  const isEditing = Boolean(selectedIssueId);

  useEffect(() => {
    if (!issueNumber && nextIssueNumber && !isEditing) {
      setIssueNumber(String(nextIssueNumber));
    }
  }, [nextIssueNumber, issueNumber, isEditing]);

  const resetForm = () => {
    setSelectedIssueId('');
    setTitle('');
    setSlug('');
    setIssueNumber(nextIssueNumber ? String(nextIssueNumber) : '');
    setExcerpt('');
    setCoverImageUrl('');
    setStatus('DRAFT');
    setBodyHtml('');
    setAdminMessage('');
    setAdminError('');
    setShowPreview(false);
  };

 const getIssueStatusLabel = (issueStatus) => {
  if (issueStatus === 'PUBLISHED') {
    return 'Published Issues';
  }

  if (issueStatus === 'SENT') {
    return 'Sent Issues';
  }

  return 'Drafts';
};

const loadAdminIssues = async (issueStatus = 'DRAFT') => {
  setAdminMessage('');
  setAdminError('');

  if (!adminKey.trim()) {
    setAdminError('Admin key is required to load issues.');
    return;
  }

  const label = getIssueStatusLabel(issueStatus);

  setDraftsLoading(true);
  setIssueListLabel(label);

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/issues?status=${issueStatus}`, {
      method: 'GET',
      headers: {
        'x-admin-key': adminKey.trim(),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Could not load issues.');
    }

    setDrafts(Array.isArray(data.issues) ? data.issues : []);
    setAdminMessage(`${label} loaded.`);
  } catch (error) {
    setAdminError(error.message || 'Could not load issues.');
  } finally {
    setDraftsLoading(false);
  }
};

  const loadIssueIntoForm = async (issueId) => {
    setAdminMessage('');
    setAdminError('');

    if (!adminKey.trim()) {
      setAdminError('Admin key is required to load an issue.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/issues/${issueId}`, {
        method: 'GET',
        headers: {
          'x-admin-key': adminKey.trim(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not load issue.');
      }

      const issue = data.issue;

      setSelectedIssueId(issue.id);
      setTitle(issue.title || '');
      setSlug(issue.slug || '');
      setIssueNumber(issue.issueNumber ? String(issue.issueNumber) : '');
      setExcerpt(issue.excerpt || '');
      setCoverImageUrl(issue.coverImageUrl || '');
      setStatus(issue.status || 'DRAFT');
      setBodyHtml(issue.bodyHtml || '');
      setShowPreview(false);
      setAdminMessage(`Loaded issue: ${issue.title}`);    } catch (error) {
      setAdminError(error.message || 'Could not load issue.');
    }
  };

  const handleSaveIssue = async (event) => {
    event.preventDefault();

    setAdminMessage('');
    setAdminError('');

    if (!adminKey.trim()) {
      setAdminError('Admin key is required.');
      return;
    }

    if (!title.trim() || !excerpt.trim() || !bodyHtml.trim()) {
      setAdminError('Title, excerpt, and body HTML are required.');
      return;
    }

    setIsSavingIssue(true);

    const issuePayload = {
      title,
      slug,
      issueNumber,
      excerpt,
      coverImageUrl,
      status,
      bodyHtml,
    };

    try {
      const response = await fetch(
        isEditing
          ? `${API_BASE_URL}/api/admin/issues/${selectedIssueId}`
          : `${API_BASE_URL}/api/admin/issues`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': adminKey.trim(),
          },
          body: JSON.stringify(issuePayload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not save issue.');
      }

      setAdminMessage(
        isEditing
          ? `Updated issue: ${data.issue.title}`
          : `Created issue: ${data.issue.title}`
      );

      if (!isEditing) {
        resetForm();
      } else {
        setTitle(data.issue.title || '');
        setSlug(data.issue.slug || '');
        setIssueNumber(data.issue.issueNumber ? String(data.issue.issueNumber) : '');
        setExcerpt(data.issue.excerpt || '');
        setCoverImageUrl(data.issue.coverImageUrl || '');
        setStatus(data.issue.status || 'DRAFT');
        setBodyHtml(data.issue.bodyHtml || '');
      }

      if (data.issue?.status) {
  await loadAdminIssues(data.issue.status);
}
    } catch (error) {
      setAdminError(error.message || 'Could not save issue.');
    } finally {
      setIsSavingIssue(false);
    }
  };
const handleSendTestIssueEmail = async () => {
  setAdminMessage('');
  setAdminError('');

  if (!adminKey.trim()) {
    setAdminError('Admin key is required to send a test email.');
    return;
  }

  if (!selectedIssueId) {
    setAdminError('Save or load an issue before sending a test email.');
    return;
  }

  setIsSendingTestEmail(true);

  try {
    const response = await fetch(`${API_BASE_URL}/api/email/test-issue/${selectedIssueId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey.trim(),
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Could not send test email.');
    }

    setAdminMessage(`Test email sent for: ${data.issue?.title || title}`);
  } catch (error) {
    setAdminError(error.message || 'Could not send test email.');
  } finally {
    setIsSendingTestEmail(false);
  }
};
const handleSendIssueToSubscribers = async () => {
  setAdminMessage('');
  setAdminError('');

  if (!adminKey.trim()) {
    setAdminError('Admin key is required to send to subscribers.');
    return;
  }

  if (!selectedIssueId) {
    setAdminError('Save or load an issue before sending to subscribers.');
    return;
  }

  if (status !== 'PUBLISHED') {
    setAdminError('Set status to Published, save the issue, then send to subscribers.');
    return;
  }

  const confirmed = window.confirm(
    'Send this issue to all active subscribers? Make sure you already sent yourself a test email.'
  );

  if (!confirmed) {
    return;
  }

  setIsSendingSubscribers(true);

  try {
    const response = await fetch(`${API_BASE_URL}/api/email/send-issue/${selectedIssueId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey.trim(),
      },
      body: JSON.stringify({
        confirmSend: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Could not send issue to subscribers.');
    }

    setAdminMessage(`Issue sent to ${data.sentCount} subscriber${data.sentCount === 1 ? '' : 's'}.`);
    setStatus(data.issue?.status || 'SENT');

    if (data.issue?.title) {
      setTitle(data.issue.title);
    }
  } catch (error) {
    setAdminError(error.message || 'Could not send issue to subscribers.');
  } finally {
    setIsSendingSubscribers(false);
  }
};
  return (
    <section className="admin-page">
      <div className="admin-card">
        <p className="eyebrow">Admin</p>
        <h1>{isEditing ? 'Edit Issue' : 'Create Issue'}</h1>        <p className="admin-description">
          Create, preview, save, or publish a See the Good issue.
        </p>

        <div className="admin-draft-tools">
          <label>
            Admin Key
            <input
              type="password"
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              placeholder="Enter admin key"
              autoComplete="off"
            />
          </label>

         <div className="admin-draft-actions">
  <button
    type="button"
    onClick={() => loadAdminIssues('DRAFT')}
    disabled={draftsLoading}
  >
    Load Drafts
  </button>

  <button
    type="button"
    onClick={() => loadAdminIssues('PUBLISHED')}
    disabled={draftsLoading}
  >
    Load Published
  </button>

  <button
    type="button"
    onClick={() => loadAdminIssues('SENT')}
    disabled={draftsLoading}
  >
    Load Sent
  </button>

  <button type="button" onClick={resetForm}>
    New Issue
  </button>
</div>

          {drafts.length > 0 && (
            <div className="admin-draft-list">
            <p>{issueListLabel}</p>
              <div className="admin-draft-buttons">
                {drafts.map((draft) => (
                  <button
                    type="button"
                    key={draft.id}
                    onClick={() => loadIssueIntoForm(draft.id)}
                    className={selectedIssueId === draft.id ? 'active-draft' : ''}
                  >
                    {draft.issueNumber ? `Issue ${draft.issueNumber}: ` : ''}
                    {draft.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <form className="admin-form" onSubmit={handleSaveIssue}>
          <div className="admin-form-grid">
            <label>
              Title
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What See the Good Is"
              />
            </label>

            <label>
              Slug
              <input
                type="text"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="what-see-the-good-is"
              />
            </label>
          </div>

          <div className="admin-form-grid">
            <label>
              Issue Number
              <input
                type="number"
                value={issueNumber}
                onChange={(event) => setIssueNumber(event.target.value)}
                placeholder={nextIssueNumber ? String(nextIssueNumber) : 'Next issue number'}
              />
            </label>

            <label>
              Status
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="SENT" disabled>Sent</option>

              </select>
            </label>
          </div>

          <label>
            Excerpt
            <textarea
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              placeholder="A short summary that appears on the issue card."
              rows={3}
            />
          </label>

          <label>
            Cover Image URL
            <input
              type="url"
              value={coverImageUrl}
              onChange={(event) => setCoverImageUrl(event.target.value)}
              placeholder="https://images.unsplash.com/..."
            />
          </label>

          <label>
            Body HTML
            <textarea
              className="admin-html-editor"
              value={bodyHtml}
              onChange={(event) => setBodyHtml(event.target.value)}
              placeholder="<p>Your newsletter body...</p>"
              rows={16}
            />
          </label>
<div className="admin-action-row">
  <button type="submit" disabled={isSavingIssue}>
    {isSavingIssue
      ? isEditing ? 'Updating...' : 'Creating...'
      : isEditing ? 'Update Issue' : 'Create Issue'}
  </button>

  <button
    className="admin-secondary-button"
    type="button"
    onClick={() => setShowPreview((current) => !current)}
  >
    {showPreview ? 'Hide Preview' : 'Preview Issue'}
  </button>

  <button
    className="admin-secondary-button"
    type="button"
    onClick={handleSendTestIssueEmail}
    disabled={isSendingTestEmail || !selectedIssueId}
  >
    {isSendingTestEmail ? 'Sending Test...' : 'Send Test Email'}
  </button>

  <button
    className="admin-secondary-button"
    type="button"
    onClick={handleSendIssueToSubscribers}
    disabled={isSendingSubscribers || !selectedIssueId || status !== 'PUBLISHED'}
  >
    {isSendingSubscribers ? 'Sending...' : 'Send to Subscribers'}
  </button>
</div>
        </form>

        {adminMessage && <p className="success-message">{adminMessage}</p>}
        {adminError && <p className="error-message">{adminError}</p>}

        {showPreview && (
          <div className="admin-preview">
            <div className="admin-preview-header">
              <p className="eyebrow">Preview</p>
              <span>{status}</span>
            </div>

            <article className="issue-reader-card admin-preview-card">
              <p className="issue-reader-label">
                {issueNumber ? `Issue ${issueNumber}` : 'Issue Preview'}
              </p>

              <h2>{title || 'Untitled Issue'}</h2>

              {excerpt && (
                <p className="issue-reader-excerpt">{excerpt}</p>
              )}

              <div className="issue-reader-body">
                {bodyHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                ) : (
                  <p className="admin-empty-preview">
                    Add body HTML to preview the newsletter content.
                  </p>
                )}
              </div>
            </article>
          </div>
        )}
      </div>
    </section>
  );
}

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.hash || '#/');

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
  const isIssuesArchiveRoute = currentRoute === '#/issues';
  const currentStaticPage = staticPages[currentRoute];
  const isAdminRoute = currentRoute === '#/admin';
  const isHomeRoute = !isIssuesArchiveRoute && !currentStaticPage && !isAdminRoute;
  const nextIssueNumber = issues.reduce((highestNumber, issue) => {
  const issueNumber = Number(issue.issueNumber) || 0;
  return Math.max(highestNumber, issueNumber);
}, 0) + 1;
  
  

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

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(window.location.hash || '#/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    if (currentStaticPage) {
      setSelectedIssue(null);
      setSelectedIssueError('');
      setSelectedIssueLoading(false);
    }
  }, [currentRoute, currentStaticPage]);

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

  const handleIssueClose = () => {
    setSelectedIssue(null);
    setSelectedIssueError('');
    setSelectedIssueLoading(false);

    document.getElementById('issues')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
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

  const renderIssueReader = () => (
    <section className="issue-reader" id="issue-reader" aria-live="polite">
      {selectedIssueLoading && (
        <p className="issue-reader-status">Loading issue...</p>
      )}

      {selectedIssueError && (
        <p className="error-message">{selectedIssueError}</p>
      )}

      {selectedIssue && (
        <article className="issue-reader-card">
          <button
            className="issue-reader-close"
            type="button"
            onClick={handleIssueClose}
            aria-label="Close issue"
          >
            ×
          </button>

          <p className="issue-reader-label">
            {getIssueLabel(selectedIssue)}
          </p>

          <h2>{selectedIssue.title}</h2>

          <p className="issue-reader-excerpt">{selectedIssue.excerpt}</p>

          <div className="issue-reader-body">
            {selectedIssue.bodyHtml ? (
              <div dangerouslySetInnerHTML={{ __html: selectedIssue.bodyHtml }} />
            ) : (
              renderMarkdown(selectedIssue.bodyMarkdown)
            )}
          </div>
        </article>
      )}
    </section>
  );

  const renderIssueCard = (issue) => (
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
  );

  return (
    <main className="site-shell">
      <header className="site-header" aria-label="Main navigation">
        <a className="brand" href="#/" aria-label="See the Good home">
          <LogoMark />
          <span>See the Good</span>
        </a>

        <nav className="nav-links" aria-label="Site links">
          <a className="archive-nav-link" href="#/issues">Archive</a>
          <a className="nav-button" href="#subscribe">Subscribe</a>
        </nav>
      </header>

      {isIssuesArchiveRoute && (
        <section className="archive-page">
          <div className="archive-heading">
            <p className="eyebrow">Archive</p>
            <h1>All Issues</h1>
            <p>Browse every published See the Good issue.</p>
          </div>

          {issuesLoading && (
            <p className="issue-reader-status">Loading issues...</p>
          )}

          {!issuesLoading && issuesError && (
            <p className="error-message">{issuesError}</p>
          )}

          {!issuesLoading && !issuesError && issues.length === 0 && (
            <p className="issue-reader-status">No published issues yet.</p>
          )}

          {!issuesLoading && !issuesError && issues.length > 0 && (
            <div className="archive-grid">
              {issues.map((issue) => renderIssueCard(issue))}
            </div>
          )}

          <div className="archive-back-wrap">
            <a className="issue-archive-link" href="#/">
              Back home
            </a>
          </div>

          {renderIssueReader()}
        </section>
      )}

      {currentStaticPage && (
        <StaticPage page={currentStaticPage} />
      )}

      {isAdminRoute && (
  <AdminPage nextIssueNumber={nextIssueNumber} />
)}

      {isHomeRoute && (
        <>
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

            {!issuesLoading && !issuesError && displayedIssues.map((issue) => renderIssueCard(issue))}
          </section>

          {issues.length > 2 && (
            <div className="issue-archive-link-wrap">
              <a className="issue-archive-link" href="#/issues">
                See all issues
              </a>
            </div>
          )}

          {renderIssueReader()}

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
        </>
      )}

      <footer className="site-footer" id="archive">
        <a className="brand footer-brand" href="#/" aria-label="See the Good home">
          <LogoMark />
          <span>See the Good</span>
        </a>

        <p>© 2026 See the Good</p>

        <nav aria-label="Footer links">
          <a href="#/privacy">Privacy</a>
          <a href="#/terms">Terms</a>
          <a href="#/contact">Contact</a>
        </nav>
      </footer>
    </main>
  );
}

export default App;