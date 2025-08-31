import React from 'react';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="text-center">
        <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-white text-xl mt-4">Načítavam...</h2>
      </div>
    </div>
  );
}

export default LoadingScreen;