import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Tag } from './ProjectCard';
import { ChevronLeft, Share2, Heart, MessageCircle, Bookmark, Loader2, Edit3, Trash2, X, Check } from 'lucide-react';
import { ManiculeBadge } from './ManiculeBadge';
import { ConfirmModal } from './ConfirmModal';
import { db, doc, getDoc, updateDoc, increment, setDoc, deleteDoc, handleFirestoreError, OperationType } from '../firebase';
import { ProjectFolder } from '../types';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = React.useState<ProjectFolder | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [hasLiked, setHasLiked] = React.useState(false);
  const [likeLoading, setLikeLoading] = React.useState(false);
  
  // Edit states
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState('');
  const [editDescription, setEditDescription] = React.useState('');
  const [editIsFeatured, setEditIsFeatured] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      
      try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
          const data = projectDoc.data() as ProjectFolder;
          setProject({ id: projectDoc.id, ...data });
          setEditTitle(data.title);
          setEditDescription(data.description);
          setEditIsFeatured(data.isFeatured || false);
          
          // Check if user has liked
          if (user) {
            const likeDoc = await getDoc(doc(db, 'likes', `${user.uid}_${projectId}`));
            setHasLiked(likeDoc.exists());
          }
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, user]);

  const handleSave = async () => {
    if (!user || !project || !projectId) return;
    
    setSaving(true);
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        title: editTitle,
        description: editDescription,
        isFeatured: editIsFeatured
      });
      
      setProject(prev => prev ? { ...prev, title: editTitle, description: editDescription, isFeatured: editIsFeatured } : null);
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !project || !projectId) return;
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!user || !project || !projectId) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      navigate(`/artist/${project.authorUid}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}`);
    } finally {
      setDeleting(false);
    }
  };

  const isAuthor = user?.uid === project?.authorUid;

  const handleLike = async () => {
    if (!user || !project || !projectId || likeLoading) return;

    setLikeLoading(true);
    const likeId = `${user.uid}_${projectId}`;
    const likeRef = doc(db, 'likes', likeId);
    const projectRef = doc(db, 'projects', projectId);

    try {
      if (hasLiked) {
        // Unlike
        await deleteDoc(likeRef);
        await updateDoc(projectRef, {
          likesCount: increment(-1)
        });
        setHasLiked(false);
        setProject(prev => prev ? { ...prev, likesCount: Math.max(0, prev.likesCount - 1) } : null);
      } else {
        // Like
        await setDoc(likeRef, {
          userId: user.uid,
          projectId: projectId,
          createdAt: new Date()
        });
        await updateDoc(projectRef, {
          likesCount: increment(1)
        });
        setHasLiked(true);
        setProject(prev => prev ? { ...prev, likesCount: prev.likesCount + 1 } : null);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setLikeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-manus-dark">
        <Loader2 className="w-12 h-12 text-manus-orange animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-manus-white bg-manus-dark">
        <h1 className="text-4xl mb-4 font-display font-black uppercase tracking-widest">Project Not Found</h1>
        <Link to="/" className="text-manus-cyan hover:underline font-bold uppercase tracking-widest text-xs">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-manus-dark pb-32">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-12">
          <Link to={`/artist/${project.authorUid}`} className="flex items-center gap-2 text-manus-white/40 hover:text-manus-cyan transition-colors group">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-mono font-bold uppercase tracking-[0.3em]">RETURN TO PROFILE</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono text-manus-white/20 uppercase tracking-[0.3em]">PROJECT_ID</span>
              <span className="text-xs font-mono text-manus-cyan uppercase tracking-widest">{project.id.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20">
          <div className="lg:col-span-8">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-4xl md:text-6xl font-display font-black text-manus-white tracking-tighter bg-manus-white/5 border border-manus-white/10 rounded-xl px-4 py-2 w-full focus:outline-none focus:border-manus-cyan uppercase"
                />
              ) : (
                <h1 className="text-5xl md:text-7xl font-display font-black text-manus-white leading-none tracking-tighter uppercase">
                  {project.title}
                </h1>
              )}
              {project.hasManicule && (
                <ManiculeBadge size="lg" />
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-manus-white/5 border border-manus-white/10 rounded-2xl p-6 text-xl text-manus-white/80 font-medium leading-relaxed focus:outline-none focus:border-manus-cyan resize-none"
                  placeholder="Tell us about your process..."
                />
                
                <div className="flex items-center gap-3 px-6 py-4 bg-manus-white/5 border border-manus-white/10 rounded-2xl">
                  <button
                    onClick={() => setEditIsFeatured(!editIsFeatured)}
                    className={cn(
                      "w-10 h-6 rounded-full transition-all relative",
                      editIsFeatured ? "bg-manus-cyan" : "bg-manus-white/10"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-manus-white transition-all",
                      editIsFeatured ? "left-5" : "left-1"
                    )} />
                  </button>
                  <span className="text-xs font-mono font-bold text-manus-white uppercase tracking-widest">
                    FEATURE ON PROFILE
                  </span>
                </div>

                <div className="flex justify-end gap-4">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 text-xs font-black text-manus-white/40 hover:text-manus-white uppercase tracking-widest transition-colors"
                  >
                    DISCARD
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 bg-manus-cyan text-manus-dark font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-manus-white transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    SAVE CHANGES
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xl text-manus-white/60 font-medium leading-relaxed max-w-3xl mb-8">
                {project.description}
              </p>
            )}
            
            <div className="flex flex-wrap gap-3">
              {project.tags.map(tag => (
                <Tag key={tag} label={tag} className="text-xs px-4 py-1.5" />
              ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-manus-white/5 border border-manus-white/10 rounded-3xl p-8 sticky top-24">
              {isAuthor && (
                <div className="flex gap-2 mb-8">
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex-1 py-3 bg-manus-white/5 border border-manus-white/10 text-manus-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-manus-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    {isEditing ? <><X className="w-4 h-4" /> CANCEL</> : <><Edit3 className="w-4 h-4" /> EDIT</>}
                  </button>
                  <button 
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-3 bg-red-500/10 border border-red-500/20 text-red-500 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    DELETE
                  </button>
                </div>
              )}
              <Link to={`/artist/${project.authorUid}`} className="flex items-center gap-4 group mb-8">
                <div className="relative">
                  <img
                    src={project.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.authorUid}`}
                    alt={project.authorName}
                    className="w-16 h-16 rounded-xl border border-manus-white/20 group-hover:border-manus-cyan transition-all"
                    referrerPolicy="no-referrer"
                  />
                  {project.hasManicule && (
                    <div className="absolute -top-2 -right-2">
                      <ManiculeBadge size="sm" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-[10px] font-mono text-manus-white/40 uppercase tracking-widest mb-1">CREATOR</div>
                  <div className="text-xl font-display font-black text-manus-white group-hover:text-manus-cyan transition-colors">
                    {project.authorName}
                  </div>
                </div>
              </Link>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-4 bg-manus-white/5 rounded-xl border border-manus-white/5">
                  <div className="flex items-center gap-3">
                    <Heart className={cn("w-5 h-5", hasLiked ? "text-manus-orange fill-current" : "text-manus-white/40")} />
                    <span className="text-xs font-mono text-manus-white/60 uppercase tracking-widest">LIKES</span>
                  </div>
                  <span className="text-sm font-mono font-black text-manus-white">{project.likesCount}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-manus-white/5 rounded-xl border border-manus-white/5">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-manus-cyan" />
                    <span className="text-xs font-mono text-manus-white/60 uppercase tracking-widest">COMMENTS</span>
                  </div>
                  <span className="text-sm font-mono font-black text-manus-white">0</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleLike}
                  disabled={!user || likeLoading}
                  className={cn(
                    "flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg disabled:opacity-50",
                    hasLiked 
                      ? "bg-manus-white text-manus-dark shadow-manus-white/10" 
                      : "bg-manus-orange text-manus-white shadow-manus-orange/20 hover:scale-[1.02]"
                  )}
                >
                  <Heart className={cn("w-4 h-4", hasLiked && "fill-current")} />
                  {hasLiked ? 'LIKED' : 'LIKE'}
                </button>
                <button className="flex items-center justify-center gap-2 bg-manus-white/5 border border-manus-white/10 text-manus-white font-black text-xs uppercase tracking-widest py-4 rounded-xl hover:bg-manus-white/10 transition-all">
                  <Bookmark className="w-4 h-4" />
                  SAVE
                </button>
              </div>
              {!user && (
                <p className="mt-4 text-[10px] font-mono text-center text-manus-white/20 uppercase tracking-widest">
                  SIGN IN TO LIKE AND SAVE
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Project Files */}
        <div className="space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative rounded-[2rem] overflow-hidden border border-manus-white/10 bg-manus-white/5"
          >
            <div className="absolute top-6 left-6 z-10">
              <div className="px-3 py-1 bg-manus-dark/80 backdrop-blur-md border border-manus-white/10 rounded-sm">
                <span className="text-[10px] font-mono text-manus-white/60 uppercase tracking-widest">MAIN_FILE</span>
              </div>
            </div>
            
            <img
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-auto group-hover:scale-[1.01] transition-transform duration-1000"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </div>
      
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="DELETE DATA POINT?"
        message="ARE YOU SURE YOU WANT TO DELETE THIS DATA POINT? THIS ACTION IS IRREVERSIBLE AND CANNOT BE UNDONE."
        confirmLabel="DELETE FOREVER"
        isDestructive
        onConfirm={confirmDelete}
        onClose={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};
