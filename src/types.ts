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
  artistId: string;
  artistName: string;
  artistAvatar: string;
  files: ProjectFile[];
  tags: string[];
  createdAt: string;
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
