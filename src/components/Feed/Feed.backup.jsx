import React, { useState, useEffect } from 'react';
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
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const { user } = useAuth();
  const { darkMode } = useTheme();

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

  const handleCreatePost = async () => {
    if (newPost.trim()) {
      try {
        let imageUrl = null;

        // Upload obrázka do Firebase Storage ak je vybratý
        if (selectedImageFile) {
          console.log('Uploading image:', selectedImageFile.name, selectedImageFile.size);
          const timestamp = Date.now();
          const fileName = `posts/${user.uid}/${timestamp}_${selectedImageFile.name}`;
          const storageRef = ref(storage, fileName);
          
          console.log('Storage ref:', fileName);
          const uploadResult = await uploadBytes(storageRef, selectedImageFile);
          console.log('Upload successful:', uploadResult);
          
          imageUrl = await getDownloadURL(storageRef);
          console.log('Download URL:', imageUrl);
        }

        const postData = {
          author: {
            name: user.name,
            avatar: user.avatar,
            uid: user.uid
          },
          content: newPost,
          image: imageUrl,
          location: selectedLocation,
          createdAt: serverTimestamp(),
          likes: 0,
          comments: [],
          reactions: []
        };
        
        await addDoc(collection(db, 'posts'), postData);
        
        // Vyčistenie
        setNewPost('');
        if (selectedImage) {
          URL.revokeObjectURL(selectedImage);
        }
        setSelectedImage(null);
        setSelectedImageFile(null);
        setSelectedLocation(null);
      } catch (error) {
        console.error('Error creating post:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        alert(`Chyba pri vytváraní príspevku: ${error.message}`);
      }
    }
  };

  const handleReaction = async (postId, emoji) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        reactions: arrayUnion(emoji),
        likes: posts.find(p => p.id === postId)?.likes + 1 || 1
      });
      setShowEmojiPicker(null);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        // Kompresia obrázka
        const compressedFile = await compressImage(file);
        
        setSelectedImageFile(compressedFile);
        const imageUrl = URL.createObjectURL(compressedFile);
        setSelectedImage(imageUrl);
      } catch (error) {
        console.error('Error compressing image:', error);
        // Fallback na originál
        setSelectedImageFile(file);
        const imageUrl = URL.createObjectURL(file);
        setSelectedImage(imageUrl);
      }
    }
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

  const removeImage = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
      setSelectedImageFile(null);
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
    } catch (error) {
      console.error('Error adding comment:', error);
    }

    setNewComment(prev => ({ ...prev, [postId]: '' }));
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
    <div className="max-w-2xl mx-auto p-4">
      {/* Create Post */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-4 mb-6`}>
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
              rows="3"
            />
            {/* Image Preview */}
            {selectedImage && (
              <div className="mt-3 relative">
                <img 
                  src={selectedImage} 
                  alt="Selected" 
                  className="max-h-40 rounded-lg object-cover"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 text-sm hover:bg-red-700"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}

            {/* Location Preview */}
            {selectedLocation && (
              <div className="mt-3 flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
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

            <div className="flex items-center justify-between mt-3">
              <div className="flex space-x-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="text-indigo-600 hover:text-indigo-700 cursor-pointer">
                  <i className="fas fa-image text-xl"></i>
                </label>
                
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload" className="text-indigo-600 hover:text-indigo-700 cursor-pointer">
                  <i className="fas fa-video text-xl"></i>
                </label>
                
                <button 
                  onClick={handleLocationSelect}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  <i className="fas fa-map-marker-alt text-xl"></i>
                </button>
              </div>
              <button
                onClick={handleCreatePost}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Zdieľať
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-8 text-center`}>
          <i className="fas fa-newspaper text-4xl text-gray-400 mb-4"></i>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Zatiaľ tu nie sú žiadne príspevky. Buďte prvý, kto niečo zdieľa!
          </p>
        </div>
      ) : (
        posts.map(post => (
        <div key={post.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm mb-4 slide-in`}>
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

          {/* Post Image */}
          {post.image && (
            <img 
              src={post.image}
              alt="Post"
              className="w-full max-h-96 object-cover"
            />
          )}

          {/* Reactions */}
          {post.reactions.length > 0 && (
            <div className="px-4 pt-3 flex items-center space-x-1">
              {post.reactions.map((emoji, idx) => (
                <span key={idx} className="text-lg">{emoji}</span>
              ))}
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} ml-2`}>
                {post.likes} reakcií
              </span>
            </div>
          )}

          {/* Actions */}
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-around relative`}>
            {/* Like button - hide for own posts */}
            {post.author.uid !== user.uid && (
              <button 
                onClick={() => setShowEmojiPicker(showEmojiPicker === post.id ? null : post.id)}
                className={`flex items-center space-x-2 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
              >
                <i className="far fa-thumbs-up"></i>
                <span>Páči sa mi</span>
              </button>
            )}
            
            {showEmojiPicker === post.id && (
              <div className="absolute bottom-12 left-4 bg-white dark:bg-gray-700 rounded-lg shadow-lg p-2 flex space-x-2">
                {['👍', '❤️', '😂', '😮', '😢', '👏'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(post.id, emoji)}
                    className="text-2xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

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
              <i className="far fa-share"></i>
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
    </div>
  );
}

export default Feed;