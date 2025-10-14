import React, { useState } from 'react';
import Files from './Files';
import Departments from './Departments';
import Staff from './Staff';
import FileHistory from './FileHistory';

function App() {
  const [view, setView] = useState('files');

  const renderView = () => {
    switch (view) {
      case 'files':
        return <Files />;
      case 'departments':
        return <Departments />;
      case 'staff':
        return <Staff />;
      case 'file-history':
        return <FileHistory />;
      default:
        return <Files />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-green-500">Dashboard</h1>
        </div>
        <nav className="mt-5">
          <a href="#" onClick={() => setView('files')} className={`flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 ${view === 'files' ? 'bg-gray-200' : ''}`}>
            Files
          </a>
          <a href="#" onClick={() => setView('departments')} className={`flex items-center px-4 py-2 mt-2 text-gray-700 hover:bg-gray-200 ${view === 'departments' ? 'bg-gray-200' : ''}`}>
            Departments
          </a>
          <a href="#" onClick={() => setView('staff')} className={`flex items-center px-4 py-2 mt-2 text-gray-700 hover:bg-gray-200 ${view === 'staff' ? 'bg-gray-200' : ''}`}>
            Staff
          </a>
          <a href="#" onClick={() => setView('file-history')} className={`flex items-center px-4 py-2 mt-2 text-gray-700 hover:bg-gray-200 ${view === 'file-history' ? 'bg-gray-200' : ''}`}>
            File History
          </a>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 p-10">
        {renderView()}
      </div>
    </div>
  );
}

export default App;
