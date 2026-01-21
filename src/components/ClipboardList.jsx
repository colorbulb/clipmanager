import React from 'react';
import ClipboardItem from './ClipboardItem';

const ClipboardList = ({ clips, onCopy, onEdit, onDelete, onShare }) => {
  return (
    <div className="clipboard-list">
      {clips.map(clip => (
        <ClipboardItem
          key={clip.id}
          clip={clip}
          onCopy={onCopy}
          onShare={onShare}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default ClipboardList;
