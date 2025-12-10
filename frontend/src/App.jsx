
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Save, Search, Plus, X, Pin, Trash2, Edit2, Tag, Folder, LogOut, User } from 'lucide-react';

// API Configuration
const API_URL = 'https://voice-to-text-notesapp.onrender.com/api';


const api = {
  async request(url, options = {}) {
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
  },
  get(url) { return this.request(url); },
  post(url, data) { return this.request(url, { method: 'POST', body: JSON.stringify(data) }); },
  put(url, data) { return this.request(url, { method: 'PUT', body: JSON.stringify(data) }); },
  delete(url) { return this.request(url, { method: 'DELETE' }); },
  async uploadAudio(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    const response = await fetch(`${API_URL}/transcribe`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Transcription failed');
    return data;
  },
};


export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await api.get('/auth/me');
      setUser(data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return user ? <Dashboard user={user} setUser={setUser} /> : <AuthPage setUser={setUser} />;
}

// Auth Page Component
function AuthPage({ setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;
      
      const data = await api.post(endpoint, payload);
      
      if (data.success) {
        if (isLogin) {
          setUser(data.user);
        } else {
          setUser(data.user);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <Mic className="w-10 h-10 text-white mr-3" />
          <h1 className="text-3xl font-bold text-white">Voice Notes</h1>
        </div>
        
        <div className="flex mb-6 bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-md transition ${isLogin ? 'bg-white text-gray-900' : 'text-white'}`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-md transition ${!isLogin ? 'bg-white text-gray-900' : 'text-white'}`}
          >
            Register
          </button>
        </div>

        <div className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
            required
          />
          
          {error && (
            <div className={`p-3 rounded-lg text-sm ${error.includes('successful') ? 'bg-green-600' : 'bg-red-600'} text-white`}>
              {error}
            </div>
          )}
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Dashboard Component
function Dashboard({ user, setUser }) {
  const [notes, setNotes] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const data = await api.get('/notes');
      setNotes(data);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const deleteNote = async (id) => {
    if (!confirm('Delete this note?')) return;
    try {
      await api.delete(`/notes/${id}`);
      setNotes(notes.filter(n => n._id !== id));
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const togglePin = async (note) => {
    try {
      const updated = await api.put(`/notes/${note._id}`, { pinned: !note.pinned });
      setNotes(notes.map(n => n._id === note._id ? updated : n));
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const categories = ['all', ...new Set(notes.map(n => n.category).filter(Boolean))];
  
  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchQuery || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || note.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-900">
      
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Mic className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Voice Notes</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-white">
              <User className="w-5 h-5" />
              <span>{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => { setEditingNote(null); setShowEditor(true); }}
            className="flex items-center space-x-2 px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            <Plus className="w-5 h-5" />
            <span>New Note</span>
          </button>
        </div>

       
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(note => (
            <div key={note._id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-white font-semibold text-lg flex-1 mr-2">{note.title}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => togglePin(note)}
                    className={`p-1 rounded ${note.pinned ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setEditingNote(note); setShowEditor(true); }}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteNote(note._id)}
                    className="p-1 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm mb-3 line-clamp-3">{note.content}</p>
              
              <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  {note.category && (
                    <span className="flex items-center space-x-1 px-2 py-1 bg-gray-700 text-gray-300 rounded">
                      <Folder className="w-3 h-3" />
                      <span>{note.category}</span>
                    </span>
                  )}
                </div>
                
                {note.tags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Tag className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-400">{note.tags.length}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredNotes.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Mic className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No notes found</p>
          </div>
        )}
      </div>

     
      {showEditor && (
        <NoteEditor
          note={editingNote}
          onClose={() => { setShowEditor(false); setEditingNote(null); }}
          onSave={(savedNote) => {
            if (editingNote) {
              setNotes(notes.map(n => n._id === savedNote._id ? savedNote : n));
            } else {
              setNotes([savedNote, ...notes]);
            }
            setShowEditor(false);
            setEditingNote(null);
          }}
        />
      )}
    </div>
  );
}

// Note Editor Component with OpenAI Whisper
function NoteEditor({ note, onClose, onSave }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [category, setCategory] = useState(note?.category || '');
  const [tags, setTags] = useState(note?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording. Please ensure microphone permissions are granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    setIsTranscribing(true);
    try {
      console.log('Starting transcription...', {
        size: audioBlob.size,
        type: audioBlob.type
      });
      
      const result = await api.uploadAudio(audioBlob);
      
      console.log('Transcription result:', result);
      
      if (result.success && result.transcription) {
        // Append transcription to content with a space
        setContent(prev => prev ? `${prev} ${result.transcription}` : result.transcription);
      } else {
        throw new Error('No transcription returned from server');
      }
    } catch (error) {
      console.error('Transcription failed:', error);
      
      let errorMessage = 'Failed to transcribe audio';
      if (error.message.includes('API key')) {
        errorMessage = 'OpenAI API key not configured. Please check your server .env file.';
      } else if (error.message.includes('Invalid')) {
        errorMessage = 'Invalid API key. Please check your OpenAI API key.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage + '\n\nPlease check the console for more details.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required');
      return;
    }

    setSaving(true);
    try {
      const payload = { title, content, category, tags, pinned: note?.pinned || false };
      const savedNote = note
        ? await api.put(`/notes/${note._id}`, payload)
        : await api.post('/notes', payload);
      
      onSave(savedNote);
    } catch (error) {
      alert('Failed to save note: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {note ? 'Edit Note' : 'New Note'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Note Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-lg font-semibold"
            />

            <div className="relative">
              <textarea
                placeholder="Note content... (Click mic to record)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white min-h-[200px]"
                disabled={isTranscribing}
              />
              <button
                onClick={toggleRecording}
                disabled={isTranscribing}
                className={`absolute bottom-4 right-4 p-3 rounded-full transition ${
                  isRecording 
                    ? 'bg-red-500 animate-pulse' 
                    : isTranscribing 
                    ? 'bg-yellow-500' 
                    : 'bg-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isRecording ? (
                  <MicOff className="w-6 h-6 text-white" />
                ) : (
                  <Mic className={`w-6 h-6 ${isTranscribing ? 'text-white' : 'text-gray-900'}`} />
                )}
              </button>
              {isTranscribing && (
                <div className="absolute bottom-4 left-4 text-yellow-400 text-sm">
                  Transcribing...
                </div>
              )}
            </div>

            <input
              type="text"
              placeholder="Category (e.g., Work, Personal)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
            />

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button
                  onClick={addTag}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
                >
                  Add
                </button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, idx) => (
                    <span key={idx} className="flex items-center space-x-1 px-3 py-1 bg-gray-700 text-white rounded-full text-sm">
                      <Tag className="w-3 h-3" />
                      <span>{tag}</span>
                      <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={saving || isTranscribing}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Save Note'}</span>
            </button>
            <button
              onClick={onClose}
              disabled={isTranscribing}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


