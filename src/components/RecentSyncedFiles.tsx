import React from 'react';
import { motion } from 'motion/react';
import { File, Folder, Download, Eye, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/src/lib/supabase';
import { FileNode } from '@/src/types';
import { format } from 'date-fns';

interface RecentSyncedFilesProps {
  userId: string;
  isDemo: boolean;
  onFileClick: (file: FileNode) => void;
  onMoveClick: (file: FileNode) => void;
}

export function RecentSyncedFiles({ userId, isDemo, onFileClick, onMoveClick }: RecentSyncedFilesProps) {
  const [recentFiles, setRecentFiles] = React.useState<FileNode[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchRecent = async () => {
      try {
        if (isDemo) {
          // Tentamos carregar do localStorage de ambas as chaves
          const saved1 = localStorage.getItem('nuveemob_mock_files');
          const saved2 = localStorage.getItem(`nuveemob_mock_files_${userId}`);
          
          let allFiles: FileNode[] = [];
          if (saved1) {
            try { allFiles = JSON.parse(saved1); } catch (e) {}
          }
          if (allFiles.length === 0 && saved2) {
            try { allFiles = JSON.parse(saved2); } catch (e) {}
          }
          
          // Se ainda estiver vazio, usamos os arquivos mock iniciais
          if (allFiles.length === 0) {
            allFiles = [
              {
                id: 'f1',
                name: 'Documentos',
                type: 'folder',
                userId: userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                parentId: null,
              },
              {
                id: 'f2',
                name: 'Fotos de Viagem',
                type: 'folder',
                userId: userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                parentId: null,
              },
              {
                id: 'file1',
                name: 'Contrato_Nuvem.pdf',
                type: 'file',
                mimeType: 'application/pdf',
                size: 2400000,
                category: 'document',
                summary: 'Contrato de prestação de serviços na nuvem.',
                userId: userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                parentId: null,
              },
              {
                id: 'file2',
                name: 'Logo_NuveeMob.png',
                type: 'file',
                mimeType: 'image/png',
                size: 1500000,
                category: 'image',
                userId: userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                parentId: null,
              }
            ];
          }
          
          // Filtrar para remover pastas e arquivos que tenham pai (mostrar apenas a transferência na raiz)
          // Ordenar por data de modificação decrescente e pegar os últimos 6
          const sorted = [...allFiles]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setRecentFiles(sorted.slice(0, 6));
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('files')
          .select('*')
          .eq('userId', userId)
          .order('createdAt', { ascending: false })
          .limit(6);

        if (!error && data) {
          const camelCaseFiles = data.map((f: any) => ({
            id: f.id,
            name: f.name,
            type: f.type,
            size: f.size,
            mimeType: f.mimeType,
            parentId: f.parentId,
            userId: f.userId,
            category: f.category,
            summary: f.summary,
            url: f.url,
            path: f.path,
            createdAt: f.createdAt,
            updatedAt: f.updatedAt,
          })) as FileNode[];
          setRecentFiles(camelCaseFiles);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();

    let channel: any = null;
    if (!isDemo) {
      channel = supabase
        .channel('recent-files')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'files', filter: `userId=eq.${userId}` }, () => {
          fetchRecent();
        })
        .subscribe();
    }

    const handleLocalRefresh = () => {
      fetchRecent();
    };

    window.addEventListener('nuveemob_refresh_files', handleLocalRefresh);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('nuveemob_refresh_files', handleLocalRefresh);
    };
  }, [userId, isDemo]);

  if (loading || recentFiles.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-emerald-500">Transferência Atual</h3>
          <p className="text-xs text-emerald-600/80">Arquivos e pastas transferidos ou sincronizados recentemente (Online)</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {recentFiles.map((file) => (
          <Card key={file.id} className="p-4 flex flex-col gap-3 hover:shadow-lg transition-all border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onFileClick(file)}>
              <div className="p-2 bg-emerald-500/20 rounded-lg shadow-sm">
                {file.type === 'folder' ? (
                  <Folder className="h-5 w-5 text-emerald-500 fill-emerald-500/20" />
                ) : (
                  <File className="h-5 w-5 text-emerald-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate text-emerald-500">{file.name}</p>
                <p className="text-[10px] text-emerald-600/80 uppercase font-medium tracking-wider">
                  {file.type === 'folder' ? 'Pasta Online' : (file.mimeType?.split('/')[1] || 'Arquivo')} • {format(new Date(file.createdAt), "dd/MM/yy")}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-auto">
              <Button variant="secondary" size="sm" className="flex-1 h-8 text-xs gap-1 border-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5" onClick={() => onFileClick(file)}>
                <Eye className="h-3 w-3" /> Abrir
              </Button>
              {onMoveClick && (
                <Button variant="default" size="sm" className="flex-1 h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20" onClick={() => onMoveClick(file)}>
                  <ArrowLeft className="h-3 w-3 rotate-180" /> Mover
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
