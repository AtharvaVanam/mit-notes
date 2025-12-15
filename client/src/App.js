import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, BookOpen, Search, Download, AlertCircle, CheckCircle, ServerOff, Zap } from 'lucide-react';
import axios from 'axios';

// --- CONFIGURATION ---
const API_URL = 'https://mit-notes.onrender.com/api';

// --- MOCK DATA FOR FALLBACK ---
const MOCK_NOTES = [
  { _id: '1', branch: 'Computer Science', subject: 'Data Structures', topic: 'Binary Trees', description: 'Introduction to BST and AVL trees with time complexity analysis.', filePath: '#' },
  { _id: '2', branch: 'Mechanical', subject: 'Thermodynamics', topic: 'Laws of Thermodynamics', description: 'Summary of 1st and 2nd laws with real-world engine examples.', filePath: '#' },
  { _id: '3', branch: 'Civil', subject: 'Fluid Mechanics', topic: 'Bernoulli Principle', description: 'Derivations, solved examples, and hydraulic applications.', filePath: '#' },
  { _id: '4', branch: 'Electrical', subject: 'Circuit Theory', topic: 'Kirchhoffs Laws', description: 'KCL and KVL explained with complex circuit diagrams.', filePath: '#' },
  { _id: '5', branch: 'Information Technology', subject: 'Web Dev', topic: 'React Hooks', description: 'Deep dive into useState, useEffect and custom hooks.', filePath: '#' },
];

const getBranchColor = (branch) => {
  const colors = {
    'Computer Science': 'bg-blue-100 text-blue-800 border-blue-200',
    'Information Technology': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Mechanical': 'bg-orange-100 text-orange-800 border-orange-200',
    'Civil': 'bg-green-100 text-green-800 border-green-200',
    'Electrical': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Electronics': 'bg-purple-100 text-purple-800 border-purple-200',
  };
  return colors[branch] || 'bg-gray-100 text-gray-800 border-gray-200';
};

// --- COMPONENTS ---

const Navbar = () => (
  <nav className="w-full py-5 px-6 md:px-12 flex justify-between items-center bg-mitCream/80 backdrop-blur-md sticky top-0 z-50 border-b border-stone-200/50">
    <Link to="/" className="flex items-center gap-2 group">
      <div className="bg-mitBlack text-white p-2 rounded-lg group-hover:scale-105 transition-transform">
        <Zap size={20} fill="currentColor" />
      </div>
      <span className="text-2xl font-extrabold tracking-tight text-mitBlack">
        MIT Notes<span className="text-stone-400">.</span>
      </span>
    </Link>
    <div className="flex items-center gap-6 text-sm font-semibold text-mitGrey">
      <Link to="/" className="hover:text-black transition-colors hidden sm:block">Browse</Link>
      <Link to="/upload" className="flex items-center gap-2 px-5 py-2.5 bg-mitBlack text-white rounded-full hover:bg-stone-800 transition-all hover:shadow-lg hover:-translate-y-0.5">
        <Upload size={16} />
        <span>Upload</span>
      </Link>
    </div>
  </nav>
);

const Footer = () => (
  <footer className="w-full py-12 bg-white border-t border-stone-100 text-center mt-20">
    <h3 className="text-mitBlack font-bold text-lg mb-2">MIT Notes</h3>
    <p className="text-stone-500 text-sm mb-6">Free. Anonymous. For Students.</p>
    <div className="text-xs text-stone-400 font-medium">
      Created by <span className="text-mitBlack">Atharva Vanam</span>
    </div>
  </footer>
);

// --- PAGES ---

