import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ProjectFolder } from '../types';
import { cn } from '../lib/utils';
import { ManiculeBadge } from './ManiculeBadge';

import { Trash2 } from 'lucide-react';

interface ProjectCardProps {
  project: ProjectFolder;
  className?: string;
  onDelete?: (id: string) => void;
  shape?: 'square' | 'circle';
}

export const Tag: React.FC<{ label: string; className?: string }> = ({ label, className }) => (
  <span className={cn(
    "text-xs font-black uppercase tracking-widest text-manus-white/60 hover:text-manus-orange transition-colors cursor-pointer",
    className
  )}>
    {label}
  </span>
);

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, className, onDelete, shape = 'square' }) => {
  const mainImage = project.imageUrl || 'https://picsum.photos/seed/placeholder/800/600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={cn(
        "group relative bg-manus-dark border border-manus-white/10 overflow-hidden shadow-2xl transition-all hover:border-manus-cyan/30",
        shape === 'circle' ? "rounded-full aspect-square" : "rounded-2xl",
        className
      )}
    >
      <Link to={`/project/${project.id}`} className={cn(
        "block overflow-hidden relative",
        shape === 'circle' ? "aspect-square" : "aspect-[4/3]"
      )}>
        <div className="absolute top-4 left-4 z-20">
          <div className="px-2 py-0.5 bg-manus-dark/60 backdrop-blur-md border border-manus-white/10 rounded-sm">
            <span className="text-[10px] font-mono text-manus-white/60 uppercase tracking-widest">REF_{project.id.slice(0, 4).toUpperCase()}</span>
          </div>
        </div>
        
        <img
          src={mainImage}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        {onDelete && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(project.id);
            }}
            className="absolute bottom-4 right-4 z-30 p-2 bg-red-500/20 hover:bg-red-500 text-manus-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md border border-red-500/50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        {project.hasManicule && (
          <div className="absolute top-4 right-4 z-10">
            <ManiculeBadge size="sm" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-manus-dark via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <Link to={`/project/${project.id}`}>
              <h3 className="text-lg font-display font-black leading-tight text-manus-white group-hover:text-manus-cyan transition-colors truncate uppercase tracking-tight">
                {project.title}
              </h3>
            </Link>
            <Link to={`/artist/${project.authorUid}`} className="block mt-1">
              <span className="text-xs font-mono font-bold text-manus-cyan uppercase tracking-widest hover:text-manus-white transition-colors">
                @{project.authorName.split(' ')[0].toUpperCase()}
              </span>
            </Link>
          </div>
          <Link to={`/artist/${project.authorUid}`} className="shrink-0">
            <div className="p-0.5 border border-manus-white/10 rounded-lg group-hover:border-manus-orange transition-all">
              <img
                src={project.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.authorUid}`}
                alt={project.authorName}
                className="w-8 h-8 rounded-md object-cover grayscale group-hover:grayscale-0 transition-all"
                referrerPolicy="no-referrer"
              />
            </div>
          </Link>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {project.tags.slice(0, 2).map(tag => (
            <Tag key={tag} label={tag} className="text-[10px] font-mono opacity-40 group-hover:opacity-100" />
          ))}
          {project.tags.length > 2 && (
            <span className="text-[10px] font-mono font-bold text-manus-white/20 ml-1">
              +{project.tags.length - 2}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
