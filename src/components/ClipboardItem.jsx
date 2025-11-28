import React, { useState } from 'react';

const ClipboardItem = ({ clip, onCopy, onEdit, onDelete }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // Get the HTML content
      const htmlContent = clip.content;
      
      // Extract plain text as fallback
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const plainText = tempDiv.textContent || tempDiv.innerText;
      
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
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = clip.content;
      const text = tempDiv.textContent || tempDiv.innerText;
      await navigator.clipboard.writeText(text);
      
      onCopy(clip);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
            dangerouslySetInnerHTML={{ __html: clip.content }}
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