const Home = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ internal: [], external: null });
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [serverError, setServerError] = useState(false);

  useEffect(() => {
    // Attempt to fetch from backend
    axios.get(`${API_URL}/notes`)
      .then(res => {
        setRecent(res.data);
        setServerError(false);
      })
      .catch(err => {
        // If backend is off OR returns 500 (DB error), use Mock Data seamlessly
        const isBackendError = err.code === 'ERR_NETWORK' || err.response?.status === 500;
        if (!isBackendError) {
           console.error("Could not fetch notes:", err);
        } else {
           console.warn("Backend offline or erroring. Switching to Mock Data.");
        }
        setServerError(true);
        setRecent(MOCK_NOTES); 
      });
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if(!query) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await axios.get(`${API_URL}/search?q=${query}`);
      setResults(res.data);
      setServerError(false);
    } catch (err) {
      setServerError(true);
      // Suppress console errors for expected backend failures (offline/500)
      const isBackendError = err.code === 'ERR_NETWORK' || err.message === 'Network Error' || err.response?.status === 500;
      if (!isBackendError) {
          console.error(err);
      }

      // Fallback Mock Search Logic
      const mockResults = MOCK_NOTES.filter(n => 
        n.subject.toLowerCase().includes(query.toLowerCase()) || 
        n.topic.toLowerCase().includes(query.toLowerCase())
      );
      setResults({ 
        internal: mockResults, 
        external: { 
          title: "Generative Concept Summary", 
          summary: `(Offline Mode) Since the backend is disconnected, we can't search live files for "${query}". However, typically this topic involves fundamental engineering concepts found in standard curriculum.` 
        } 
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-mitCream flex flex-col items-center pt-24 px-4 sm:px-6">
      
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto"
      >
        <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wider text-stone-500 uppercase bg-stone-100 rounded-full">
          Anonymous Study Platform
        </span>
        <h1 className="text-5xl md:text-7xl font-black text-mitBlack mb-6 tracking-tight leading-tight">
          Study Material, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-stone-500 to-black">Simplified.</span>
        </h1>
        <p className="text-stone-600 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          Access thousands of anonymous study notes, exam papers, and summaries. No login required. Just search and learn.
        </p>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto group">
          <div className="absolute inset-0 bg-stone-200 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
          <div className="relative flex items-center bg-white shadow-xl rounded-full overflow-hidden border border-stone-100 p-2">
            <Search className="ml-4 text-stone-400" size={24} />
            <input 
              type="text" 
              placeholder="Search subject, topic, or keyword..." 
              className="w-full p-4 outline-none text-mitBlack text-lg font-medium placeholder:text-stone-300"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="bg-mitBlack text-white px-8 py-3 rounded-full font-bold hover:bg-stone-800 transition-all active:scale-95">
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Results Section */}
      <div className="w-full max-w-6xl mt-24 pb-20">
        
        {serverError && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mb-8 bg-orange-50 border border-orange-100 text-orange-800 p-4 rounded-xl flex items-center gap-3 text-sm font-medium shadow-sm">
            <ServerOff size={18} />
            <span>Backend offline. Displaying <b>Demo Notes</b> for visualization.</span>
          </motion.div>
        )}

        {/* AI Knowledge Card */}
        <AnimatePresence>
          {results.external && (
             <motion.div 
               initial={{ opacity: 0, y: 20 }} 
               animate={{ opacity: 1, y: 0 }} 
               exit={{ opacity: 0, height: 0 }}
               className="mb-10 bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-8 rounded-2xl shadow-sm"
             >
               <div className="flex items-center gap-2 text-blue-700 mb-3">
                 <BookOpen size={20} />
                 <h3 className="font-bold tracking-wide uppercase text-xs">Knowledge Base</h3>
               </div>
               <h4 className="font-bold text-2xl text-mitBlack mb-3">{results.external.title}</h4>
               <p className="text-stone-600 leading-relaxed">{results.external.summary}</p>
             </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-mitBlack flex items-center gap-2">
            {hasSearched ? 'Search Results' : 'Recent Uploads'}
            <span className="text-sm font-normal text-stone-400 bg-stone-100 px-2 py-1 rounded-md">
              {(hasSearched ? results.internal : recent).length}
            </span>
          </h3>
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {(hasSearched ? results.internal : recent).map((note, index) => (
            <motion.div 
              key={note._id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white p-7 rounded-2xl shadow-sm border border-stone-100 hover:shadow-xl hover:border-stone-200 transition-all group flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getBranchColor(note.branch)}`}>
                    {note.branch}
                  </span>
                  <div className="text-stone-300 group-hover:text-black transition-colors">
                    <FileText size={20} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-mitBlack mb-2 line-clamp-1">{note.subject}</h3>
                <p className="text-stone-500 font-medium text-sm mb-4">{note.topic}</p>
                <p className="text-stone-400 text-sm line-clamp-2 leading-relaxed">{note.description}</p>
              </div>
              
              <a 
                href={note.filePath.startsWith('http') ? note.filePath : `${API_URL.replace('/api', '')}/${note.filePath}`}
                target="_blank" 
                rel="noreferrer"
                onClick={(e) => { if(note.filePath === '#') { e.preventDefault(); alert("This is a demo note. Start backend to download real files."); } }}
                className="mt-8 flex items-center justify-center gap-2 w-full py-3 bg-stone-50 text-mitBlack font-bold rounded-xl group-hover:bg-mitBlack group-hover:text-white transition-all"
              >
                Download PDF <Download size={16} />
              </a>
            </motion.div>
          ))}
        </div>
        
        {hasSearched && results.internal.length === 0 && !results.external && (
          <div className="text-center py-20">
            <p className="text-stone-400 text-lg">No notes found for "{query}".</p>
            <button onClick={() => {setQuery(''); setHasSearched(false)}} className="mt-4 text-mitBlack font-semibold underline">Clear Search</button>
          </div>
        )}
      </div>
    </div>
  );
};

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({ branch: 'Computer Science', subject: '', topic: '', description: '' });
  const [status, setStatus] = useState(null); 
  const navigate = useNavigate();

  const branches = ['Computer Science', 'Information Technology', 'Mechanical', 'Civil', 'Electrical', 'Electronics', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!file) return alert('Please select a PDF');
    setStatus('uploading');

    const data = new FormData();
    data.append('file', file);
    Object.keys(formData).forEach(key => data.append(key, formData[key]));

    try {
      await axios.post(`${API_URL}/upload`, data);
      setStatus('success');
      setFormData({ branch: 'Computer Science', subject: '', topic: '', description: '' });
      setFile(null);
      // Optional: Redirect to home after successful upload
      // navigate('/'); 
    } catch (err) {
      // Check for Network Error OR Server Error (500) for demo fallback
      const isBackendError = err.message === 'Network Error' || err.code === 'ERR_NETWORK' || err.response?.status === 500;
      
      if (isBackendError) {
         // Fallback for demo mode
         setStatus('success');
         alert("Server disconnected or error. Demo upload simulated.");
         setFormData({ branch: 'Computer Science', subject: '', topic: '', description: '' });
         setFile(null);
      } else {
         console.error(err);
         setStatus('error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-mitCream flex items-center justify-center px-4 py-20">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-white p-10 rounded-3xl shadow-2xl border border-stone-100"
      >
        <div className="mb-8">
          <h2 className="text-3xl font-black text-mitBlack mb-2">Upload Notes</h2>
          <p className="text-stone-500">Share your knowledge anonymously.</p>
        </div>
        
        {status === 'success' && (
          <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 mb-6 border border-green-100">
            <CheckCircle size={20} /> 
            <span className="font-medium">Upload successful! Thank you.</span>
          </motion.div>
        )}
        {status === 'error' && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 mb-6 border border-red-100">
            <AlertCircle size={20} /> 
            <span className="font-medium">Upload failed. Check file type.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Branch</label>
            <select 
              className="w-full p-4 bg-mitCream/50 rounded-xl outline-none border border-transparent focus:border-mitBlack focus:bg-white transition-all font-medium"
              value={formData.branch}
              onChange={e => setFormData({...formData, branch: e.target.value})}
            >
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
               <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Subject</label>
               <input required type="text" placeholder="e.g. Physics" className="w-full p-4 bg-mitCream/50 rounded-xl outline-none border border-transparent focus:border-mitBlack focus:bg-white transition-all font-medium" 
                 value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
            </div>
            <div className="space-y-1">
               <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Topic</label>
               <input required type="text" placeholder="e.g. Gravity" className="w-full p-4 bg-mitCream/50 rounded-xl outline-none border border-transparent focus:border-mitBlack focus:bg-white transition-all font-medium"
                 value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Description</label>
            <textarea className="w-full p-4 bg-mitCream/50 rounded-xl outline-none border border-transparent focus:border-mitBlack focus:bg-white transition-all font-medium h-28 resize-none"
              placeholder="Briefly describe what's inside..."
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>

          <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center cursor-pointer hover:bg-stone-50 hover:border-stone-400 transition-all relative group">
            <input type="file" accept="application/pdf" className="absolute inset-0 opacity-0 cursor-pointer z-10"
              onChange={e => setFile(e.target.files[0])}
            />
            <div className="bg-white p-3 rounded-full shadow-sm inline-block mb-3 group-hover:scale-110 transition-transform">
               <Upload className="text-stone-800" size={24} />
            </div>
            <p className="text-sm font-bold text-stone-600">{file ? file.name : "Click to browse PDF"}</p>
            <p className="text-xs text-stone-400 mt-1">Max file size 10MB</p>
          </div>

          <button type="submit" disabled={status === 'uploading'} className="w-full py-4 bg-mitBlack text-white font-bold text-lg rounded-xl hover:bg-stone-800 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all">
            {status === 'uploading' ? 'Uploading...' : 'Publish Notes'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <div className="font-sans antialiased text-mitBlack bg-mitCream min-h-screen selection:bg-black selection:text-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<UploadPage />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
};

export default App;