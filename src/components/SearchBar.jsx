import React from 'react';

const SearchBar = ({ 
  searchTerm, 
  onSearchChange, 
  allTags, 
  selectedTags, 
  onTagToggle, 
  allCategories, 
  selectedCategory, 
  onCategoryChange,
  totalClips,
  filteredClips
}) => {
  return (
    <div className="search-bar">
      <div className="search-input-container">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search clips..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchTerm && (
          <button className="clear-search" onClick={() => onSearchChange('')}>
            ×
          </button>
        )}
      </div>

      <div className="filter-section">
        <div className="category-filter">
          <select 
            value={selectedCategory} 
            onChange={(e) => onCategoryChange(e.target.value)}
            className="category-select"
          >
            <option value="all">All Categories ({totalClips})</option>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {allTags.length > 0 && (
          <div className="tag-filter">
            <div className="tag-filter-row">
              <span className="filter-label">Tags:</span>
              <div className="tag-buttons">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    className={`tag-filter-btn ${selectedTags.includes(tag) ? 'active' : ''}`}
                    onClick={() => onTagToggle(tag)}
                  ><span className="tag">
                    🏷️ {selectedTags.includes(tag) && <span>✓ </span>}{tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="results-info">
        Showing {filteredClips} of {totalClips} clips
        {(searchTerm || selectedTags.length > 0 || selectedCategory !== 'all') && (
          <button 
            className="btn-clear-all-filters"
            onClick={() => {
              onSearchChange('');
              selectedTags.forEach(tag => onTagToggle(tag));
              onCategoryChange('all');
            }}
          >
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
