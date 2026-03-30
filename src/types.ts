export type ProjectFile = {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
};

export type ProjectFolder = {
  id: string;
  title: string;
  description: string;
  authorUid: string;
  authorName: string;
  authorPhoto: string;
  imageUrl: string;
  category: string;
  tags: string[];
  likesCount: number;
  createdAt: any; // Firestore Timestamp
  hasManicule?: boolean;
};

export type Artist = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  bannerUrl?: string;
  tags: string[];
  hasManicule?: boolean;
};
