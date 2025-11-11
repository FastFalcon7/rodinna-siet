import React from 'react';

/**
 * ReadReceipts - Tick marks pre read status (WhatsApp style)
 * sent = 1 tick (gray)
 * delivered = 2 ticks (gray)
 * read = 2 ticks (blue)
 */
function ReadReceipts({ status = 'sent' }) {
  const getTickColor = () => {
    if (status === 'read') return 'text-blue-500';
    return 'text-gray-400';
  };

  const showDoubleTick = status === 'delivered' || status === 'read';

  return (
    <span className={`inline-flex items-center ml-1 ${getTickColor()}`}>
      {showDoubleTick ? (
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
        </svg>
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M11.071 1.429l-.478-.372a.365.365 0 0 0-.51.063L4.566 7.972a.32.32 0 0 1-.484.033L1.891 5.862a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
        </svg>
      )}
    </span>
  );
}

export default ReadReceipts;
