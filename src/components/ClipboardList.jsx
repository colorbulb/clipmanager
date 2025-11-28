import React from 'react';
import ClipboardItem from './ClipboardItem';

const ClipboardList = ({ clips, onCopy, onEdit, onDelete }) => {
  return (
    <div className="clipboard-list">
      {clips.map(clip => (
        <ClipboardItem
          key={clip.id}
          clip={clip}
          onCopy={onCopy}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default ClipboardList;
