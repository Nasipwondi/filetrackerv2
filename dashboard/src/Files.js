import React, { useState } from 'react';

function Files() {
  const [files, setFiles] = useState([
    { id: 1, name: 'file1.txt' },
    { id: 2, name: 'file2.txt' },
    { id: 3, name: 'file3.txt' },
  ]);
  const [newFileName, setNewFileName] = useState('');
  const [editingFile, setEditingFile] = useState(null);

  const handleAddFile = () => {
    if (newFileName.trim() !== '') {
      setFiles([...files, { id: Date.now(), name: newFileName }]);
      setNewFileName('');
    }
  };

  const handleDeleteFile = (id) => {
    setFiles(files.filter((file) => file.id !== id));
  };

  const handleEditFile = (file) => {
    setEditingFile(file);
    setNewFileName(file.name);
  };

  const handleUpdateFile = () => {
    setFiles(
      files.map((file) =>
        file.id === editingFile.id ? { ...file, name: newFileName } : file
      )
    );
    setNewFileName('');
    setEditingFile(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Files</h1>

      <div className="mt-4">
        <input
          type="text"
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          className="p-2 border border-gray-300 rounded"
          placeholder="New file name"
        />
        {editingFile ? (
          <button
            onClick={handleUpdateFile}
            className="p-2 ml-2 text-white bg-green-500 rounded"
          >
            Update File
          </button>
        ) : (
          <button
            onClick={handleAddFile}
            className="p-2 ml-2 text-white bg-green-500 rounded"
          >
            Add File
          </button>
        )}
      </div>

      <ul className="mt-4">
        {files.map((file) => (
          <li key={file.id} className="flex items-center justify-between p-2 mt-2 bg-white rounded shadow">
            <span>{file.name}</span>
            <div>
              <button
                onClick={() => handleEditFile(file)}
                className="p-1 mr-2 text-white bg-blue-500 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteFile(file.id)}
                className="p-1 text-white bg-red-500 rounded"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Files;