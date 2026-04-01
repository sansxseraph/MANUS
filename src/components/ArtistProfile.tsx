import React from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectCard, Tag } from './ProjectCard';
import { 
  Globe, 
  Twitter, 
  Instagram, 
  Share2, 
  Edit3, 
  Camera, 
  Trash2, 
  X, 
  Check, 
  Loader2,
  UserPlus,
  UserMinus,
  Github,
  MessageSquare,
  Cloud,
  Hash,
  Square,
  Circle,
  Link as LinkIcon,
  Image as ImageIcon,
  Maximize2,
  AlertCircle,
  User,
  Send,
  Lock
} from 'lucide-react';
import { ManiculeBadge } from './ManiculeBadge';
import { ConfirmModal } from './ConfirmModal';
import { db, doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc, deleteDoc, handleFirestoreError, OperationType, setDoc, increment, storage, ref, uploadBytes, uploadBytesResumable, uploadString, StringFormat, getDownloadURL, serverTimestamp, onSnapshot, addDoc } from '../firebase';
import { ProjectFolder } from '../types';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableTagProps {
  tag: string;
  onRemove: (tag: string) => void;
  key?: string;
}

const SortableTag = ({ tag, onRemove }: SortableTagProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: tag });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group flex items-center gap-2 px-3 py-1 rounded-full bg-manus-cyan text-manus-dark text-[10px] font-black uppercase tracking-wider cursor-grab active:cursor-grabbing"
    >
      {tag}
      <X 
        className="w-3 h-3 cursor-pointer hover:scale-110 transition-transform pointer-events-auto" 
        onClick={(e) => {
          e.stopPropagation();
          onRemove(tag);
        }} 
      />
    </div>
  );
};

