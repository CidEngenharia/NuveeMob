import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Folder, ArrowRight, Home } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { FileNode } from '@/src/types';
import { toast } from 'sonner';

interface MoveFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileToMove: FileNode | null;
  onMove: (file: FileNode, newParentId: string | null) => Promise<boolean>;
  userId: string;
}

export function MoveFileModal({ isOpen, onClose, fileToMove, onMove, userId }: MoveFileModalProps) {
  const [folders, setFolders] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchFolders();
    }
  }, [isOpen, userId]);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('userId', userId)
        .eq('type', 'folder')
        .order('name');
        
      if (!error && data) {
        setFolders(data.map((f: any) => ({
          ...f,
          mimeType: f.mimeType || '',
          category: f.category || 'other'
        })) as FileNode[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (targetFolderId: string | null) => {
    if (!fileToMove) return;
    setMoving(true);
    const success = await onMove(fileToMove, targetFolderId);
    setMoving(false);
    if (success) {
      onClose();
    }
  };

  if (!fileToMove) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <ArrowRight className="h-5 w-5 text-blue-500" />
            Mover "{fileToMove.name}"
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">Escolha a pasta de destino:</p>
          
          <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
            <div 
              onClick={() => !moving && handleMove(null)}
              className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-accent/20 hover:bg-accent/40 cursor-pointer transition-colors"
            >
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Home className="h-4 w-4 text-blue-400" />
              </div>
              <span className="text-sm font-medium">Pasta Raiz (Meus Arquivos)</span>
            </div>

            {loading ? (
              <p className="text-sm text-center text-muted-foreground py-4">Carregando pastas...</p>
            ) : (
              folders.filter(f => f.id !== fileToMove.id).map(folder => (
                <div 
                  key={folder.id}
                  onClick={() => !moving && handleMove(folder.id)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-accent/20 hover:bg-accent/40 cursor-pointer transition-colors"
                >
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Folder className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium">{folder.name}</span>
                </div>
              ))
            )}
            
            {!loading && folders.length === 0 && (
              <p className="text-xs text-center text-muted-foreground mt-4">Nenhuma pasta criada ainda.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={moving} className="rounded-full">Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
