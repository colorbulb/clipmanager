import React, { useState, useMemo } from 'react';
import { processLaTeXInHTML } from '../utils/latexProcessor';
import 'katex/dist/katex.min.css';

const ClipboardItem = ({ clip, onCopy, onEdit, onDelete }) => {
  const [copied, setCopied] = useState(false);

  // Function to convert HTML to plain text while preserving whitespace and indentation
  const htmlToPlainText = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Preserve whitespace by setting CSS - critical for Safari
    tempDiv.style.whiteSpace = 'pre-wrap';
    tempDiv.style.display = 'block';
    
    // Process lists to add proper prefixes
    const lists = tempDiv.querySelectorAll('ul, ol');
    lists.forEach(list => {
      const items = list.querySelectorAll('li');
      const isOrdered = list.tagName === 'OL';
      items.forEach((li, index) => {
        const prefix = isOrdered ? `${index + 1}. ` : '• ';
        const text = li.textContent || li.innerText || '';
        li.textContent = prefix + text;
      });
    });
    
    // Use innerText which preserves visual formatting better than textContent
    // innerText respects CSS and preserves line breaks
    let text = tempDiv.innerText || tempDiv.textContent || '';
    
    // Normalize excessive whitespace but preserve structure
    text = text.replace(/[ \t]+/g, ' '); // Collapse multiple spaces/tabs to single space
    text = text.replace(/\n{3,}/g, '\n\n'); // Limit to max 2 consecutive newlines
    
    return text.trim();
  };

  const handleCopy = async () => {
    try {
      // Get the HTML content
      const htmlContent = clip.content;
      
      // Extract plain text with preserved whitespace
      const plainText = htmlToPlainText(htmlContent);
      
      // Create a ClipboardItem with both formats
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([htmlContent], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' })
      });
      
      await navigator.clipboard.write([clipboardItem]);
      
      onCopy(clip);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support ClipboardItem
      const plainText = htmlToPlainText(clip.content);
      await navigator.clipboard.writeText(plainText);
      
      onCopy(clip);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Process LaTeX in content (memoized to avoid reprocessing)
  const processedContent = useMemo(() => {
    return clip.content ? processLaTeXInHTML(clip.content) : '';
  }, [clip.content]);

  const createdDate = new Date(clip.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const isEdited = clip.updatedAt && clip.updatedAt !== clip.createdAt;

  return (
    <div className="clipboard-item">
      <div className="item-header">
        <h3>{clip.title}</h3>
        {clip.category && (
          <span className="category-badge">{clip.category}</span>
        )}
      </div>

      <div className="item-content">
        {clip.content && (
          <div 
            className="html-content" 
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        )}
        
        {clip.images && clip.images.length > 0 && (
          <div className="images-grid">
            {clip.images.map((img, index) => (
              <div key={index} className="image-item">
                <img src={img} alt={`${clip.title} ${index + 1}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {clip.tags && clip.tags.length > 0 && (
        <div className="item-tags">
          {clip.tags.map(tag => (
            <span key={tag} className="tag">
              🏷️ {tag}
            </span>
          ))}
        </div>
      )}

      <div className="item-footer">
        <div className="item-date">
          {createdDate}
          {isEdited && <span className="edited-badge">(edited)</span>}
        </div>
        <div className="item-actions">
          <button onClick={handleCopy} className="btn-copy">
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
          <button onClick={() => onEdit(clip)} className="btn-edit">
            ✏️ Edit
          </button>
          <button onClick={() => onDelete(clip.id)} className="btn-delete">
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClipboardItem;