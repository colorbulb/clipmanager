import React, { useState, useEffect } from 'react';
import './TagCategoryManager.css';

const TagCategoryManager = ({ allTags, allCategories, onClose }) => {
  const [customTags, setCustomTags] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    const savedTags = localStorage.getItem('customTags');
    const savedCategories = localStorage.getItem('customCategories');
    
    console.log('🏷️ TagCategoryManager loaded from localStorage:', { savedTags, savedCategories });
    
    if (savedTags) {
      const parsed = JSON.parse(savedTags);
      console.log('✅ Manager loaded custom tags:', parsed);
      setCustomTags(parsed);
    }
    if (savedCategories) {
      const parsed = JSON.parse(savedCategories);
      console.log('✅ Manager loaded custom categories:', parsed);
      setCustomCategories(parsed);
    }
  }, []);

  const allTagsList = [...new Set([...allTags, ...customTags])];
  const allCategoriesList = [...new Set([...allCategories, ...customCategories])];

  console.log('🏷️ Manager current state:', {
    allTags,
    customTags,
    allTagsList,
    allCategories,
    customCategories,
    allCategoriesList
  });

  const handleAddTag = () => {
    console.log('➕ Adding tag:', newTag);
    if (newTag.trim() && !allTagsList.includes(newTag.trim())) {
      const updated = [...customTags, newTag.trim()];
      console.log('💾 Saving custom tags to localStorage:', updated);
      setCustomTags(updated);
      localStorage.setItem('customTags', JSON.stringify(updated));
      setNewTag('');
      console.log('✅ Tag added successfully');
    } else {
      console.log('❌ Tag not added - either empty or already exists');
    }
  };

  const handleRemoveTag = (tag) => {
    console.log('🗑️ Removing tag:', tag);
    const updated = customTags.filter(t => t !== tag);
    console.log('💾 Saving updated custom tags:', updated);
    setCustomTags(updated);
    localStorage.setItem('customTags', JSON.stringify(updated));
    console.log('✅ Tag removed successfully');
  };

  const handleAddCategory = () => {
    console.log('➕ Adding category:', newCategory);
    if (newCategory.trim() && !allCategoriesList.includes(newCategory.trim())) {
      const updated = [...customCategories, newCategory.trim()];
      console.log('💾 Saving custom categories to localStorage:', updated);
      setCustomCategories(updated);
      localStorage.setItem('customCategories', JSON.stringify(updated));
      setNewCategory('');
      console.log('✅ Category added successfully');
    } else {
      console.log('❌ Category not added - either empty or already exists');
    }
  };

  const handleRemoveCategory = (category) => {
    console.log('🗑️ Removing category:', category);
    const updated = customCategories.filter(c => c !== category);
    console.log('💾 Saving updated custom categories:', updated);
    setCustomCategories(updated);
    localStorage.setItem('customCategories', JSON.stringify(updated));
    console.log('✅ Category removed successfully');
  };

  return (
    <div className="manager-container">
      <div className="manager-header">
        <h2>🏷️ Manage Tags & Categories</h2>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>

      <div className="manager-section">
        <h3>Tags</h3>
        <div className="add-item">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="Add new tag"
          />
          <button onClick={handleAddTag} className="btn-add">Add</button>
        </div>
        <div className="items-list">
          {allTagsList.length === 0 ? (
            <p className="empty-message">No tags yet</p>
          ) : (
            allTagsList.map(tag => (
              <div key={tag} className="item">
                <span>{tag}</span>
                {customTags.includes(tag) ? (
                  <button onClick={() => handleRemoveTag(tag)} className="btn-remove">✕</button>
                ) : (
                  <span className="from-clips">(from clips)</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="manager-section">
        <h3>Categories</h3>
        <div className="add-item">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            placeholder="Add new category"
          />
          <button onClick={handleAddCategory} className="btn-add">Add</button>
        </div>
        <div className="items-list">
          {allCategoriesList.length === 0 ? (
            <p className="empty-message">No categories yet</p>
          ) : (
            allCategoriesList.map(category => (
              <div key={category} className="item">
                <span>{category}</span>
                {customCategories.includes(category) ? (
                  <button onClick={() => handleRemoveCategory(category)} className="btn-remove">✕</button>
                ) : (
                  <span className="from-clips">(from clips)</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

{/*      <div className="manager-info">
        <p>ℹ️ Custom tags/categories will appear in suggestions when creating clips.</p>
        <p>Tags/categories from existing clips cannot be removed here.</p>
      </div>*/}
    </div>
  );
};

export default TagCategoryManager;