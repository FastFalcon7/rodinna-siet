import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { db } from '../../firebase/config';
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs
} from 'firebase/firestore';
import { PostSkeleton } from '../Shared/SkeletonLoader';
import LazyImage from '../Shared/LazyImage';

/**
 * InfiniteScrollFeed - Feed s infinite scrollingom
 * Načítava príspevky po dávkach (10 naraz)
 */
function InfiniteScrollFeed({ PostComponent }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const observerTarget = useRef(null);

  const POSTS_PER_PAGE = 10;

  // Počiatočné načítanie príspevkov
  useEffect(() => {
    loadInitialPosts();
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadingMore, lastVisible]);

  const loadInitialPosts = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(POSTS_PER_PAGE)
      );

      const querySnapshot = await getDocs(q);
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
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === POSTS_PER_PAGE);
      setLoading(false);
    } catch (error) {
      console.error('Error loading posts:', error);
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (!lastVisible || loadingMore) return;

    try {
      setLoadingMore(true);
      const q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(POSTS_PER_PAGE)
      );

      const querySnapshot = await getDocs(q);
      const newPosts = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        newPosts.push({
          id: doc.id,
          ...data,
          timestamp: data.createdAt ? formatTimestamp(data.createdAt.toDate()) : 'Práve teraz'
        });
      });

      setPosts(prev => [...prev, ...newPosts]);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === POSTS_PER_PAGE);
      setLoadingMore(false);
    } catch (error) {
      console.error('Error loading more posts:', error);
      setLoadingMore(false);
    }
  };

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

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {posts.length === 0 ? (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-8 text-center`}>
          <i className="fas fa-newspaper text-5xl text-gray-400 mb-4"></i>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Zatiaľ tu nie sú žiadne príspevky. Buďte prvý, kto niečo zdieľa!
          </p>
        </div>
      ) : (
        <>
          {posts.map(post => (
            <PostComponent key={post.id} post={post} />
          ))}

          {/* Intersection observer target */}
          <div ref={observerTarget} className="py-4">
            {loadingMore && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Načítavam ďalšie príspevky...
                </p>
              </div>
            )}
            {!hasMore && posts.length > 0 && (
              <div className="text-center">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <i className="fas fa-check-circle mr-2"></i>
                  To je všetko! Načítali ste všetky príspevky.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default InfiniteScrollFeed;
