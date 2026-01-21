import React, { useEffect, useMemo, useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { addContribution, getShareById, subscribeToContributions } from '../services/shareService';
import { hashPin } from '../utils/crypto';
import { processLaTeXInHTML } from '../utils/latexProcessor';
import './ShareView.css';

const ShareView = ({ shareId, user, loading }) => {
  const [share, setShare] = useState(null);
  const [shareLoading, setShareLoading] = useState(true);
  const [error, setError] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState(localStorage.getItem('shareName') || '');
  const [verified, setVerified] = useState(false);
  const [pinError, setPinError] = useState('');
  const [contribution, setContribution] = useState('');
  const [contributions, setContributions] = useState([]);
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      signInAnonymously(auth).catch((err) => {
        console.error('Anonymous auth failed:', err);
        setError('Unable to sign in. Please refresh and try again.');
      });
    }
  }, [loading, user]);

  useEffect(() => {
    const loadShare = async () => {
      setShareLoading(true);
      setError('');
      try {
        const shareDoc = await getShareById(shareId);
        if (!shareDoc) {
          setError('Share link not found.');
          setShare(null);
        } else {
          setShare(shareDoc);
        }
      } catch (err) {
        console.error('Failed to load share:', err);
        setError('Failed to load share link.');
      } finally {
        setShareLoading(false);
      }
    };

    if (shareId) {
      loadShare();
    }
  }, [shareId]);

  useEffect(() => {
    if (!verified) return undefined;
    return subscribeToContributions(shareId, setContributions);
  }, [shareId, verified]);

  const processedContent = useMemo(() => {
    if (!share?.clipSnapshot?.content) return '';
    return processLaTeXInHTML(share.clipSnapshot.content);
  }, [share]);

  const htmlToPlainText = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.style.whiteSpace = 'pre-wrap';
    tempDiv.style.display = 'block';

    const lists = tempDiv.querySelectorAll('ul, ol');
    lists.forEach((list) => {
      const items = list.querySelectorAll('li');
      const isOrdered = list.tagName === 'OL';
      items.forEach((li, index) => {
        const prefix = isOrdered ? `${index + 1}. ` : '• ';
        const text = li.textContent || li.innerText || '';
        li.textContent = prefix + text;
      });
    });

    return tempDiv.innerText || tempDiv.textContent || '';
  };

  const handleVerify = async () => {
    setPinError('');
    if (!pin.trim()) {
      setPinError('Enter PIN');
      return;
    }

    try {
      const hash = await hashPin(pin.trim());
      if (hash === share?.pinHash) {
        setVerified(true);
        if (name.trim()) {
          localStorage.setItem('shareName', name.trim());
        }
      } else {
        setPinError('Invalid PIN');
      }
    } catch (err) {
      console.error('PIN verify failed:', err);
      setPinError('Failed to verify PIN');
    }
  };

  const handleCopy = async () => {
    if (!share?.clipSnapshot) return;
    const htmlContent = share.clipSnapshot.content || '';
    const plainText = htmlToPlainText(htmlContent);

    try {
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([htmlContent], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' })
      });
      await navigator.clipboard.write([clipboardItem]);
      setCopyStatus('Copied!');
    } catch (err) {
      await navigator.clipboard.writeText(plainText);
      setCopyStatus('Copied!');
    }

    setTimeout(() => setCopyStatus(''), 2000);
  };

  const handleAddContribution = async () => {
    if (!name.trim() || !contribution.trim()) return;
    try {
      await addContribution(shareId, {
        name: name.trim(),
        text: contribution.trim()
      });
      setContribution('');
    } catch (err) {
      console.error('Failed to add contribution:', err);
      alert('Failed to add contribution');
    }
  };

  if (loading || shareLoading) {
    return (
      <div className="share-page">
        <div className="share-card">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="share-page">
        <div className="share-card error">{error}</div>
      </div>
    );
  }

  if (!share) {
    return (
      <div className="share-page">
        <div className="share-card error">Share link not found.</div>
      </div>
    );
  }

  return (
    <div className="share-page">
      <div className="share-card">
        <h1 className="share-title">🔗 Shared Clip</h1>
        <p className="share-subtitle">Enter your name and PIN to access</p>

        {!verified ? (
          <div className="share-form">
            <label>
              Your name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </label>

            <label>
              PIN
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN"
              />
            </label>

            {pinError && <div className="share-error">{pinError}</div>}

            <button className="share-btn" onClick={handleVerify}>
              Unlock
            </button>
          </div>
        ) : (
          <div className="share-content">
            <div className="share-clip-header">
              <h2>{share.clipSnapshot?.title || 'Untitled Clip'}</h2>
              {share.clipSnapshot?.category && (
                <span className="share-category">{share.clipSnapshot.category}</span>
              )}
            </div>

            {share.clipSnapshot?.content && (
              <div
                className="share-html"
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />
            )}

            {share.clipSnapshot?.images?.length > 0 && (
              <div className="share-images">
                {share.clipSnapshot.images.map((img, index) => (
                  <img key={index} src={img} alt={`Shared ${index + 1}`} />
                ))}
              </div>
            )}

            {share.clipSnapshot?.tags?.length > 0 && (
              <div className="share-tags">
                {share.clipSnapshot.tags.map((tag) => (
                  <span key={tag} className="share-tag">🏷️ {tag}</span>
                ))}
              </div>
            )}

            <div className="share-actions">
              <button className="share-btn" onClick={handleCopy}>
                {copyStatus || 'Copy'}
              </button>
            </div>

            <div className="share-contribute">
              <h3>Contribute</h3>
              <textarea
                value={contribution}
                onChange={(e) => setContribution(e.target.value)}
                placeholder="Add a note or suggestion..."
              />
              <button className="share-btn" onClick={handleAddContribution}>
                Add Contribution
              </button>
            </div>

            <div className="share-contributions">
              <h3>Contributions</h3>
              {contributions.length === 0 ? (
                <p className="share-empty">No contributions yet.</p>
              ) : (
                contributions.map((item) => (
                  <div key={item.id} className="share-contribution">
                    <div className="share-contribution-meta">
                      <strong>{item.name || 'Anonymous'}</strong>
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                    <p>{item.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareView;
