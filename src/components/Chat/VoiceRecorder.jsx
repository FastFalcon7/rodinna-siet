import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * VoiceRecorder - Nahrávanie hlasových správ
 * Používa MediaRecorder API
 */
function VoiceRecorder({ onRecordingComplete, onCancel }) {
  const { darkMode } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Chyba pri prístupe k mikrofónu. Skontrolujte povolenia.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      clearInterval(timerRef.current);
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    onCancel();
  };

  const handleSend = () => {
    if (audioURL && audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      onRecordingComplete({
        blob: audioBlob,
        duration: recordingTime,
        url: audioURL
      });
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t p-4`}>
      {!audioURL ? (
        // Recording UI
        <div className="flex items-center space-x-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all animate-pulse"
            >
              <i className="fas fa-microphone text-xl"></i>
            </button>
          ) : (
            <>
              <div className="flex items-center space-x-2 flex-1">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                <span className={`font-mono text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {formatTime(recordingTime)}
                </span>
              </div>

              {isPaused ? (
                <button
                  onClick={resumeRecording}
                  className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700"
                >
                  <i className="fas fa-play"></i>
                </button>
              ) : (
                <button
                  onClick={pauseRecording}
                  className="p-3 bg-yellow-600 text-white rounded-full hover:bg-yellow-700"
                >
                  <i className="fas fa-pause"></i>
                </button>
              )}

              <button
                onClick={stopRecording}
                className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700"
              >
                <i className="fas fa-stop"></i>
              </button>
            </>
          )}

          <button
            onClick={handleCancel}
            className="p-3 bg-gray-600 text-white rounded-full hover:bg-gray-700"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      ) : (
        // Preview UI
        <div className="space-y-3">
          <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-xl p-4`}>
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePlayback}
                className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700"
              >
                <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
              </button>

              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <i className="fas fa-microphone text-indigo-600"></i>
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    Hlasová správa
                  </span>
                </div>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatTime(recordingTime)}
                </span>
              </div>

              {/* Waveform visualization (simplified) */}
              <div className="flex items-center space-x-1">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 bg-indigo-600 rounded-full ${
                      isPlaying ? 'animate-pulse' : ''
                    }`}
                    style={{
                      height: `${Math.random() * 20 + 10}px`,
                      animationDelay: `${i * 50}ms`
                    }}
                  />
                ))}
              </div>
            </div>

            <audio
              ref={audioRef}
              src={audioURL}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Zrušiť
            </button>
            <button
              onClick={handleSend}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2"
            >
              <i className="fas fa-paper-plane"></i>
              <span>Odoslať</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * VoiceMessage - Zobrazenie hlasovej správy
 */
export function VoiceMessage({ url, duration, sender, isMe }) {
  const { darkMode } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center space-x-3 p-3 rounded-xl max-w-xs ${
      isMe
        ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white'
        : darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
    }`}>
      <button
        onClick={togglePlayback}
        className={`p-2 rounded-full ${
          isMe ? 'bg-indigo-800 hover:bg-indigo-900' : 'bg-indigo-600 hover:bg-indigo-700'
        } text-white flex-shrink-0`}
      >
        <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-sm`}></i>
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-1 mb-1">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className={`w-0.5 rounded-full ${
                isMe ? 'bg-indigo-200' : 'bg-indigo-600'
              } ${isPlaying ? 'animate-pulse' : ''}`}
              style={{
                height: `${Math.random() * 16 + 8}px`,
                animationDelay: `${i * 40}ms`
              }}
            />
          ))}
        </div>
        <p className="text-xs opacity-75">
          {formatTime(currentTime)} / {formatTime(duration)}
        </p>
      </div>

      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  );
}

export default VoiceRecorder;
