export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  size?: number;
  category?: 'document' | 'image' | 'video' | 'audio' | 'other';
  summary?: string;
  tags?: string[];
  url?: string;
  path?: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface StorageStats {
  used: number;
  total: number;
  fileCount: number;
}

export interface Device {
  id: string;
  name: string;
  type: 'mobile' | 'tablet' | 'desktop';
  status: 'online' | 'offline';
  lastSeen: string;
}
