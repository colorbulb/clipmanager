import React, { useState, useEffect } from 'react';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { subscribeToClips, addClip as addClipService, updateClip as updateClipService, deleteClip as deleteClipService } from './services/clipboardService';
import Auth from './components/Auth';
import ClipboardList from './components/ClipboardList';
import ClipboardForm from './components/ClipboardForm';
import SearchBar from './components/SearchBar';
import TagCategoryManager from './components/TagCategoryManager';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clips, setClips] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingClip, setEditingClip] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [customTags, setCustomTags] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToClips(user.uid, (updatedClips) => {
        setClips(updatedClips);
      });
      return () => unsubscribe();
    } else {
      setClips([]);
    }
  }, [user]);

  useEffect(() => {
    const savedTags = localStorage.getItem('customTags');
    const savedCategories = localStorage.getItem('customCategories');
    
    console.log('🔍 Loading from localStorage:', { savedTags, savedCategories });
    
    if (savedTags) {
      const parsed = JSON.parse(savedTags);
      console.log('✅ Loaded custom tags:', parsed);
      setCustomTags(parsed);
    }
    if (savedCategories) {
      const parsed = JSON.parse(savedCategories);
      console.log('✅ Loaded custom categories:', parsed);
      setCustomCategories(parsed);
    }
  }, []);

  const handleAddClip = async (newClip) => {
    try {
      await addClipService(user.uid, newClip);
      setShowForm(false);
    } catch (error) {
      console.error('Error adding clip:', error);
      alert('Failed to add clip. Please try again.');
    }
  };

  const handleUpdateClip = async (updatedClip) => {
    try {
      const { id, ...clipData } = updatedClip;
      await updateClipService(id, clipData);
      setEditingClip(null);
    } catch (error) {
      console.error('Error updating clip:', error);
      alert('Failed to update clip. Please try again.');
    }
  };

  const handleDeleteClip = async (clipId) => {
    if (window.confirm('Are you sure you want to delete this clip?')) {
      try {
        await deleteClipService(clipId);
      } catch (error) {
        console.error('Error deleting clip:', error);
        alert('Failed to delete clip. Please try again.');
      }
    }
  };

  const handleCopyClip = async (clip) => {
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
      alert('Copied to clipboard! ✓');
    } catch (err) {
      // Fallback: copy plain text
      try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = clip.content;
        const text = tempDiv.textContent || tempDiv.innerText;
        await navigator.clipboard.writeText(text);
        alert('Copied to clipboard! ✓');
      } catch (fallbackErr) {
        console.error('Failed to copy:', fallbackErr);
        alert('Failed to copy to clipboard');
      }
    }
  };

  const handleManagerClose = () => {
    console.log('🔄 Manager closing, refreshing tags/categories...');
    setShowManager(false);
    
    const savedTags = localStorage.getItem('customTags');
    const savedCategories = localStorage.getItem('customCategories');
    
    console.log('📦 localStorage after close:', { savedTags, savedCategories });
    
    if (savedTags) {
      const parsed = JSON.parse(savedTags);
      console.log('✅ Reloaded custom tags:', parsed);
      setCustomTags(parsed);
    }
    if (savedCategories) {
      const parsed = JSON.parse(savedCategories);
      console.log('✅ Reloaded custom categories:', parsed);
      setCustomCategories(parsed);
    }
  };

  const allTags = [...new Set(clips.flatMap(clip => clip.tags || []))];
  const allCategories = [...new Set(clips.map(clip => clip.category).filter(Boolean))];
  
  const combinedTags = [...new Set([...allTags, ...customTags])];
  const combinedCategories = [...new Set([...allCategories, ...customCategories])];

  console.log('📊 Current state:', {
    allTags,
    customTags,
    combinedTags,
    allCategories,
    customCategories,
    combinedCategories
  });

  const filteredClips = clips.filter(clip => {
    const matchesSearch = !searchTerm || 
      clip.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clip.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clip.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => clip.tags?.includes(tag));

    const matchesCategory = selectedCategory === 'all' || 
      clip.category === selectedCategory;

    return matchesSearch && matchesTags && matchesCategory;
  });

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>📋 Cloud Clipboard</h1>
          <p className="subtitle">Synced across all your devices</p>
        </div>
        <div className="header-actions">
          <span className="user-email">👤 {user.email}</span>
          <button 
            className="btn-manage"
            onClick={() => setShowManager(true)}
          >
            ⚙️ Manage
          </button>
          <button 
            className="btn-logout"
            onClick={() => auth.signOut()}
          >
            🚪 Logout
          </button>
          <button 
            className="btn-add-new"
            onClick={() => {
              setShowForm(true);
              setEditingClip(null);
            }}
          >
            ➕ Add New Clip
          </button>
        </div>
      </header>

      <main className="app-main">
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          allTags={combinedTags}
          selectedTags={selectedTags}
          onTagToggle={(tag) => {
            setSelectedTags(prev =>
              prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
            );
          }}
          allCategories={combinedCategories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          totalClips={clips.length}
          filteredClips={filteredClips.length}
        />

        {(showForm || editingClip) && (
          <div className="form-overlay" onClick={() => {
            setShowForm(false);
            setEditingClip(null);
          }}>
            <div className="form-container" onClick={(e) => e.stopPropagation()}>
              <ClipboardForm
                clip={editingClip}
                onSubmit={editingClip ? handleUpdateClip : handleAddClip}
                onCancel={() => {
                  setShowForm(false);
                  setEditingClip(null);
                }}
                existingTags={combinedTags}
                existingCategories={combinedCategories}
              />
            </div>
          </div>
        )}

        {showManager && (
          <div className="form-overlay" onClick={handleManagerClose}>
            <div className="form-container" onClick={(e) => e.stopPropagation()}>
              <TagCategoryManager
                allTags={allTags}
                allCategories={allCategories}
                onClose={handleManagerClose}
              />
            </div>
          </div>
        )}

        <ClipboardList
          clips={filteredClips}
          onCopy={handleCopyClip}
          onEdit={(clip) => {
            setEditingClip(clip);
            setShowForm(false);
          }}
          onDelete={handleDeleteClip}
        />

        {filteredClips.length === 0 && clips.length > 0 && (
          <div className="no-results">
            <p>🔍 No clips match your filters</p>
            <button 
              className="btn-clear-filters"
              onClick={() => {
                setSearchTerm('');
                setSelectedTags([]);
                setSelectedCategory('all');
              }}
            >
              Clear Filters
            </button>
          </div>
        )}

        {clips.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h2>Your clipboard is empty</h2>
            <p>Click "Add New Clip" to save your first item!</p>
            <p className="sync-info">✨ Syncs automatically across all your devices</p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>☁️ Powered by Next Elite</p>
      </footer>
    </div>
  );
}

export default App;