export const ArtistProfile: React.FC = () => {
  const { artistId } = useParams<{ artistId: string }>();
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [artist, setArtist] = React.useState<any>(null);
  const [projects, setProjects] = React.useState<ProjectFolder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(searchParams.get('edit') === 'true');
  
  React.useEffect(() => {
    if (searchParams.get('edit') === 'true') {
      setIsEditing(true);
    }
  }, [searchParams]);
  
  // Edit states
  const [editBio, setEditBio] = React.useState('');
  const [editDisplayName, setEditDisplayName] = React.useState('');
  const [editHandle, setEditHandle] = React.useState('');
  const [editAvatarShape, setEditAvatarShape] = React.useState<'square' | 'circle'>('square');
  const [editPhotoShape, setEditPhotoShape] = React.useState<'square' | 'circle'>('square');
  const [editShowOnlineStatus, setEditShowOnlineStatus] = React.useState(true);
  const [editOnlineStatus, setEditOnlineStatus] = React.useState<'online' | 'away' | 'offline'>('online');
  
  const [editTags, setEditTags] = React.useState<string[]>([]);
  const [error, setError] = React.useState('');
  
  // Social states
  const [editTwitter, setEditTwitter] = React.useState('');
  const [editInstagram, setEditInstagram] = React.useState('');
  const [editGithub, setEditGithub] = React.useState('');
  const [editDiscord, setEditDiscord] = React.useState('');
  const [editTumblr, setEditTumblr] = React.useState('');
  const [editBluesky, setEditBluesky] = React.useState('');
  const [editWebsite, setEditWebsite] = React.useState('');

  const [saving, setSaving] = React.useState(false);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [uploadingBanner, setUploadingBanner] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setEditTags((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);

  // Follow states
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [followLoading, setFollowLoading] = React.useState(false);
  const [followerCount, setFollowerCount] = React.useState(0);
  const [followingCount, setFollowingCount] = React.useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [projectToDelete, setProjectToDelete] = React.useState<string | null>(null);

  const effectiveArtistId = artistId || currentUser?.uid;
  const isOwnProfile = currentUser?.uid === effectiveArtistId;

  const isEditingRef = React.useRef(isEditing);
  React.useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  React.useEffect(() => {
    if (!effectiveArtistId) {
      if (!artistId && !currentUser) {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    const artistRef = doc(db, 'profiles', effectiveArtistId);
    
    const unsubscribe = onSnapshot(artistRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setArtist({ id: docSnap.id, ...data });
        
        // Only update edit states if not currently editing
        if (!isEditingRef.current) {
          setEditBio(data.bio || '');
          setEditDisplayName(data.displayName || '');
          setEditHandle(data.handle || '');
          setEditAvatarShape(data.avatarShape || 'square');
          setEditPhotoShape(data.photoShape || 'square');
          setEditTwitter(data.twitterUrl || '');
          setEditInstagram(data.instagramUrl || '');
          setEditGithub(data.githubUrl || '');
          setEditDiscord(data.discordUrl || '');
          setEditTumblr(data.tumblrUrl || '');
          setEditBluesky(data.blueskyUrl || '');
          setEditWebsite(data.websiteUrl || '');
          setEditTags(data.tags || []);
          setEditOnlineStatus(data.isOnline || 'online');
          setEditShowOnlineStatus(data.showOnlineStatus ?? true);
        }
        
        setFollowerCount(data.followersCount || 0);
        setFollowingCount(data.followingCount || 0);
      } else {
        // Try fetching from users collection as fallback
        try {
          const userSnap = await getDoc(doc(db, 'users', effectiveArtistId));
          if (userSnap.exists()) {
            const data = userSnap.data();
            setArtist({ id: userSnap.id, ...data });
            if (!isEditingRef.current) {
              setEditBio(data.bio || '');
              setEditDisplayName(data.displayName || '');
              setEditHandle(data.handle || '');
              setEditAvatarShape(data.avatarShape || 'square');
              setEditPhotoShape(data.photoShape || 'square');
              setEditTwitter(data.twitterUrl || '');
              setEditInstagram(data.instagramUrl || '');
              setEditGithub(data.githubUrl || '');
              setEditDiscord(data.discordUrl || '');
              setEditTumblr(data.tumblrUrl || '');
              setEditBluesky(data.blueskyUrl || '');
              setEditWebsite(data.websiteUrl || '');
              setEditTags(data.tags || []);
              setEditOnlineStatus(data.isOnline || 'online');
              setEditShowOnlineStatus(data.showOnlineStatus ?? true);
            }
            setFollowerCount(data.followersCount || 0);
            setFollowingCount(data.followingCount || 0);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Error fetching from users fallback:", err);
        }

        if (isOwnProfile && currentUser) {
          // Fallback for current user if profile doesn't exist yet
          const fallbackData = {
            id: currentUser.uid,
            displayName: currentUser.displayName || 'Anonymous Artist',
            photoURL: currentUser.photoURL,
            bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
            role: 'user',
            createdAt: new Date(),
            followersCount: 0,
            followingCount: 0,
            avatarShape: 'square',
            photoShape: 'square',
            handle: `${(currentUser.displayName || 'artist').toLowerCase().replace(/\s+/g, '_')}_${currentUser.uid.slice(0, 4)}`,
            twitterUrl: '',
            instagramUrl: '',
            githubUrl: '',
            discordUrl: '',
            tumblrUrl: '',
            blueskyUrl: '',
            websiteUrl: ''
          };
          setArtist(fallbackData);
          if (!isEditingRef.current) {
            setEditBio(fallbackData.bio);
            setEditDisplayName(fallbackData.displayName);
            setEditHandle(fallbackData.handle);
            setEditAvatarShape('square');
            setEditPhotoShape('square');
            setEditTwitter('');
            setEditInstagram('');
            setEditGithub('');
            setEditDiscord('');
            setEditTumblr('');
            setEditBluesky('');
            setEditWebsite('');
          }
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to artist data:", error);
      setLoading(false);
    });

    // Fetch artist projects (not real-time for now)
    const fetchProjects = async () => {
      try {
        const q = query(
          collection(db, 'projects'), 
          where('authorUid', '==', effectiveArtistId),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const projectsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ProjectFolder[];
        setProjects(projectsData);

        // Check if current user is following this artist
        if (currentUser && !isOwnProfile) {
          const followDoc = await getDoc(doc(db, 'follows', `${currentUser.uid}_${effectiveArtistId}`));
          setIsFollowing(followDoc.exists());
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();

    return () => unsubscribe();
  }, [effectiveArtistId, artistId, currentUser, isOwnProfile]);

  const handleFollow = async () => {
    if (!currentUser || !effectiveArtistId || followLoading || isOwnProfile) return;
    
    setFollowLoading(true);
    try {
      const followId = `${currentUser.uid}_${effectiveArtistId}`;
      const followRef = doc(db, 'follows', followId);
      const artistRef = doc(db, 'profiles', effectiveArtistId);
      const currentUserRef = doc(db, 'profiles', currentUser.uid);

      if (isFollowing) {
        // Unfollow
        await deleteDoc(followRef);
        // Update counts
        await updateDoc(artistRef, { followersCount: increment(-1) });
        await updateDoc(currentUserRef, { followingCount: increment(-1) });
        
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
      } else {
        // Follow
        await setDoc(followRef, {
          followerId: currentUser.uid,
          followingId: effectiveArtistId,
          createdAt: new Date()
        });
        // Update counts
        await updateDoc(artistRef, { followersCount: increment(1) });
        await updateDoc(currentUserRef, { followingCount: increment(1) });
        
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'follows');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !artist) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('FILE TOO LARGE. PLEASE USE AN IMAGE UNDER 5MB.');
      setUploadingAvatar(false);
      return;
    }

    setUploadingAvatar(true);
    setError('');
    try {
      console.log('Uploading avatar for user:', currentUser.uid, 'File:', file.name);
      
      // Convert to Base64 to bypass stream blocks
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const base64Data = await base64Promise;
      const storageRef = ref(storage, `avatars/${currentUser.uid}_${Date.now()}`);
      
      console.log('Starting Base64 upload for avatar...');
      const uploadTask = uploadString(storageRef, base64Data, StringFormat.DATA_URL);
      
      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => {
          reject(new Error("UPLOAD TIMEOUT: THE CONNECTION IS TAKING TOO LONG. PLEASE TRY A SMALLER FILE OR CHECK YOUR CONNECTION."));
        }, 120000)
      );

      await Promise.race([uploadTask, timeoutPromise]);
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Avatar uploaded via Base64, URL:', downloadURL);

      const profileRef = doc(db, 'profiles', currentUser.uid);
      const userRef = doc(db, 'users', currentUser.uid);

      const updateData = { 
        photoURL: downloadURL,
        displayName: artist.displayName || currentUser.displayName || 'Anonymous Artist',
        role: artist.role || 'user',
        createdAt: artist.createdAt || serverTimestamp(),
        followersCount: artist.followersCount || 0,
        followingCount: artist.followingCount || 0,
        avatarShape: artist.avatarShape || 'square',
        photoShape: artist.photoShape || 'square',
        showOnlineStatus: artist.showOnlineStatus ?? true,
        isOnline: artist.isOnline || 'online',
        handle: artist.handle?.replace(/^@/, '') || `${(artist.displayName || 'artist').toLowerCase().replace(/\s+/g, '_')}_${currentUser.uid.slice(0, 4)}`,
        twitterUrl: artist.twitterUrl || '',
        instagramUrl: artist.instagramUrl || '',
        githubUrl: artist.githubUrl || '',
        discordUrl: artist.discordUrl || '',
        tumblrUrl: artist.tumblrUrl || '',
        blueskyUrl: artist.blueskyUrl || '',
        websiteUrl: artist.websiteUrl || '',
        bannerUrl: artist.bannerUrl || '',
        tags: artist.tags || []
      };

      console.log('Updating profile with new avatar:', updateData);
      await setDoc(profileRef, updateData, { merge: true });
      await setDoc(userRef, updateData, { merge: true });

      setArtist(prev => prev ? { ...prev, photoURL: downloadURL } : null);
      console.log('Avatar update complete');
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setError(error instanceof Error ? error.message.toUpperCase() : 'FAILED TO UPLOAD AVATAR. PLEASE TRY AGAIN.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !artist) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('BANNER TOO LARGE. PLEASE USE AN IMAGE UNDER 10MB.');
      setUploadingBanner(false);
      return;
    }

    setUploadingBanner(true);
    setError('');
    try {
      console.log('Uploading banner for user:', currentUser.uid, 'File:', file.name);
      
      // Convert to Base64 to bypass stream blocks
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const base64Data = await base64Promise;
      const storageRef = ref(storage, `banners/${currentUser.uid}_${Date.now()}`);
      
      console.log('Starting Base64 upload for banner...');
      const uploadTask = uploadString(storageRef, base64Data, StringFormat.DATA_URL);
      
      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => {
          reject(new Error("UPLOAD TIMEOUT: THE CONNECTION IS TAKING TOO LONG. PLEASE TRY A SMALLER FILE OR CHECK YOUR CONNECTION."));
        }, 120000)
      );

      await Promise.race([uploadTask, timeoutPromise]);
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Banner uploaded via Base64, URL:', downloadURL);

      const profileRef = doc(db, 'profiles', currentUser.uid);
      const userRef = doc(db, 'users', currentUser.uid);

      const updateData = { 
        bannerUrl: downloadURL,
        photoURL: artist.photoURL || currentUser.photoURL || '',
        displayName: artist.displayName || currentUser.displayName || 'Anonymous Artist',
        role: artist.role || 'user',
        createdAt: artist.createdAt || serverTimestamp(),
        followersCount: artist.followersCount || 0,
        followingCount: artist.followingCount || 0,
        avatarShape: artist.avatarShape || 'square',
        photoShape: artist.photoShape || 'square',
        showOnlineStatus: artist.showOnlineStatus ?? true,
        isOnline: artist.isOnline || 'online',
        handle: artist.handle?.replace(/^@/, '') || `${(artist.displayName || 'artist').toLowerCase().replace(/\s+/g, '_')}_${currentUser.uid.slice(0, 4)}`,
        twitterUrl: artist.twitterUrl || '',
        instagramUrl: artist.instagramUrl || '',
        githubUrl: artist.githubUrl || '',
        discordUrl: artist.discordUrl || '',
        tumblrUrl: artist.tumblrUrl || '',
        blueskyUrl: artist.blueskyUrl || '',
        websiteUrl: artist.websiteUrl || '',
        tags: artist.tags || []
      };

      console.log('Updating profile with new banner:', updateData);
      await setDoc(profileRef, updateData, { merge: true });
      await setDoc(userRef, updateData, { merge: true });

      setArtist(prev => prev ? { ...prev, bannerUrl: downloadURL } : null);
      console.log('Banner update complete');
    } catch (error) {
      console.error("Error uploading banner:", error);
      setError(error instanceof Error ? error.message.toUpperCase() : 'FAILED TO UPLOAD BANNER. PLEASE TRY AGAIN.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser || currentUser.uid !== artist?.id) return;
    
    setSaving(true);
    setError('');
    try {
      console.log('Saving profile for user:', currentUser.uid);
      const profileRef = doc(db, 'profiles', currentUser.uid);
      const userRef = doc(db, 'users', currentUser.uid);

      const finalHandle = editHandle.replace(/^@/, '');

      const profileData = {
        displayName: editDisplayName,
        handle: finalHandle,
        bio: editBio,
        avatarShape: editAvatarShape,
        photoShape: editPhotoShape,
        showOnlineStatus: editShowOnlineStatus,
        isOnline: editOnlineStatus,
        twitterUrl: editTwitter,
        instagramUrl: editInstagram,
        githubUrl: editGithub,
        discordUrl: editDiscord,
        tumblrUrl: editTumblr,
        blueskyUrl: editBluesky,
        websiteUrl: editWebsite,
        tags: editTags,
        role: artist.role || 'user',
        createdAt: artist.createdAt || serverTimestamp(),
        followersCount: artist.followersCount || 0,
        followingCount: artist.followingCount || 0,
        photoURL: artist.photoURL || currentUser.photoURL || '',
        bannerUrl: artist.bannerUrl || ''
      };

      console.log('Profile data to save:', profileData);
      await setDoc(profileRef, profileData, { merge: true });

      // Also update users collection for private record
      const userData = {
        uid: currentUser.uid,
        displayName: editDisplayName,
        email: currentUser.email,
        handle: finalHandle,
        bio: editBio,
        avatarShape: editAvatarShape,
        photoShape: editPhotoShape,
        showOnlineStatus: editShowOnlineStatus,
        isOnline: editOnlineStatus,
        twitterUrl: editTwitter,
        instagramUrl: editInstagram,
        githubUrl: editGithub,
        discordUrl: editDiscord,
        tumblrUrl: editTumblr,
        blueskyUrl: editBluesky,
        websiteUrl: editWebsite,
        tags: editTags,
        role: artist.role || 'user',
        createdAt: artist.createdAt || serverTimestamp(),
        photoURL: artist.photoURL || currentUser.photoURL || '',
        bannerUrl: artist.bannerUrl || ''
      };

      console.log('User data to save:', userData);
      await setDoc(userRef, userData, { merge: true });
      
      setArtist(prev => ({ 
        ...prev, 
        bio: editBio, 
        displayName: editDisplayName, 
        handle: finalHandle, 
        avatarShape: editAvatarShape,
        photoShape: editPhotoShape,
        showOnlineStatus: editShowOnlineStatus,
        isOnline: editOnlineStatus,
        twitterUrl: editTwitter,
        instagramUrl: editInstagram,
        githubUrl: editGithub,
        discordUrl: editDiscord,
        tumblrUrl: editTumblr,
        blueskyUrl: editBluesky,
        websiteUrl: editWebsite,
        tags: editTags
      }));
      setIsEditing(false);
      console.log('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('FAILED TO SAVE PROFILE. PERMISSION DENIED OR NETWORK ERROR.');
      try {
        handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
      } catch (fErr) {
        // Error already handled for AIS agent
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!isOwnProfile) return;
    setProjectToDelete(projectId);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      await deleteDoc(doc(db, 'projects', projectToDelete));
      setProjects(prev => prev.filter(p => p.id !== projectToDelete));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${projectToDelete}`);
    } finally {
      setProjectToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-manus-dark">
        <Loader2 className="w-12 h-12 text-manus-orange animate-spin" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-manus-white bg-manus-dark px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <div className="w-32 h-32 md:w-48 md:h-48 mx-auto mb-8 opacity-20 hover:opacity-40 transition-opacity duration-700 cursor-help">
            <svg viewBox="210 220 230 200" className="w-full h-full text-manus-white fill-current transform -rotate-12">
              <path d="M231.15,247.15c34.4,34.8,68.9,69.5,103.3,104.3.7,1,5.4,7.3,13,7.6,1.5,0,6.1.2,9.3-3.1,2.7-2.8,2.8-6.4,2.8-7.6.2-7.4-5.9-12.3-6.8-13-35.2-35.2-70.5-70.3-105.7-105.5-1-.8-3.1-2.5-6.2-3-1-.2-5.7-1-9.6,2.2-3.4,2.8-4,6.7-4.1,8-.5,5.8,3.4,9.6,4,10.2v-.1Z"/><path d="M321.55,378.15c4.2,3.6,12.7,9.4,24.7,10,19.2.9,31.2-12.4,32.8-14.1,2.8-3.3,10.5-13,10.2-27.4-.3-14.6-8.6-24-10.7-26.3-31.5-31.6-63-63.2-94.5-94.9-1.3-1.1-3.3-2.5-6.2-3-.3,0-.6,0-.7-.1-1.7-.2-5.6-.4-8.9,2.3-3.4,2.7-4,6.6-4.1,8-.5,5.8,3.4,9.6,4,10.2,31.4,31.4,62.9,62.7,94.3,94.1.8,1.2,3.7,5.6,3.2,11.7-.1,1.7-.8,6.4-4.5,10.4-5,5.4-11.6,5.6-13.3,5.6-4.5,0-8.1-1.5-10.3-2.8l.2-.2-94.5-94.9c-1-.8-3.1-2.5-6.2-3-1-.2-5.7-1-9.6,2.2-3.4,2.8-4,6.7-4.1,8-.5,5.8,3.4,9.6,4,10.2,31.4,31.4,62.9,62.7,94.3,94.1l.1-.1h-.2Z"/><path d="M417.25,343.55c-.5-11.1-3.4-19.3-4.2-21.5-4.4-11.9-11.2-19.7-14.3-23.2-2.5-2.8-4.7-4.9-6.3-6.4-11.2-10.9-22.4-21.8-33.6-32.8-2-1.9-4.1-3.8-6.1-5.8-1.5-1.5-3.1-2.9-4.6-4.4-1.3.4-3.5,1.4-5.6,3.4-.9.9-4.1,4.1-4.5,9-.3,3.7,1,6.4,2.7,10,1.7,3.5,3.7,6.1,5.2,7.7,12.4,12.1,24.8,24.3,37.3,36.4,3,3.9,7.9,11.2,9.9,21.5.6,3.3,4.2,24.1-10.4,40.7-11.5,13-26.6,14.9-30.2,15.2-13,1.3-22.9-3.4-26.3-5.1-4.7-2.3-8.2-4.9-10.6-6.9h0c-22.1-22.4-44.2-44.8-66.3-67.2-1-1-3.1-2.9-6.5-3.7-1.4-.3-6.7-1.3-10.7,2.2-2.8,2.5-3.3,5.9-3.5,7.1-.8,5.8,2.6,10.1,3.3,11.1,22.2,22.1,44.4,44.3,66.6,66.4l.2-.2c2.1,2.1,4.7,4.4,7.7,6.6.7.5,5.1,3.7,10.6,6.4,15.1,7.4,31,7.1,32.8,7.1,9-.3,16.6-2.3,22-4.2,5.5-2,24.8-9.4,36.7-29.9,9.6-16.6,9.1-32.6,8.8-39.5h-.1Z"/>
            </svg>
          </div>
          <h1 className="text-4xl md:text-6xl mb-4 font-display font-black uppercase tracking-tighter text-manus-white">
            Lost in the Gallery
          </h1>
          <p className="text-manus-white/40 font-mono text-xs uppercase tracking-[0.4em] mb-12">
            Page Not Found // Record Missing
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-3 px-8 py-4 bg-manus-white/5 border border-manus-white/10 text-manus-white font-black text-xs uppercase tracking-[0.3em] rounded-xl hover:bg-manus-cyan hover:text-manus-dark hover:border-manus-cyan transition-all duration-500 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform duration-500">←</span>
            Return to Sanctuary
          </Link>
        </motion.div>
        
        {/* Technical Glitch Decoration */}
        <div className="absolute bottom-12 left-12 opacity-5 font-mono text-[10px] text-manus-white tracking-widest uppercase pointer-events-none hidden md:block">
          ERR_CODE: 0x404_NULL_POINTER<br />
          SEEK_POSITION: {artistId || 'UNKNOWN'}<br />
          STATUS: VOID_REACHED
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-manus-dark">
      {/* Banner Area */}
      <div className={cn(
        "relative h-[22.5vh] md:h-[30vh] overflow-hidden group/banner",
        isEditing ? "bg-manus-dark" : ""
      )}>
        {!isEditing && (
          <>
            {artist.bannerUrl ? (
              <img 
                src={artist.bannerUrl} 
                alt={`${artist.displayName} banner`}
                className="w-full h-full object-cover opacity-40 grayscale hover:grayscale-0 transition-all duration-1000"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div 
                className="w-full h-full opacity-25" 
                style={{ background: 'linear-gradient(to bottom, #b7eaf1, #041d2b)' }} 
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-manus-dark via-manus-dark/20 to-transparent" />
          </>
        )}
        
        {isOwnProfile && !isEditing && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-opacity">
            <button 
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              className="px-6 py-3 bg-manus-dark/80 border border-manus-white/20 rounded-xl text-manus-white font-black text-xs uppercase tracking-widest hover:bg-manus-cyan hover:text-manus-dark transition-all flex items-center gap-2"
            >
              {uploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              CHANGE BANNER
            </button>
            <input 
              type="file" 
              ref={bannerInputRef} 
              onChange={handleBannerUpload} 
              className="hidden" 
              accept="image/*" 
            />
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="max-w-7xl mx-auto px-6 -mt-20 lg:-mt-40 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
          {/* Left Column: Avatar & Stats */}
          <div className="lg:col-span-4">
            <div className="bg-manus-white/5 border border-manus-white/10 rounded-3xl p-8 backdrop-blur-xl">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative mb-8 flex justify-center"
              >
                <div className="relative group/avatar">
                  <img
                    src={artist.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.id}`}
                    alt={artist.displayName}
                    className={cn(
                      "w-48 h-48 border-2 border-manus-cyan/50 shadow-[0_0_30px_rgba(12,177,199,0.2)] transition-all duration-500",
                      artist.avatarShape === 'circle' ? "rounded-full" : "rounded-2xl"
                    )}
                    referrerPolicy="no-referrer"
                  />
                  {isOwnProfile && (
                    <div 
                      onClick={() => avatarInputRef.current?.click()}
                      className={cn(
                        "absolute inset-0 bg-manus-dark/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer",
                        artist.avatarShape === 'circle' ? "rounded-full" : "rounded-2xl"
                      )}
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="w-8 h-8 text-manus-white animate-spin" />
                      ) : (
                        <Camera className="w-8 h-8 text-manus-white" />
                      )}
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={avatarInputRef} 
                    onChange={handleAvatarUpload} 
                    className="hidden" 
                    accept="image/*" 
                  />
                  {artist.role === 'admin' && (
                    <div className="absolute -top-3 -right-3">
                      <ManiculeBadge size="md" />
                    </div>
                  )}
                </div>
              </motion.div>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="text-center">
                    <div className="text-xl font-mono font-black text-manus-white">{projects.filter(p => p.isFeatured).length}</div>
                    <div className="text-[10px] font-mono text-manus-white/40 uppercase tracking-widest">FEATURED</div>
                  </div>
                  <div className="text-center border-x border-manus-white/10">
                    <div className="text-xl font-mono font-black text-manus-white">{followerCount}</div>
                    <div className="text-[10px] font-mono text-manus-white/40 uppercase tracking-widest">FOLLOWERS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-mono font-black text-manus-white">{followingCount}</div>
                    <div className="text-[10px] font-mono text-manus-white/40 uppercase tracking-widest">FOLLOWING</div>
                  </div>
                </div>

                <div className="pt-6 border-t border-manus-white/10 flex flex-col gap-3">
                  {isOwnProfile ? (
                    <>
                      <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className="w-full py-3 bg-manus-white/5 border border-manus-white/10 text-manus-white font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-manus-white/10 transition-all flex items-center justify-center gap-2"
                      >
                        {isEditing ? <><X className="w-4 h-4" /> CANCEL EDITING</> : <><Edit3 className="w-4 h-4" /> EDIT PROFILE</>}
                      </button>
                      <Link 
                        to="/messages"
                        className="w-full py-3 bg-manus-white/5 border border-manus-white/10 text-manus-white font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-manus-white/10 transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" /> MESSAGES
                      </Link>
                      <Link 
                        to={`/gallery/${effectiveArtistId}`}
                        className="w-full py-3 bg-manus-white/5 border border-manus-white/10 text-manus-white font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-manus-cyan hover:text-manus-dark hover:border-manus-cyan transition-all flex items-center justify-center gap-2 group"
                      >
                        <Maximize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        VIEW ARCHIVE
                      </Link>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={handleFollow}
                        disabled={followLoading}
                        className={cn(
                          "w-full py-3 font-black text-xs uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-2",
                          isFollowing 
                            ? "bg-manus-white/5 border border-manus-white/10 text-manus-white hover:bg-manus-white/10"
                            : "bg-manus-cyan text-manus-dark hover:bg-manus-white"
                        )}
                      >
                        {followLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isFollowing ? (
                          <><UserMinus className="w-4 h-4" /> UNFOLLOW</>
                        ) : (
                          <><UserPlus className="w-4 h-4" /> FOLLOW</>
                        )}
                      </button>
                      <Link 
                        to={`/messages?to=${effectiveArtistId}`}
                        className="w-full py-3 bg-manus-white/5 border border-manus-white/10 text-manus-white font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-manus-white/10 transition-all flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" /> SEND MESSAGE
                      </Link>
                      <Link 
                        to={`/gallery/${effectiveArtistId}`}
                        className="w-full py-3 bg-manus-white/5 border border-manus-white/10 text-manus-white font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-manus-cyan hover:text-manus-dark hover:border-manus-cyan transition-all flex items-center justify-center gap-2 group"
                      >
                        <Maximize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        VIEW ARCHIVE
                      </Link>
                    </>
                  )}
                </div>

                <div className="pt-6 border-t border-manus-white/10 flex justify-center gap-6">
                  {artist.websiteUrl && (
                    <a href={artist.websiteUrl} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-5 h-5 text-manus-white/40 hover:text-manus-cyan cursor-pointer transition-colors" />
                    </a>
                  )}
                  {artist.twitterUrl && (
                    <a href={artist.twitterUrl} target="_blank" rel="noopener noreferrer">
                      <Twitter className="w-5 h-5 text-manus-white/40 hover:text-manus-cyan cursor-pointer transition-colors" />
                    </a>
                  )}
                  {artist.instagramUrl && (
                    <a href={artist.instagramUrl} target="_blank" rel="noopener noreferrer">
                      <Instagram className="w-5 h-5 text-manus-white/40 hover:text-manus-cyan cursor-pointer transition-colors" />
                    </a>
                  )}
                  {artist.githubUrl && (
                    <a href={artist.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="w-5 h-5 text-manus-white/40 hover:text-manus-cyan cursor-pointer transition-colors" />
                    </a>
                  )}
                  {artist.discordUrl && (
                    <div className="group relative flex items-center">
                      <MessageSquare className="w-5 h-5 text-manus-white/40 hover:text-manus-cyan cursor-pointer transition-colors" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-manus-dark border border-manus-white/10 rounded text-[10px] font-mono text-manus-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                        {artist.discordUrl}
                      </span>
                    </div>
                  )}
                  {artist.tumblrUrl && (
                    <a href={artist.tumblrUrl} target="_blank" rel="noopener noreferrer">
                      <Hash className="w-5 h-5 text-manus-white/40 hover:text-manus-cyan cursor-pointer transition-colors" />
                    </a>
                  )}
                  {artist.blueskyUrl && (
                    <a href={artist.blueskyUrl} target="_blank" rel="noopener noreferrer">
                      <Cloud className="w-5 h-5 text-manus-white/40 hover:text-manus-cyan cursor-pointer transition-colors" />
                    </a>
                  )}
                  <Share2 className="w-5 h-5 text-manus-white/40 hover:text-manus-cyan cursor-pointer transition-colors" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bio & Details */}
          <div className="lg:col-span-8 pt-8 flex flex-col">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                {isEditing ? (
                  <div className="flex flex-col gap-4 w-full">
                    <input
                      type="text"
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      placeholder="Display Name"
                      className="text-4xl md:text-5xl font-display font-black text-manus-white tracking-tighter bg-manus-white/5 border border-manus-white/10 rounded-xl px-4 py-2 w-full focus:outline-none focus:border-manus-cyan"
                    />
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-manus-cyan font-mono font-bold">@</span>
                      <input
                        type="text"
                        value={editHandle.replace(/^@/, '')}
                        onChange={(e) => setEditHandle(e.target.value.replace(/^@/, ''))}
                        placeholder="handle"
                        className="text-xl font-mono font-bold text-manus-cyan tracking-widest bg-manus-white/5 border border-manus-white/10 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none focus:border-manus-cyan"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-6">
                      <h1 className="text-5xl md:text-6xl font-display font-black text-manus-white tracking-tighter">
                        {artist.displayName}
                      </h1>
                      <div className="w-12 h-12 flex items-center justify-center">
                        <div 
                          className={cn(
                            "w-10 h-10 transition-all duration-500",
                            artist.role === 'admin' ? "bg-manus-orange" : "bg-manus-white/10"
                          )}
                          style={{ 
                            maskImage: 'url(/logo.svg)', 
                            maskSize: 'contain', 
                            maskRepeat: 'no-repeat', 
                            maskPosition: 'center',
                            WebkitMaskImage: 'url(/logo.svg)',
                            WebkitMaskSize: 'contain',
                            WebkitMaskRepeat: 'no-repeat',
                            WebkitMaskPosition: 'center'
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xl font-mono font-bold text-manus-cyan tracking-widest uppercase mt-2">
                      @{artist.handle?.replace(/^@/, '') || artist.displayName.toLowerCase().replace(/\s+/g, '_')}
                    </span>
                  </div>
                )}
                {artist.role === 'admin' && (
                  <div className="px-3 py-1 bg-manus-orange/10 border border-manus-orange/20 rounded-sm">
                    <span className="text-xs font-mono font-bold text-manus-orange tracking-widest uppercase">VERIFIED</span>
                  </div>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-8">
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-xs font-mono uppercase tracking-widest">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-mono text-manus-cyan uppercase tracking-widest">Avatar Shape</label>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setEditAvatarShape('square')}
                          className={cn(
                            "flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all",
                            editAvatarShape === 'square' ? "bg-manus-cyan text-manus-dark border-manus-cyan" : "bg-manus-white/5 border-manus-white/10 text-manus-white/40 hover:bg-manus-white/10"
                          )}
                        >
                          <Square className="w-4 h-4" />
                          <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase">SQUARE</span>
                        </button>
                        <button 
                          onClick={() => setEditAvatarShape('circle')}
                          className={cn(
                            "flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all",
                            editAvatarShape === 'circle' ? "bg-manus-cyan text-manus-dark border-manus-cyan" : "bg-manus-white/5 border-manus-white/10 text-manus-white/40 hover:bg-manus-white/10"
                          )}
                        >
                          <Circle className="w-4 h-4" />
                          <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase">CIRCLE</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-mono text-manus-cyan uppercase tracking-widest">Photo Shape</label>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setEditPhotoShape('square')}
                          className={cn(
                            "flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all",
                            editPhotoShape === 'square' ? "bg-manus-cyan text-manus-dark border-manus-cyan" : "bg-manus-white/5 border-manus-white/10 text-manus-white/40 hover:bg-manus-white/10"
                          )}
                        >
                          <Square className="w-4 h-4" />
                          <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase">SQUARE</span>
                        </button>
                        <button 
                          onClick={() => setEditPhotoShape('circle')}
                          className={cn(
                            "flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all",
                            editPhotoShape === 'circle' ? "bg-manus-cyan text-manus-dark border-manus-cyan" : "bg-manus-white/5 border-manus-white/10 text-manus-white/40 hover:bg-manus-white/10"
                          )}
                        >
                          <Circle className="w-4 h-4" />
                          <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase">CIRCLE</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-mono text-manus-cyan uppercase tracking-widest">Profile Photo</label>
                      <button 
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="w-full py-4 bg-manus-white/5 border border-manus-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-manus-white/10 transition-all group"
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="w-5 h-5 text-manus-cyan animate-spin" />
                        ) : (
                          <Camera className="w-5 h-5 text-manus-white/40 group-hover:text-manus-cyan transition-colors" />
                        )}
                        <span className="text-xs font-mono font-bold text-manus-white/60 group-hover:text-manus-white uppercase tracking-widest">
                          {uploadingAvatar ? 'UPLOADING...' : 'UPLOAD NEW PHOTO'}
                        </span>
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-mono text-manus-cyan uppercase tracking-widest">Banner Image</label>
                      <button 
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={uploadingBanner}
                        className="w-full py-4 bg-manus-white/5 border border-manus-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-manus-white/10 transition-all group"
                      >
                        {uploadingBanner ? (
                          <Loader2 className="w-5 h-5 text-manus-cyan animate-spin" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-manus-white/40 group-hover:text-manus-cyan transition-colors" />
                        )}
                        <span className="text-xs font-mono font-bold text-manus-white/60 group-hover:text-manus-white uppercase tracking-widest">
                          {uploadingBanner ? 'UPLOADING...' : 'UPLOAD NEW BANNER'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono text-manus-cyan uppercase tracking-widest">Bio</label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      rows={4}
                      className="w-full bg-manus-white/5 border border-manus-white/10 rounded-2xl p-6 text-xl text-manus-white/80 font-medium leading-relaxed focus:outline-none focus:border-manus-cyan resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="flex flex-col gap-4">
                    <label className="text-xs font-mono text-manus-cyan uppercase tracking-widest">Social Media Links</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-manus-white/20" />
                        <input
                          type="text"
                          value={editTwitter}
                          onChange={(e) => setEditTwitter(e.target.value)}
                          placeholder="Twitter/X URL"
                          className="w-full bg-manus-white/5 border border-manus-white/10 rounded-xl pl-12 pr-4 py-3 text-xs font-mono text-manus-white focus:outline-none focus:border-manus-cyan"
                        />
                      </div>
                      <div className="relative">
                        <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-manus-white/20" />
                        <input
                          type="text"
                          value={editInstagram}
                          onChange={(e) => setEditInstagram(e.target.value)}
                          placeholder="Instagram URL"
                          className="w-full bg-manus-white/5 border border-manus-white/10 rounded-xl pl-12 pr-4 py-3 text-xs font-mono text-manus-white focus:outline-none focus:border-manus-cyan"
                        />
                      </div>
                      <div className="relative">
                        <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-manus-white/20" />
                        <input
                          type="text"
                          value={editGithub}
                          onChange={(e) => setEditGithub(e.target.value)}
                          placeholder="GitHub URL"
                          className="w-full bg-manus-white/5 border border-manus-white/10 rounded-xl pl-12 pr-4 py-3 text-xs font-mono text-manus-white focus:outline-none focus:border-manus-cyan"
                        />
                      </div>
                      <div className="relative">
                        <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-manus-white/20" />
                        <input
                          type="text"
                          value={editDiscord}
                          onChange={(e) => setEditDiscord(e.target.value)}
                          placeholder="Discord Handle"
                          className="w-full bg-manus-white/5 border border-manus-white/10 rounded-xl pl-12 pr-4 py-3 text-xs font-mono text-manus-white focus:outline-none focus:border-manus-cyan"
                        />
                      </div>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-manus-white/20" />
                        <input
                          type="text"
                          value={editTumblr}
                          onChange={(e) => setEditTumblr(e.target.value)}
                          placeholder="Tumblr URL"
                          className="w-full bg-manus-white/5 border border-manus-white/10 rounded-xl pl-12 pr-4 py-3 text-xs font-mono text-manus-white focus:outline-none focus:border-manus-cyan"
                        />
                      </div>
                      <div className="relative">
                        <Cloud className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-manus-white/20" />
                        <input
                          type="text"
                          value={editBluesky}
                          onChange={(e) => setEditBluesky(e.target.value)}
                          placeholder="Bluesky URL"
                          className="w-full bg-manus-white/5 border border-manus-white/10 rounded-xl pl-12 pr-4 py-3 text-xs font-mono text-manus-white focus:outline-none focus:border-manus-cyan"
                        />
                      </div>
                      <div className="relative">
                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-manus-white/20" />
                        <input
                          type="text"
                          value={editWebsite}
                          onChange={(e) => setEditWebsite(e.target.value)}
                          placeholder="Personal Website URL"
                          className="w-full bg-manus-white/5 border border-manus-white/10 rounded-xl pl-12 pr-4 py-3 text-xs font-mono text-manus-white focus:outline-none focus:border-manus-cyan"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 p-4 bg-manus-white/5 border border-manus-white/10 rounded-xl">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox"
                        id="showOnlineStatus"
                        checked={editShowOnlineStatus}
                        onChange={(e) => setEditShowOnlineStatus(e.target.checked)}
                        className="w-4 h-4 rounded border-manus-white/10 bg-manus-dark text-manus-cyan focus:ring-manus-cyan"
                      />
                      <label htmlFor="showOnlineStatus" className="text-xs font-mono text-manus-white/60 uppercase tracking-widest cursor-pointer">
                        Show Online Status Indicator
                      </label>
                    </div>
                    
                    {editShowOnlineStatus && (
                      <div className="flex gap-2 mt-2">
                        {(['online', 'away', 'offline'] as const).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setEditOnlineStatus(status)}
                            className={cn(
                              "flex-1 py-2 rounded-lg border text-[10px] font-mono font-bold tracking-widest uppercase transition-all",
                              editOnlineStatus === status 
                                ? status === 'online' ? "bg-manus-cyan text-manus-dark border-manus-cyan" 
                                  : status === 'away' ? "bg-manus-yellow text-manus-dark border-manus-yellow" 
                                  : "bg-manus-white/20 text-manus-white border-manus-white/20"
                                : "bg-manus-white/5 border-manus-white/10 text-manus-white/40 hover:bg-manus-white/10"
                            )}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-4">
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2 text-xs font-black text-manus-white/40 hover:text-manus-white uppercase tracking-widest transition-colors"
                    >
                      DISCARD
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-8 py-3 bg-manus-cyan text-manus-dark font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-manus-white transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      SAVE CHANGES
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xl text-manus-white/60 font-medium leading-relaxed max-w-3xl line-clamp-4">
                  {artist.bio || "This artist hasn't added a bio yet. They're letting their work speak for itself."}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 mt-auto">
              <div className="p-6 bg-manus-white/5 border border-manus-white/10 rounded-2xl">
                <div className="text-sm font-mono text-manus-cyan uppercase tracking-widest mb-4">SPECIALIZATIONS</div>
                {isEditing ? (
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={editTags}
                      strategy={horizontalListSortingStrategy}
                    >
                      <div className="flex flex-wrap gap-x-2 gap-y-1">
                        {editTags.map((tag: string) => (
                          <SortableTag key={tag} tag={tag} onRemove={(t: string) => setEditTags(prev => prev.filter(tag => tag !== t))} />
                        ))}
                        <input
                          type="text"
                          placeholder="ADD TAG..."
                          className="bg-manus-white/5 border border-manus-white/10 rounded-full px-4 py-1 text-[10px] font-black text-manus-white placeholder:text-manus-white/20 focus:outline-none focus:border-manus-cyan uppercase tracking-widest"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (val && !editTags.includes(val)) {
                                setEditTags(prev => [...prev, val]);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="flex flex-wrap gap-x-2 gap-y-1">
                    {artist.tags?.map((tag: string) => (
                      <Tag key={tag} label={tag} className="text-sm px-3 py-1" />
                    )) || (
                      <span className="text-sm font-mono text-manus-white/20 uppercase tracking-widest">NO TAGS RECORDED</span>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 bg-manus-white/5 border border-manus-white/10 rounded-2xl">
                <div className="text-sm font-mono text-manus-cyan uppercase tracking-widest mb-4">SYSTEM LOGS</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-mono">
                    <span className="text-manus-white/40">JOINED:</span>
                    <span className="text-manus-white/80">MAR 2024</span>
                  </div>
                  <div className="flex justify-between text-sm font-mono">
                    <span className="text-manus-white/40">LAST ACTIVE:</span>
                    <span className="text-manus-white/80">2 HOURS AGO</span>
                  </div>
                  {artist.showOnlineStatus !== false && (
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-manus-white/40">ONLINE:</span>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          artist.isOnline === 'online' ? "bg-manus-cyan shadow-[0_0_10px_rgba(12,177,199,0.5)] animate-pulse" : 
                          artist.isOnline === 'away' ? "bg-manus-yellow shadow-[0_0_10px_rgba(255,184,0,0.5)]" :
                          "bg-manus-white/20"
                        )} />
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          artist.isOnline === 'online' ? "text-manus-cyan" : 
                          artist.isOnline === 'away' ? "text-manus-yellow" :
                          "text-manus-white/20"
                        )}>
                          {artist.isOnline === 'online' ? 'ACTIVE' : 
                           artist.isOnline === 'away' ? 'AWAY' : 'OFFLINE'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="mb-32">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-display font-black text-manus-white tracking-widest uppercase">Featured</h2>
              <div className="h-px w-24 bg-manus-white/10 hidden md:block" />
            </div>
          </div>

          {projects.filter(p => p.isFeatured).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {projects.filter(p => p.isFeatured).map(project => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  onDelete={isOwnProfile ? handleDeleteProject : undefined}
                  shape={artist.photoShape || 'square'}
                />
              ))}
            </div>
          ) : (
            <div className="py-32 text-center border border-dashed border-manus-white/10 rounded-[3rem]">
              <p className="text-manus-white/20 font-display font-black text-3xl uppercase tracking-[0.2em]">
                NO FEATURED PROJECTS
              </p>
              <p className="mt-4 text-xs font-mono text-manus-white/40 uppercase tracking-widest">
                {isOwnProfile ? "Go to your archive to feature projects on your profile." : "This artist hasn't featured any projects yet."}
              </p>
              {isOwnProfile && (
                <Link 
                  to={`/gallery/${effectiveArtistId}`}
                  className="inline-flex items-center gap-3 mt-8 px-8 py-4 bg-manus-white/5 border border-manus-white/10 text-manus-white font-black text-xs uppercase tracking-[0.3em] rounded-xl hover:bg-manus-cyan hover:text-manus-dark hover:border-manus-cyan transition-all"
                >
                  GO TO ARCHIVE
                </Link>
              )}
            </div>
          )}
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
