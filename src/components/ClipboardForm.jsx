import React, { useState, useEffect, useRef } from 'react';

const ClipboardForm = ({ clip, onSubmit, onCancel, existingTags, existingCategories }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [category, setCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const contentEditableRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (clip) {
      setTitle(clip.title || '');
      setTags(clip.tags || []);
      setCategory(clip.category || '');
      
      if (clip.images && Array.isArray(clip.images)) {
        setImages(clip.images);
      }
      
      if (clip.content) {
        setContent(clip.content);
        if (contentEditableRef.current) {
          contentEditableRef.current.innerHTML = clip.content;
        }
      }
    }
  }, [clip]);

  const handleContentChange = () => {
    if (contentEditableRef.current) {
      setContent(contentEditableRef.current.innerHTML);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    
    for (let item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        handleImageFile(file);
        return;
      }
    }
  };

  const handleImageFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => handleImageFile(file));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => handleImageFile(file));
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = document.createTextNode(emoji);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      handleContentChange();
    }
  };

  const formatText = (command) => {
    document.execCommand(command, false, null);
    contentEditableRef.current.focus();
    handleContentChange();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || (!content.trim() && images.length === 0)) {
      alert('Title and content (or at least one image) are required');
      return;
    }

    const clipData = {
      title: title.trim(),
      content: content.trim(),
      images: images,
      tags,
      category: category.trim()
    };

    if (clip) {
      clipData.id = clip.id;
    }

    onSubmit(clipData);
  };

  const emojis = ['😀', '👍', '❤️', '🎉', '🔥', '✅', '⭐', '💡', '📌', '✨'];

  return (
    <form onSubmit={handleSubmit} className="clipboard-form">
      <h2>{clip ? '✏️ Edit Clip' : '➕ Add New Clip'}</h2>

      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter clip title"
          required
        />
      </div>

      <div className="form-group">
        <label>Content *</label>
        
        <div className="editor-toolbar">
          <button type="button" onClick={() => formatText('bold')} title="Bold">
            <strong>B</strong>
          </button>
          <button type="button" onClick={() => formatText('italic')} title="Italic">
            <em>I</em>
          </button>
          <button type="button" onClick={() => formatText('underline')} title="Underline">
            <u>U</u>
          </button>
          <button type="button" onClick={() => formatText('insertUnorderedList')} title="Bullet List">
            • List
          </button>
          <button type="button" onClick={() => formatText('insertOrderedList')} title="Numbered List">
            1. List
          </button>
          <div className="divider"></div>
          <div className="emoji-picker">
            {emojis.map((emoji, i) => (
              <button 
                key={i} 
                type="button" 
                onClick={() => insertEmoji(emoji)}
                title="Insert emoji"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={contentEditableRef}
          contentEditable
          className="content-editor"
          onInput={handleContentChange}
          onPaste={handlePaste}
          data-placeholder="Type here... (Ctrl+B for bold, paste images)"
        />
      </div>

      <div className="form-group">
        <label>Images</label>
        
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="drop-zone-content">
            <span className="drop-icon">📁</span>
            <p>Click to upload or drag & drop images here</p>
            <span className="drop-hint">Multiple images supported</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </div>

        {images.length > 0 && (
          <div className="images-preview">
            {images.map((img, index) => (
              <div key={index} className="image-preview-item">
                <img src={img} alt={`Preview ${index + 1}`} />
                <button
                  type="button"
                  className="btn-remove-image"
                  onClick={() => handleRemoveImage(index)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="category">Category</label>
        <input
          id="category"
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g., Work, Personal, Code"
          list="category-suggestions"
        />
        <datalist id="category-suggestions">
          {existingCategories.map(cat => (
            <option key={cat} value={cat} />
          ))}
        </datalist>
      </div>

      <div className="form-group">
        <label htmlFor="tags">Tags</label>
        <div className="tag-input-container">
          <input
            id="tags"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Add tags"
            list="tag-suggestions"
          />
          <button type="button" onClick={handleAddTag} className="btn-add-tag">
            Add
          </button>
        </div>
        <datalist id="tag-suggestions">
          {existingTags.map(tag => (
            <option key={tag} value={tag} />
          ))}
        </datalist>
        {tags.length > 0 && (
          <div className="tags-list">
            {tags.map(tag => (
              <span key={tag} className="tag">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="tag-remove"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-cancel">
          Cancel
        </button>
        <button type="submit" className="btn-submit">
          {clip ? '💾 Update' : '➕ Add Clip'}
        </button>
      </div>
    </form>
  );
};

export default ClipboardForm;