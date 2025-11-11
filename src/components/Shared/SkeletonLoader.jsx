import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * SkeletonLoader - Loading placeholder komponenty
 */

// Post skeleton pre Feed
export function PostSkeleton() {
  const { darkMode } = useTheme();

  return (
    <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'} rounded-2xl shadow-lg mb-6 border animate-pulse`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-11 h-11 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
          <div className="flex-1">
            <div className={`h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/4 mb-2`}></div>
            <div className={`h-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/6`}></div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className={`h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-full`}></div>
          <div className={`h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-5/6`}></div>
          <div className={`h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-4/6`}></div>
        </div>
      </div>

      {/* Image placeholder */}
      <div className={`h-64 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>

      {/* Actions */}
      <div className={`p-5 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex space-x-4`}>
        <div className={`h-8 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded flex-1`}></div>
        <div className={`h-8 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded flex-1`}></div>
      </div>
    </div>
  );
}

// Message skeleton pre Chat
export function MessageSkeleton({ isMe = false }) {
  const { darkMode } = useTheme();

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-pulse`}>
      <div className={`flex items-start space-x-2 max-w-[90%] ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {!isMe && (
          <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
        )}
        <div className={`px-4 py-3 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} space-y-2`}>
          <div className={`h-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded w-32`}></div>
          <div className={`h-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded w-24`}></div>
        </div>
      </div>
    </div>
  );
}

// Create post skeleton
export function CreatePostSkeleton() {
  const { darkMode } = useTheme();

  return (
    <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} rounded-2xl shadow-lg p-6 mb-6 border ${darkMode ? 'border-gray-700' : 'border-gray-100'} animate-pulse`}>
      <div className="flex space-x-3">
        <div className={`w-12 h-12 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
        <div className="flex-1 space-y-3">
          <div className={`h-24 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-xl`}></div>
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <div className={`w-10 h-10 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg`}></div>
              <div className={`w-10 h-10 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg`}></div>
            </div>
            <div className={`w-24 h-10 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-xl`}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Comment skeleton
export function CommentSkeleton() {
  const { darkMode } = useTheme();

  return (
    <div className="flex space-x-3 animate-pulse">
      <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
      <div className="flex-1">
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-xl p-3 space-y-2`}>
          <div className={`h-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded w-1/4`}></div>
          <div className={`h-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded w-3/4`}></div>
        </div>
      </div>
    </div>
  );
}

// Group list skeleton
export function GroupListSkeleton() {
  const { darkMode } = useTheme();

  return (
    <div className="p-2 space-y-1">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={`p-3 rounded-lg animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
            <div className="flex-1 space-y-2">
              <div className={`h-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded w-3/4`}></div>
              <div className={`h-2 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded w-1/2`}></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default {
  PostSkeleton,
  MessageSkeleton,
  CreatePostSkeleton,
  CommentSkeleton,
  GroupListSkeleton
};
