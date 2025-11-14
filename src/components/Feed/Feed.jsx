import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { db, storage } from '../../firebase/config';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  arrayUnion,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function Feed() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [showPostMenu, setShowPostMenu] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedMediaFile, setSelectedMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);

  // Nové stavy pre modal
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();
  const { darkMode } = useTheme();
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const attachmentMenuRef = useRef(null);

  // Load posts from Firestore in real-time
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        postsData.push({
          id: doc.id,
          ...data,
          timestamp: data.createdAt ? formatTimestamp(data.createdAt.toDate()) : 'Práve teraz'
        });
      });
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading posts:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPostMenu && !event.target.closest('.post-menu')) {
        setShowPostMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPostMenu]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleModalClick = (event) => {
      if (modalRef.current && event.target === modalRef.current) {
        closeModal();
      }
    };

    if (showNewPostModal) {
      document.addEventListener('mousedown', handleModalClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleModalClick);
    };
  }, [showNewPostModal]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showNewPostModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showNewPostModal]);

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Close emoji picker on ESC key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showEmojiPicker) {
        setShowEmojiPicker(null);
      }
    };
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showEmojiPicker]);

  const formatTimestamp = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Práve teraz';
    if (diffInMinutes < 60) return `pred ${diffInMinutes} min`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `pred ${diffInHours} h`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `pred ${diffInDays} dňami`;

    return date.toLocaleDateString('sk-SK');
  };

  const openModal = () => {
    setShowNewPostModal(true);
  };

  const closeModal = () => {
    setShowNewPostModal(false);
    setNewPost('');
    if (selectedMedia) {
      URL.revokeObjectURL(selectedMedia);
    }
    setSelectedMedia(null);
    setSelectedMediaFile(null);
    setMediaType(null);
    setSelectedLocation(null);
    setShowAttachmentMenu(false);
  };

  const handleCreatePost = async () => {
    if (newPost.trim()) {
      setIsSubmitting(true);
      try {
        let mediaUrl = null;
        let uploadedMediaType = null;

        // Upload media do Firebase Storage ak je vybratý
        if (selectedMediaFile) {
          const timestamp = Date.now();
          const fileExt = selectedMediaFile.name?.split('.').pop() || (mediaType === 'video' ? 'mp4' : 'jpg');
          const fileName = `posts/${user.uid}/${timestamp}_${mediaType}.${fileExt}`;
          const storageRef = ref(storage, fileName);

          await uploadBytes(storageRef, selectedMediaFile);
          mediaUrl = await getDownloadURL(storageRef);
          uploadedMediaType = mediaType;
        }

        const postData = {
          author: {
            name: user.name,
            avatar: user.avatar,
            uid: user.uid
          },
          content: newPost,
          image: uploadedMediaType === 'image' ? mediaUrl : null,
          video: uploadedMediaType === 'video' ? mediaUrl : null,
          location: selectedLocation,
          createdAt: serverTimestamp(),
          likes: 0,
          comments: [],
          reactions: []
        };

        await addDoc(collection(db, 'posts'), postData);

        // Zavretie modalu a vyčistenie
        closeModal();
      } catch (error) {
        console.error('Error creating post:', error);
        alert(`Chyba pri vytváraní príspevku: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleLongPressStart = (e, postId) => {
    // Prevent iOS text selection menu
    e.preventDefault();

    const timer = setTimeout(() => {
      setShowEmojiPicker(postId);
    }, 500); // 500ms pre long press
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = (e) => {
    if (e) e.preventDefault();

    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleReaction = async (postId, emoji) => {
    try {
      // Close picker immediately
      setShowEmojiPicker(null);

      const postRef = doc(db, 'posts', postId);

      // Find the post to check existing reactions
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      // Check if user already reacted with this emoji
      const existingReaction = post.reactions?.find(
        r => r.userId === user.uid && r.emoji === emoji
      );

      if (existingReaction) {
        // User already reacted with this emoji, don't add duplicate
        return;
      }

      const reaction = {
        emoji: emoji,
        userId: user.uid,
        userName: user.name
      };

      await updateDoc(postRef, {
        reactions: arrayUnion(reaction),
        likes: (post.likes || 0) + 1
      });

    } catch (error) {
      console.error('Error adding reaction:', error);
      alert('Chyba pri pridávaní reakcie. Skúste to znova.');
    }
  };

  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name || 'image.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        }, 'image/jpeg', quality);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleMediaSelect = async (event, type) => {
    const file = event.target.files[0];
    if (file) {
      setShowAttachmentMenu(false);

      if (type === 'image') {
        try {
          const compressedFile = await compressImage(file);
          setSelectedMediaFile(compressedFile);
          const mediaUrl = URL.createObjectURL(compressedFile);
          setSelectedMedia(mediaUrl);
          setMediaType('image');
        } catch (error) {
          console.error('Error compressing image:', error);
          setSelectedMediaFile(file);
          const mediaUrl = URL.createObjectURL(file);
          setSelectedMedia(mediaUrl);
          setMediaType('image');
        }
      } else if (type === 'video') {
        setSelectedMediaFile(file);
        const mediaUrl = URL.createObjectURL(file);
        setSelectedMedia(mediaUrl);
        setMediaType('video');
      }
    }
    // Reset file input
    event.target.value = '';
  };

  const handleLocationSelect = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
        };
        setSelectedLocation(location);
      }, () => {
        // Fallback ak geolokácia zlyhá
        const manualLocation = prompt('Zadajte názov lokácie:');
        if (manualLocation) {
          setSelectedLocation({ name: manualLocation });
        }
      });
    } else {
      const manualLocation = prompt('Zadajte názov lokácie:');
      if (manualLocation) {
        setSelectedLocation({ name: manualLocation });
      }
    }
  };

  const removeMedia = () => {
    if (selectedMedia) {
      URL.revokeObjectURL(selectedMedia);
      setSelectedMedia(null);
      setSelectedMediaFile(null);
      setMediaType(null);
    }
  };

  const removeLocation = () => {
    setSelectedLocation(null);
  };

  const toggleComments = (postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleAddComment = async (postId) => {
    const commentText = newComment[postId]?.trim();
    if (!commentText) return;

    const comment = {
      id: Date.now().toString(),
      author: user.name,
      authorUid: user.uid,
      content: commentText,
      timestamp: 'Práve teraz'
    };

    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        comments: arrayUnion(comment)
      });

      // Len ak request uspeje, vyčisti input
      setNewComment(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Chyba pri pridávaní komentára. Skúste to znova.');
    }
  };

  const handleShare = (postId) => {
    // Simple implementation - copy link to clipboard
    const shareText = `Pozrite si tento príspevok na Rodinnej sieti: ${window.location.href}`;
    if (navigator.share) {
      navigator.share({
        title: 'Príspevok z Rodinnej siete',
        text: shareText,
        url: window.location.href
      });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      alert('Odkaz bol skopírovaný do schránky');
    } else {
      alert('Zdieľanie nie je podporované v tomto prehliadači');
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post.id);
    setEditContent(post.content);
    setShowPostMenu(null);
  };

  const handleSaveEdit = async (postId) => {
    if (!editContent.trim()) return;

    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        content: editContent
      });
    } catch (error) {
      console.error('Error updating post:', error);
    }

    setEditingPost(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditContent('');
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Ste si istý, že chcete zmazať tento príspevok?')) return;

    try {
      const postRef = doc(db, 'posts', postId);
      await deleteDoc(postRef);
    } catch (error) {
      console.error('Error deleting post:', error);
    }

    setShowPostMenu(null);
  };

  const handleReportPost = (postId) => {
    alert('Príspevok bol nahlásený. Ďakujeme za upozornenie.');
    setShowPostMenu(null);
  };

  const groupReactions = (reactions) => {
    if (!reactions || reactions.length === 0) return [];

    const grouped = {};
    reactions.forEach(reaction => {
      if (grouped[reaction.emoji]) {
        grouped[reaction.emoji].push(reaction.userName);
      } else {
        grouped[reaction.emoji] = [reaction.userName];
      }
    });

    return Object.entries(grouped).map(([emoji, users]) => ({
      emoji,
      count: users.length,
      users
    }));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-8 text-center`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Načítavam príspevky...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      {/* Posts */}
      {posts.length === 0 ? (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-8 text-center`}>
          <i className="fas fa-newspaper text-4xl text-gray-400 mb-4"></i>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Zatiaľ tu nie sú žiadne príspevky. Buďte prvý, kto niečo zdieľa!
          </p>
          <button
            onClick={openModal}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Vytvoriť príspevok
          </button>
        </div>
      ) : (
        posts.map(post => (
        <div key={post.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm mb-4 overflow-hidden`}>
          {/* Long press wrapper - len pre cudzích užívateľov */}
          <div
            onTouchStart={post.author.uid !== user.uid ? (e) => handleLongPressStart(e, post.id) : undefined}
            onTouchEnd={post.author.uid !== user.uid ? handleLongPressEnd : undefined}
            onMouseDown={post.author.uid !== user.uid ? (e) => handleLongPressStart(e, post.id) : undefined}
            onMouseUp={post.author.uid !== user.uid ? handleLongPressEnd : undefined}
            onMouseLeave={post.author.uid !== user.uid ? handleLongPressEnd : undefined}
            onContextMenu={post.author.uid !== user.uid ? (e) => e.preventDefault() : undefined}
            style={post.author.uid !== user.uid ? {
              WebkitTapHighlightColor: 'transparent',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              touchAction: 'manipulation',
              userSelect: 'none'
            } : {}}
          >
          {/* Post Header */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {post.author.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {post.timestamp}
                  </p>
                </div>
              </div>
              <div className="relative post-menu">
                <button
                  onClick={() => setShowPostMenu(showPostMenu === post.id ? null : post.id)}
                  className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <i className="fas fa-ellipsis-h"></i>
                </button>

                {showPostMenu === post.id && (
                  <div className={`absolute right-0 top-8 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-lg border ${darkMode ? 'border-gray-600' : 'border-gray-200'} py-2 min-w-[120px] z-10`}>
                    {post.author.uid === user.uid ? (
                      <>
                        <button
                          onClick={() => handleEditPost(post)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                        >
                          <i className="fas fa-edit mr-2"></i>
                          Upraviť
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-red-600`}
                        >
                          <i className="fas fa-trash mr-2"></i>
                          Zmazať
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleReportPost(post.id)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-red-600`}
                      >
                        <i className="fas fa-flag mr-2"></i>
                        Nahlásiť
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Post Content */}
            {editingPost === post.id ? (
              <div className="mt-4 space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className={`w-full p-3 rounded-lg resize-none ${
                    darkMode
                      ? 'bg-gray-700 text-white placeholder-gray-400'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                  rows="3"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSaveEdit(post.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    Uložiť
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                  >
                    Zrušiť
                  </button>
                </div>
              </div>
            ) : (
              <p className={`mt-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                {post.content}
              </p>
            )}

            {/* Post Location */}
            {post.location && (
              <div className="mt-3 flex items-center space-x-2 text-sm text-gray-500">
                <i className="fas fa-map-marker-alt"></i>
                <span>{post.location.name}</span>
              </div>
            )}
          </div>

          {/* Post Media */}
          {post.image && (
            <img
              src={post.image}
              alt="Post"
              className="w-full max-h-96 object-cover"
            />
          )}
          {post.video && (
            <video
              src={post.video}
              controls
              className="w-full max-h-96"
            />
          )}

          {/* Reactions */}
          {post.reactions && post.reactions.length > 0 && (() => {
            const groupedReactions = groupReactions(post.reactions);
            return groupedReactions.length > 0 && (
              <div className="px-4 pt-3 flex items-center flex-wrap gap-2">
                {groupedReactions.map(({ emoji, count, users }) => (
                  <div
                    key={emoji}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}
                    title={users.join(', ')}
                  >
                    <span className="text-lg">{emoji}</span>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{count}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Emoji Picker - zobrazí sa po long press (len pre cudzích užívateľov) */}
          {showEmojiPicker === post.id && post.author.uid !== user.uid && (
            <>
              {/* Overlay - zatvorí picker pri kliknutí */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowEmojiPicker(null)}
                style={{
                  WebkitTapHighlightColor: 'transparent'
                }}
              />
              {/* Emoji Picker */}
              <div className="px-4 pt-2 relative">
                <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl p-2 flex space-x-2 z-50 border border-gray-200 dark:border-gray-600 inline-flex relative">
                  {['👍', '❤️', '😂', '😮', '😢', '👏', '🎉'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(post.id, emoji)}
                      className="text-2xl hover:scale-125 transition-transform"
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          </div>
          {/* End of long press wrapper */}

          {/* Actions */}
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-around relative`}>

            <button
              onClick={() => toggleComments(post.id)}
              className={`flex items-center space-x-2 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
            >
              <i className="far fa-comment"></i>
              <span>Komentovať</span>
              {post.comments?.length > 0 && (
                <span className="text-sm">({post.comments.length})</span>
              )}
            </button>

            <button
              onClick={() => handleShare(post.id)}
              className={`flex items-center space-x-2 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
            >
              <i className="far fa-share-square"></i>
              <span>Zdieľať</span>
            </button>
          </div>

          {/* Comments Section */}
          {showComments[post.id] && (
            <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {/* Add Comment */}
              <div className="px-4 py-3">
                <div className="flex space-x-2">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1 flex space-x-2">
                    <input
                      type="text"
                      value={newComment[post.id] || ''}
                      onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder="Napíšte komentár..."
                      className={`flex-1 p-2 rounded-lg text-sm ${
                        darkMode
                          ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      } border`}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      disabled={!newComment[post.id]?.trim()}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="fas fa-paper-plane"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Existing Comments */}
              {post.comments?.length > 0 && (
                <div className="px-4 pb-4">
                  {post.comments.map(comment => (
                    <div key={comment.id} className="mt-3">
                      <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-3`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className={`font-semibold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                              {comment.author}
                            </p>
                            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {comment.content}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 ml-2">
                            {comment.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        ))
      )}

      {/* Floating Action Button */}
      <button
        onClick={openModal}
        className="fixed bottom-20 md:bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 flex items-center justify-center z-40 transition-all hover:scale-110"
        style={{
          WebkitTapHighlightColor: 'rgba(79, 70, 229, 0.3)',
          touchAction: 'manipulation'
        }}
      >
        <i className="fas fa-plus text-xl"></i>
      </button>

      {/* New Post Modal */}
      {showNewPostModal && (
        <div
          ref={modalRef}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center"
          style={{
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} w-full md:max-w-2xl md:rounded-xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col`}
            style={{
              animation: 'slideUp 0.3s ease-out'
            }}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Nový príspevok
              </h2>
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <i className={`fas fa-times ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex space-x-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Čo máte na mysli?"
                    className={`w-full p-3 rounded-lg resize-none ${
                      darkMode
                        ? 'bg-gray-700 text-white placeholder-gray-400'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                    rows="4"
                    autoFocus
                  />

                  {/* Media Preview */}
                  {selectedMedia && (
                    <div className="mt-3 relative">
                      {mediaType === 'image' ? (
                        <img
                          src={selectedMedia}
                          alt="Selected"
                          className="max-h-60 rounded-lg object-cover w-full"
                        />
                      ) : (
                        <video
                          src={selectedMedia}
                          controls
                          className="max-h-60 rounded-lg w-full"
                        />
                      )}
                      <button
                        onClick={removeMedia}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  )}

                  {/* Location Preview */}
                  {selectedLocation && (
                    <div className={`mt-3 flex items-center justify-between ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-3`}>
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-map-marker-alt text-indigo-600"></i>
                        <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          {selectedLocation.name}
                        </span>
                      </div>
                      <button
                        onClick={removeLocation}
                        className="text-red-600 hover:text-red-700"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                {/* Attachment menu */}
                <div className="relative" ref={attachmentMenuRef}>
                  {/* Hidden file inputs */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleMediaSelect(e, 'image')}
                    className="hidden"
                    ref={fileInputRef}
                    disabled={isSubmitting}
                  />
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleMediaSelect(e, 'video')}
                    className="hidden"
                    ref={videoInputRef}
                    disabled={isSubmitting}
                  />

                  {/* + Button */}
                  <button
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    disabled={isSubmitting}
                    className={`p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation'
                    }}
                  >
                    <i className="fas fa-plus text-2xl"></i>
                  </button>

                  {/* Dropdown menu */}
                  {showAttachmentMenu && (
                    <div className={`absolute bottom-full mb-2 left-0 ${
                      darkMode ? 'bg-gray-700' : 'bg-white'
                    } rounded-lg shadow-xl border ${
                      darkMode ? 'border-gray-600' : 'border-gray-200'
                    } py-2 min-w-[220px] z-20`}>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSubmitting}
                        className={`w-full text-left px-4 py-3 flex items-center space-x-3 ${
                          darkMode ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-100 text-gray-800'
                        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{
                          WebkitTapHighlightColor: 'transparent',
                          touchAction: 'manipulation'
                        }}
                      >
                        <i className="fas fa-image text-lg text-blue-500"></i>
                        <span>Fotka</span>
                      </button>
                      <button
                        onClick={() => videoInputRef.current?.click()}
                        disabled={isSubmitting}
                        className={`w-full text-left px-4 py-3 flex items-center space-x-3 ${
                          darkMode ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-100 text-gray-800'
                        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{
                          WebkitTapHighlightColor: 'transparent',
                          touchAction: 'manipulation'
                        }}
                      >
                        <i className="fas fa-video text-lg text-purple-500"></i>
                        <span>Video</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowAttachmentMenu(false);
                          handleLocationSelect();
                        }}
                        disabled={isSubmitting}
                        className={`w-full text-left px-4 py-3 flex items-center space-x-3 ${
                          darkMode ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-100 text-gray-800'
                        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{
                          WebkitTapHighlightColor: 'transparent',
                          touchAction: 'manipulation'
                        }}
                      >
                        <i className="fas fa-map-marker-alt text-lg text-red-500"></i>
                        <span>Poloha</span>
                      </button>
                      <button
                        disabled
                        className={`w-full text-left px-4 py-3 flex items-center space-x-3 opacity-50 cursor-not-allowed ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        <i className="fas fa-file text-lg text-green-500"></i>
                        <span>Súbor (čoskoro)</span>
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleCreatePost}
                  disabled={!newPost.trim() || isSubmitting}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    WebkitTapHighlightColor: 'rgba(79, 70, 229, 0.3)',
                    touchAction: 'manipulation'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Zdieľam...
                    </>
                  ) : (
                    'Zdieľať'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default Feed;
