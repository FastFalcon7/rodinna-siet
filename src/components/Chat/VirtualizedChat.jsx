import React, { useRef, useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import ReadReceipts from './ReadReceipts';
import VideoPlayer from '../Shared/VideoPlayer';

/**
 * VirtualizedChat - Optimalizovaný chat s virtualizáciou
 * Používa React Virtuoso pre handling tisícov správ
 */
function VirtualizedChat({ messages, onLoadMore, hasMore, setShowMediaViewer }) {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const virtuosoRef = useRef(null);

  // Auto-scroll na bottom pri novej správe
  useEffect(() => {
    if (messages.length > 0) {
      virtuosoRef.current?.scrollToIndex({
        index: messages.length - 1,
        behavior: 'smooth',
        align: 'end'
      });
    }
  }, [messages.length]);

  const renderAttachment = (attachment, isMe) => {
    if (!attachment) return null;

    const isImage = attachment.type?.startsWith('image/');
    const isVideo = attachment.type?.startsWith('video/');

    if (isImage) {
      return (
        <img
          src={attachment.url}
          alt={attachment.name}
          className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          style={{ maxWidth: '85%', maxHeight: '400px', width: 'auto', height: 'auto' }}
          onClick={() => setShowMediaViewer(attachment)}
        />
      );
    }

    if (isVideo) {
      return (
        <VideoPlayer
          src={attachment.url}
          thumbnail={attachment.thumbnail}
          name={attachment.name}
          onFullscreen={() => setShowMediaViewer(attachment)}
        />
      );
    }

    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center space-x-2 px-3 py-2 rounded ${
          isMe ? 'bg-indigo-700 hover:bg-indigo-800' : 'bg-gray-600 hover:bg-gray-700'
        } transition-colors`}
      >
        <i className="fas fa-paperclip"></i>
        <span className="text-sm">{attachment.name}</span>
      </a>
    );
  };

  const MessageItem = ({ message }) => {
    const isMe = user && message.senderUid === user.uid;

    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} px-4 py-2`}>
        <div className={`flex items-start space-x-2 max-w-[90%] ${
          isMe ? 'flex-row-reverse space-x-reverse' : ''
        }`}>
          {!isMe && (
            <img
              src={message.avatar}
              alt={message.sender}
              className="w-8 h-8 rounded-full mt-1 flex-shrink-0"
            />
          )}
          <div className={`px-4 py-2 rounded-2xl shadow-sm ${
            isMe
              ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white'
              : darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
          } break-words`}>
            {!isMe && (
              <p className="text-xs font-semibold mb-1 opacity-75">{message.sender}</p>
            )}

            {message.content && <p className="break-words">{message.content}</p>}

            {message.attachment && (
              <div className="mt-2">
                {renderAttachment(message.attachment, isMe)}
              </div>
            )}

            <div className="flex items-center justify-between mt-1">
              <p className="text-xs opacity-60">
                {message.createdAt?.toDate?.()?.toLocaleTimeString?.('sk-SK', {
                  hour: '2-digit',
                  minute: '2-digit'
                }) || ''}
              </p>
              {isMe && message.status && (
                <ReadReceipts status={message.status} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Virtuoso
      ref={virtuosoRef}
      data={messages}
      totalCount={messages.length}
      style={{ height: '100%', width: '100%' }}
      itemContent={(index, message) => <MessageItem key={message.id} message={message} />}
      followOutput="smooth"
      alignToBottom
      initialTopMostItemIndex={messages.length - 1}
      startReached={() => {
        if (hasMore && onLoadMore) {
          onLoadMore();
        }
      }}
      components={{
        Header: () => (
          hasMore ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
              <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Načítavam staršie správy...
              </p>
            </div>
          ) : null
        )
      }}
    />
  );
}

export default VirtualizedChat;
