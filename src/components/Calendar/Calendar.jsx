import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  getDocs
} from 'firebase/firestore';

function Calendar() {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);

  // Form states
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventType, setEventType] = useState('meeting');
  const [eventDescription, setEventDescription] = useState('');
  const [eventAttendees, setEventAttendees] = useState('all'); // 'all', 'selected', 'me'
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [reminderTime, setReminderTime] = useState('1hour');
  const [repeatOption, setRepeatOption] = useState('none');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef(null);

  // Load events
  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventsData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filtrovanie udalostí pre aktuálneho užívateľa
        if (
          data.attendees === 'all' ||
          (data.attendees === 'me' && data.createdBy === user.uid) ||
          (data.attendees === 'selected' && data.selectedMembers?.includes(user.uid))
        ) {
          eventsData.push({
            id: doc.id,
            ...data
          });
        }
      });
      setEvents(eventsData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading events:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Load family members
  useEffect(() => {
    const loadFamilyMembers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const members = usersSnapshot.docs
          .map(doc => ({
            uid: doc.id,
            ...doc.data()
          }))
          .filter(member => member.uid !== user.uid);
        setFamilyMembers(members);
      } catch (error) {
        console.error('Error loading family members:', error);
      }
    };

    loadFamilyMembers();
  }, [user]);

  // Close modal on outside click
  useEffect(() => {
    const handleModalClick = (event) => {
      if (modalRef.current && event.target === modalRef.current) {
        closeModal();
      }
    };

    if (showNewEventModal) {
      document.addEventListener('mousedown', handleModalClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleModalClick);
    };
  }, [showNewEventModal]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showNewEventModal || showEventDetail) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showNewEventModal, showEventDetail]);

  const openModal = () => {
    setShowNewEventModal(true);
  };

  const closeModal = () => {
    setShowNewEventModal(false);
    resetForm();
  };

  const resetForm = () => {
    setEventTitle('');
    setEventDate('');
    setEventTime('');
    setEventType('meeting');
    setEventDescription('');
    setEventAttendees('all');
    setSelectedMembers([]);
    setReminderTime('1hour');
    setRepeatOption('none');
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim() || !eventDate) return;

    setIsSubmitting(true);
    try {
      const eventData = {
        title: eventTitle,
        date: eventDate,
        time: eventTime || '00:00',
        type: eventType,
        description: eventDescription,
        attendees: eventAttendees,
        selectedMembers: eventAttendees === 'selected' ? selectedMembers : [],
        reminder: reminderTime,
        repeat: repeatOption,
        createdBy: user.uid,
        createdByName: user.name,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'events'), eventData);
      closeModal();
    } catch (error) {
      console.error('Error creating event:', error);
      alert(`Chyba pri vytváraní udalosti: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Ste si istý, že chcete zmazať túto udalosť?')) return;

    try {
      await deleteDoc(doc(db, 'events', eventId));
      setShowEventDetail(null);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const toggleMemberSelection = (memberUid) => {
    setSelectedMembers(prev =>
      prev.includes(memberUid)
        ? prev.filter(uid => uid !== memberUid)
        : [...prev, memberUid]
    );
  };

  const getEventIcon = (type) => {
    const icons = {
      birthday: '🎂',
      meeting: '👥',
      vacation: '🏖️',
      doctor: '🏥',
      school: '🏫',
      work: '💼',
      fun: '🎉',
      other: '📅'
    };
    return icons[type] || '📅';
  };

  const getEventColor = (type) => {
    const colors = {
      birthday: 'bg-pink-500',
      meeting: 'bg-blue-500',
      vacation: 'bg-green-500',
      doctor: 'bg-red-500',
      school: 'bg-yellow-500',
      work: 'bg-purple-500',
      fun: 'bg-indigo-500',
      other: 'bg-gray-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const getCountdown = (date, time) => {
    const eventDateTime = new Date(`${date}T${time || '00:00'}`);
    const now = new Date();
    const diff = eventDateTime - now;

    if (diff < 0) return 'Minulé';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days === 0 && hours === 0) return 'Dnes';
    if (days === 0) return `O ${hours}h`;
    if (days === 1) return 'Zajtra';
    if (days < 7) return `O ${days} dní`;
    if (days < 30) return `O ${Math.floor(days / 7)} týždňov`;
    return `O ${Math.floor(days / 30)} mesiacov`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('sk-SK', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter(event => {
        const eventDate = new Date(`${event.date}T${event.time || '00:00'}`);
        return eventDate >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
        return dateA - dateB;
      })
      .slice(0, 10);
  };

  const upcomingEvents = getUpcomingEvents();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-8 text-center`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Načítavam udalosti...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Nadchádzajúce udalosti
      </h2>

      {/* Upcoming Events List */}
      {upcomingEvents.length === 0 ? (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-8 text-center`}>
          <i className="fas fa-calendar-alt text-4xl text-gray-400 mb-4"></i>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Žiadne nadchádzajúce udalosti
          </p>
          <button
            onClick={openModal}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Vytvoriť udalosť
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingEvents.map(event => (
            <div
              key={event.id}
              onClick={() => setShowEventDetail(event)}
              className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center space-x-4">
                {/* Date badge */}
                <div className={`flex-shrink-0 w-16 h-16 ${getEventColor(event.type)} rounded-lg flex flex-col items-center justify-center text-white`}>
                  <div className="text-2xl">{getEventIcon(event.type)}</div>
                </div>

                {/* Event info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {event.title}
                    </h3>
                    <span className="text-xs text-indigo-600 font-medium ml-2">
                      {getCountdown(event.date, event.time)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-sm text-gray-500">
                      {formatDate(event.date)}
                    </p>
                    {event.time && event.time !== '00:00' && (
                      <>
                        <span className="text-gray-400">•</span>
                        <p className="text-sm text-gray-500">{event.time}</p>
                      </>
                    )}
                  </div>
                  {event.description && (
                    <p className={`text-sm mt-1 truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {event.description}
                    </p>
                  )}
                  {/* Attendees indicator */}
                  <div className="flex items-center space-x-2 mt-2">
                    {event.attendees === 'all' && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
                        <i className="fas fa-users mr-1"></i>
                        Všetci
                      </span>
                    )}
                    {event.attendees === 'me' && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                        <i className="fas fa-user mr-1"></i>
                        Len ja
                      </span>
                    )}
                    {event.attendees === 'selected' && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded-full">
                        <i className="fas fa-user-friends mr-1"></i>
                        Vybraní ({event.selectedMembers?.length || 0})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
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

      {/* New Event Modal */}
      {showNewEventModal && (
        <div
          ref={modalRef}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <div
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} w-full md:max-w-2xl md:rounded-xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col`}
            style={{ animation: 'slideUp 0.3s ease-out' }}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Nová udalosť
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Title */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Názov udalosti *
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Napr. Rodinná oslava"
                  className={`w-full p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-800'
                  }`}
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Dátum *
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className={`w-full p-3 rounded-lg ${
                      darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Čas
                  </label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className={`w-full p-3 rounded-lg ${
                      darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                  />
                </div>
              </div>

              {/* Event Type */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Typ udalosti
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className={`w-full p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <option value="meeting">👥 Stretnutie</option>
                  <option value="birthday">🎂 Narodeniny</option>
                  <option value="vacation">🏖️ Dovolenka</option>
                  <option value="doctor">🏥 Lekár</option>
                  <option value="school">🏫 Škola</option>
                  <option value="work">💼 Práca</option>
                  <option value="fun">🎉 Zábava</option>
                  <option value="other">📅 Iné</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Popis
                </label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Doplňujúce informácie..."
                  rows="3"
                  className={`w-full p-3 rounded-lg resize-none ${
                    darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-800'
                  }`}
                />
              </div>

              {/* Attendees */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Účastníci
                </label>
                <div className="space-y-2">
                  <label className={`flex items-center p-3 rounded-lg cursor-pointer ${
                    eventAttendees === 'all'
                      ? 'bg-indigo-100 dark:bg-indigo-900'
                      : darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <input
                      type="radio"
                      name="attendees"
                      value="all"
                      checked={eventAttendees === 'all'}
                      onChange={(e) => setEventAttendees(e.target.value)}
                      className="mr-3"
                    />
                    <span className={darkMode ? 'text-white' : 'text-gray-800'}>
                      <i className="fas fa-users mr-2"></i>
                      Pre všetkých
                    </span>
                  </label>
                  <label className={`flex items-center p-3 rounded-lg cursor-pointer ${
                    eventAttendees === 'selected'
                      ? 'bg-indigo-100 dark:bg-indigo-900'
                      : darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <input
                      type="radio"
                      name="attendees"
                      value="selected"
                      checked={eventAttendees === 'selected'}
                      onChange={(e) => setEventAttendees(e.target.value)}
                      className="mr-3"
                    />
                    <span className={darkMode ? 'text-white' : 'text-gray-800'}>
                      <i className="fas fa-user-friends mr-2"></i>
                      Vybrať členov
                    </span>
                  </label>
                  <label className={`flex items-center p-3 rounded-lg cursor-pointer ${
                    eventAttendees === 'me'
                      ? 'bg-indigo-100 dark:bg-indigo-900'
                      : darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <input
                      type="radio"
                      name="attendees"
                      value="me"
                      checked={eventAttendees === 'me'}
                      onChange={(e) => setEventAttendees(e.target.value)}
                      className="mr-3"
                    />
                    <span className={darkMode ? 'text-white' : 'text-gray-800'}>
                      <i className="fas fa-user mr-2"></i>
                      Len pre mňa
                    </span>
                  </label>
                </div>
              </div>

              {/* Member selection */}
              {eventAttendees === 'selected' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Vyberte členov
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {familyMembers.map(member => (
                      <label
                        key={member.uid}
                        className={`flex items-center p-3 rounded-lg cursor-pointer ${
                          selectedMembers.includes(member.uid)
                            ? 'bg-indigo-100 dark:bg-indigo-900'
                            : darkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.uid)}
                          onChange={() => toggleMemberSelection(member.uid)}
                          className="mr-3"
                        />
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                        <span className={darkMode ? 'text-white' : 'text-gray-800'}>
                          {member.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Reminder */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Pripomienka
                </label>
                <select
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className={`w-full p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <option value="none">Žiadna</option>
                  <option value="15min">15 minút vopred</option>
                  <option value="1hour">1 hodinu vopred</option>
                  <option value="1day">1 deň vopred</option>
                  <option value="1week">1 týždeň vopred</option>
                </select>
              </div>

              {/* Repeat */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Opakovanie
                </label>
                <select
                  value={repeatOption}
                  onChange={(e) => setRepeatOption(e.target.value)}
                  className={`w-full p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <option value="none">Neopakuje sa</option>
                  <option value="daily">Denne</option>
                  <option value="weekly">Týždenne</option>
                  <option value="monthly">Mesačne</option>
                  <option value="yearly">Ročne</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={handleCreateEvent}
                disabled={!eventTitle.trim() || !eventDate || isSubmitting || (eventAttendees === 'selected' && selectedMembers.length === 0)}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                style={{
                  WebkitTapHighlightColor: 'rgba(79, 70, 229, 0.3)',
                  touchAction: 'manipulation'
                }}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Vytváram...
                  </>
                ) : (
                  'Vytvoriť udalosť'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {showEventDetail && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center"
          onClick={() => setShowEventDetail(null)}
        >
          <div
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} w-full md:max-w-lg md:rounded-xl rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Detail udalosti
              </h2>
              <button
                onClick={() => setShowEventDetail(null)}
                className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <i className={`fas fa-times ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}></i>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 ${getEventColor(showEventDetail.type)} rounded-lg flex items-center justify-center text-4xl`}>
                  {getEventIcon(showEventDetail.type)}
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {showEventDetail.title}
                  </h3>
                  <p className="text-indigo-600 font-medium">
                    {getCountdown(showEventDetail.date, showEventDetail.time)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <i className={`fas fa-calendar w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {formatDate(showEventDetail.date)}
                  </span>
                </div>
                {showEventDetail.time && showEventDetail.time !== '00:00' && (
                  <div className="flex items-center space-x-3">
                    <i className={`fas fa-clock w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {showEventDetail.time}
                    </span>
                  </div>
                )}
                {showEventDetail.description && (
                  <div className="flex items-start space-x-3">
                    <i className={`fas fa-align-left w-5 mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {showEventDetail.description}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <i className={`fas fa-users w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {showEventDetail.attendees === 'all' && 'Všetci členovia'}
                    {showEventDetail.attendees === 'me' && 'Len ja'}
                    {showEventDetail.attendees === 'selected' && `Vybraní členovia (${showEventDetail.selectedMembers?.length || 0})`}
                  </span>
                </div>
                {showEventDetail.reminder !== 'none' && (
                  <div className="flex items-center space-x-3">
                    <i className={`fas fa-bell w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Pripomienka:{' '}
                      {showEventDetail.reminder === '15min' && '15 minút vopred'}
                      {showEventDetail.reminder === '1hour' && '1 hodinu vopred'}
                      {showEventDetail.reminder === '1day' && '1 deň vopred'}
                      {showEventDetail.reminder === '1week' && '1 týždeň vopred'}
                    </span>
                  </div>
                )}
                {showEventDetail.repeat !== 'none' && (
                  <div className="flex items-center space-x-3">
                    <i className={`fas fa-redo w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Opakuje sa:{' '}
                      {showEventDetail.repeat === 'daily' && 'Denne'}
                      {showEventDetail.repeat === 'weekly' && 'Týždenne'}
                      {showEventDetail.repeat === 'monthly' && 'Mesačne'}
                      {showEventDetail.repeat === 'yearly' && 'Ročne'}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <i className={`fas fa-user w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Vytvoril: {showEventDetail.createdByName}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            {showEventDetail.createdBy === user.uid && (
              <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => handleDeleteEvent(showEventDetail.id)}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  <i className="fas fa-trash mr-2"></i>
                  Zmazať udalosť
                </button>
              </div>
            )}
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

export default Calendar;
