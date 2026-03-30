import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MOCK_PROJECTS } from '../constants';
import { Tag } from './ProjectCard';
import { ChevronLeft, Share2, Heart, MessageCircle, Bookmark } from 'lucide-react';
import { ManiculeBadge } from './ManiculeBadge';

export const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const project = MOCK_PROJECTS.find(p => p.id === projectId);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-manus-white">
        <h1 className="text-4xl mb-4">Project Not Found</h1>
        <Link to="/" className="text-manus-cyan hover:underline">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-manus-dark pb-32">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-12">
          <Link to={`/artist/${project.artistId}`} className="flex items-center gap-2 text-manus-white/40 hover:text-manus-cyan transition-colors group">
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
              <h1 className="text-5xl md:text-7xl font-display font-black text-manus-white leading-none tracking-tighter">
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
              <Link to={`/artist/${project.artistId}`} className="flex items-center gap-4 group mb-8">
                <div className="relative">
                  <img
                    src={project.artistAvatar}
                    alt={project.artistName}
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
                    {project.artistName}
                  </div>
                </div>
              </Link>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-4 bg-manus-white/5 rounded-xl border border-manus-white/5">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-manus-orange" />
                    <span className="text-[10px] font-mono text-manus-white/60 uppercase tracking-widest">APPRECIATIONS</span>
                  </div>
                  <span className="text-sm font-mono font-black text-manus-white">2.4K</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-manus-white/5 rounded-xl border border-manus-white/5">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-manus-cyan" />
                    <span className="text-[10px] font-mono text-manus-white/60 uppercase tracking-widest">COMMENTS</span>
                  </div>
                  <span className="text-sm font-mono font-black text-manus-white">128</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 bg-manus-orange text-manus-white font-black text-[10px] uppercase tracking-widest py-4 rounded-xl hover:scale-[1.02] transition-all shadow-lg shadow-manus-orange/20">
                  <Heart className="w-4 h-4 fill-current" />
                  APPRECIATE
                </button>
                <button className="flex items-center justify-center gap-2 bg-manus-white/5 border border-manus-white/10 text-manus-white font-black text-[10px] uppercase tracking-widest py-4 rounded-xl hover:bg-manus-white/10 transition-all">
                  <Bookmark className="w-4 h-4" />
                  SAVE
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Project Files */}
        <div className="space-y-16">
          {project.files.map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative rounded-[2rem] overflow-hidden border border-manus-white/10 bg-manus-white/5"
            >
              <div className="absolute top-6 left-6 z-10">
                <div className="px-3 py-1 bg-manus-dark/80 backdrop-blur-md border border-manus-white/10 rounded-sm">
                  <span className="text-[8px] font-mono text-manus-white/60 uppercase tracking-widest">FILE_0{index + 1}</span>
                </div>
              </div>
              
              {file.type === 'image' ? (
                <img
                  src={file.url}
                  alt={`${project.title} - file ${index + 1}`}
                  className="w-full h-auto group-hover:scale-[1.01] transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <video
                  src={file.url}
                  controls
                  className="w-full h-auto"
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
