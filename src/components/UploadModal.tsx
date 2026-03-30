import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Plus, Trash2, Image as ImageIcon, Film, Loader2 } from 'lucide-react';
import { CURATED_TAGS } from '../constants';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { db, collection, addDoc, serverTimestamp, handleFirestoreError, OperationType, storage, ref, uploadBytes, getDownloadURL, setDoc, doc } from '../firebase';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FileWithMetadata {
  id: string;
  file: File;
  type: 'image' | 'video';
  name: string;
  previewUrl: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [customTag, setCustomTag] = React.useState('');
  const [files, setFiles] = React.useState<FileWithMetadata[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTag.trim()) {
      if (!selectedTags.includes(customTag.trim())) {
        setSelectedTags(prev => [...prev, customTag.trim()]);
      }
      setCustomTag('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files || []) as File[];
    const newFiles = fileList.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      type: file.type.startsWith('video') ? 'video' as const : 'image' as const,
      name: file.name,
      previewUrl: URL.createObjectURL(file)
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) URL.revokeObjectURL(fileToRemove.previewUrl);
      return prev.filter(f => f.id !== id);
    });
  };

  const handlePublish = async () => {
    if (!user || !title || files.length === 0) return;

    setLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      // 1. Upload files to Firebase Storage
      const uploadedUrls = await Promise.all(
        files.map(async (fileData, index) => {
          const storageRef = ref(storage, `projects/${user.uid}/${Date.now()}_${fileData.name}`);
          const snapshot = await uploadBytes(storageRef, fileData.file);
          const url = await getDownloadURL(snapshot.ref);
          setUploadProgress(((index + 1) / files.length) * 100);
          return url;
        })
      );

      // 2. Save project metadata to Firestore
      const projectId = doc(collection(db, 'projects')).id;
      const projectData = {
        id: projectId,
        title,
        description,
        imageUrl: uploadedUrls[0], // Use the first file as the main image
        category: selectedTags[0] || 'Uncategorized',
        tags: selectedTags,
        authorUid: user.uid,
        authorName: user.displayName || 'Anonymous Artist',
        authorPhoto: user.photoURL || '',
        likesCount: 0,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'projects', projectId), projectData);
      console.log('Project published with ID:', projectId);
      
      // Cleanup previews
      files.forEach(f => URL.revokeObjectURL(f.previewUrl));
      
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setSelectedTags([]);
      setFiles([]);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'projects');
      setError('FAILED TO PUBLISH PROJECT. PLEASE TRY AGAIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-manus-dark/90 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-manus-dark border border-manus-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-manus-white/10">
              <h2 className="text-2xl font-display font-black text-manus-white uppercase tracking-widest">
                CREATE PROJECT FOLDER
              </h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-manus-white/10 transition-colors"
              >
                <X className="w-6 h-6 text-manus-white" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left Column: Details */}
                <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-black text-manus-white/40 uppercase tracking-[0.2em] mb-3">
                      PROJECT TITLE
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. THE OBSIDIAN SPIRE"
                      className="w-full bg-manus-white/5 border border-manus-white/10 rounded-2xl py-4 px-6 text-manus-white placeholder:text-manus-white/20 focus:outline-none focus:border-manus-orange transition-colors font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-manus-white/40 uppercase tracking-[0.2em] mb-3">
                      DESCRIPTION
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell us about your process, inspiration, and tools..."
                      className="w-full bg-manus-white/5 border border-manus-white/10 rounded-2xl py-4 px-6 text-manus-white placeholder:text-manus-white/20 focus:outline-none focus:border-manus-orange transition-colors font-medium resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-manus-white/40 uppercase tracking-[0.2em] mb-3">
                      TAGS (CURATED & CUSTOM)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedTags.map(tag => (
                        <span 
                          key={tag}
                          className="flex items-center gap-2 px-3 py-1 rounded-full bg-manus-cyan text-manus-dark text-[10px] font-black uppercase tracking-wider"
                        >
                          {tag}
                          <X 
                            className="w-3 h-3 cursor-pointer hover:scale-110 transition-transform" 
                            onClick={() => toggleTag(tag)}
                          />
                        </span>
                      ))}
                    </div>
                    <div className="relative mb-4">
                      <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-manus-white/40" />
                      <input
                        type="text"
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        onKeyDown={addCustomTag}
                        placeholder="ADD CUSTOM TAG AND PRESS ENTER..."
                        className="w-full bg-manus-white/5 border border-manus-white/10 rounded-full py-3 pl-12 pr-6 text-[10px] font-black text-manus-white placeholder:text-manus-white/20 focus:outline-none focus:border-manus-cyan transition-colors uppercase tracking-widest"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-manus-white/5 rounded-2xl bg-manus-white/5 no-scrollbar">
                      {CURATED_TAGS.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all",
                            selectedTags.includes(tag)
                              ? "bg-manus-cyan text-manus-dark border-manus-cyan"
                              : "border-manus-white/10 text-manus-white/40 hover:border-manus-white/30 hover:text-manus-white"
                          )}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Files */}
                <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-black text-manus-white/40 uppercase tracking-[0.2em] mb-3">
                      PROJECT FILES (STILLS & VIDEO)
                    </label>
                    <div className="relative group">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="border-2 border-dashed border-manus-white/10 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 group-hover:border-manus-orange group-hover:bg-manus-orange/5 transition-all">
                        <div className="w-16 h-16 rounded-full bg-manus-white/5 flex items-center justify-center group-hover:bg-manus-orange/20 transition-colors">
                          <Upload className="w-8 h-8 text-manus-white/40 group-hover:text-manus-orange" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-manus-white mb-1">DRAG & DROP OR CLICK TO UPLOAD</p>
                          <p className="text-[10px] font-bold text-manus-white/40 uppercase tracking-widest">JPG, PNG, GIF, MP4 (MAX 50MB)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {files.map(file => (
                      <div 
                        key={file.id}
                        className="flex items-center justify-between p-4 rounded-2xl bg-manus-white/5 border border-manus-white/10 group overflow-hidden relative"
                      >
                        {loading && (
                          <motion.div 
                            className="absolute bottom-0 left-0 h-1 bg-manus-cyan"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                          />
                        )}
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-manus-white/10 flex-shrink-0">
                            {file.type === 'image' ? (
                              <img src={file.previewUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Film className="w-5 h-5 text-manus-orange" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-manus-white truncate max-w-[150px]">
                              {file.name}
                            </span>
                            <span className="text-[8px] font-mono text-manus-white/20 uppercase tracking-widest">
                              {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeFile(file.id)}
                          disabled={loading}
                          className="p-2 rounded-full hover:bg-red-500/20 text-manus-white/20 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 disabled:hidden"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-manus-white/10 flex flex-col items-end gap-4 bg-manus-dark/50 backdrop-blur-md">
              {error && (
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">
                  {error}
                </p>
              )}
              <div className="flex items-center justify-end gap-4 w-full">
                <button 
                  onClick={onClose}
                  disabled={loading}
                  className="px-8 py-3 rounded-full text-xs font-black text-manus-white/40 hover:text-manus-white uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handlePublish}
                  disabled={!title || files.length === 0 || loading}
                  className="px-12 py-4 rounded-full bg-manus-orange text-manus-white font-black text-sm uppercase tracking-widest shadow-lg shadow-manus-orange/20 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      PUBLISHING...
                    </>
                  ) : (
                    'PUBLISH PROJECT'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
