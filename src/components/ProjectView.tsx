import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Tag } from './ProjectCard';
import { ChevronLeft, Share2, Heart, MessageCircle, Bookmark, Loader2 } from 'lucide-react';
import { ManiculeBadge } from './ManiculeBadge';
import { db, doc, getDoc, updateDoc, increment, setDoc, deleteDoc } from '../firebase';
import { ProjectFolder } from '../types';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const [project, setProject] = React.useState<ProjectFolder | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [hasLiked, setHasLiked] = React.useState(false);
  const [likeLoading, setLikeLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      
      try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
          setProject({ id: projectDoc.id, ...projectDoc.data() } as ProjectFolder);
          
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
          uid: user.uid,
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
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em]">RETURN TO ARCHIVE</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-mono text-manus-white/20 uppercase tracking-[0.3em]">PROJECT_ID</span>
              <span className="text-[10px] font-mono text-manus-cyan uppercase tracking-widest">{project.id.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20">
          <div className="lg:col-span-8">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <h1 className="text-5xl md:text-7xl font-display font-black text-manus-white leading-none tracking-tighter uppercase">
                {project.title}
              </h1>
              {project.hasManicule && (
                <ManiculeBadge size="lg" />
              )}
            </div>
            <p className="text-xl text-manus-white/60 font-medium leading-relaxed max-w-3xl mb-8">
              {project.description}
            </p>
            <div className="flex flex-wrap gap-3">
              {project.tags.map(tag => (
                <Tag key={tag} label={tag} className="text-[9px] px-4 py-1.5" />
              ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-manus-white/5 border border-manus-white/10 rounded-3xl p-8 sticky top-24">
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
                  <div className="text-[8px] font-mono text-manus-white/40 uppercase tracking-widest mb-1">CREATOR</div>
                  <div className="text-xl font-display font-black text-manus-white group-hover:text-manus-cyan transition-colors">
                    {project.authorName}
                  </div>
                </div>
              </Link>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-4 bg-manus-white/5 rounded-xl border border-manus-white/5">
                  <div className="flex items-center gap-3">
                    <Heart className={cn("w-5 h-5", hasLiked ? "text-manus-orange fill-current" : "text-manus-white/40")} />
                    <span className="text-[10px] font-mono text-manus-white/60 uppercase tracking-widest">LIKES</span>
                  </div>
                  <span className="text-sm font-mono font-black text-manus-white">{project.likesCount}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-manus-white/5 rounded-xl border border-manus-white/5">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-manus-cyan" />
                    <span className="text-[10px] font-mono text-manus-white/60 uppercase tracking-widest">COMMENTS</span>
                  </div>
                  <span className="text-sm font-mono font-black text-manus-white">0</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleLike}
                  disabled={!user || likeLoading}
                  className={cn(
                    "flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg disabled:opacity-50",
                    hasLiked 
                      ? "bg-manus-white text-manus-dark shadow-manus-white/10" 
                      : "bg-manus-orange text-manus-white shadow-manus-orange/20 hover:scale-[1.02]"
                  )}
                >
                  <Heart className={cn("w-4 h-4", hasLiked && "fill-current")} />
                  {hasLiked ? 'LIKED' : 'LIKE'}
                </button>
                <button className="flex items-center justify-center gap-2 bg-manus-white/5 border border-manus-white/10 text-manus-white font-black text-[10px] uppercase tracking-widest py-4 rounded-xl hover:bg-manus-white/10 transition-all">
                  <Bookmark className="w-4 h-4" />
                  SAVE
                </button>
              </div>
              {!user && (
                <p className="mt-4 text-[8px] font-mono text-center text-manus-white/20 uppercase tracking-widest">
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
                <span className="text-[8px] font-mono text-manus-white/60 uppercase tracking-widest">MAIN_FILE</span>
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
    </div>
  );
};
