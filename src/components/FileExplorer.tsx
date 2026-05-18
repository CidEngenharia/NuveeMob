import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  File, 
  Folder, 
  MoreVertical, 
  Download, 
  Trash2, 
  Share2, 
  Cloud,
  LayoutGrid,
  List,
  Search,
  Plus,
  Upload,
  ArrowLeft,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { FileNode } from '@/src/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface FileExplorerProps {
  files: FileNode[];
  loading: boolean;
  onFileClick: (file: FileNode) => void;
  onDelete: (file: FileNode) => void;
  onUpload: () => void;
  onCreateFolder?: () => void;
  onSearch: (query: string) => void;
  parentId: string | null;
  onBack: () => void;
}

export function FileExplorer({ 
  files, 
  loading, 
  onFileClick, 
  onDelete, 
  onUpload,
  onCreateFolder,
  onSearch,
  parentId,
  onBack
}: FileExplorerProps) {
  const [view, setView] = React.useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar com IA..." 
            className="pl-10 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="flex bg-muted p-1 rounded-md mr-1">
            <Button 
              variant={view === 'grid' ? 'secondary' : 'ghost'} 
              size="icon" 
              onClick={() => setView('grid')}
              className="h-8 w-8"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={view === 'list' ? 'secondary' : 'ghost'} 
              size="icon" 
              onClick={() => setView('list')}
              className="h-8 w-8"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          {onCreateFolder && (
            <Button onClick={onCreateFolder} variant="outline" className="gap-2 rounded-full border-border hover:bg-accent text-foreground">
              <Plus className="h-4 w-4" />
              Nova Pasta
            </Button>
          )}
          <Button onClick={onUpload} className="flex-1 md:flex-none gap-2 rounded-full bg-primary text-primary-foreground hover:opacity-90">
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {/* Breadcrumbs (Minimal) */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {parentId && (
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-accent" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Cloud className="h-3.5 w-3.5 text-blue-500" />
        <span 
          className="hover:text-foreground cursor-pointer transition-colors" 
          onClick={() => {
            if (parentId) onBack();
          }}
        >
          Meus Arquivos
        </span>
        {parentId && (
          <>
            <span>/</span>
            <span className="text-foreground font-medium">Subpasta</span>
          </>
        )}
      </div>

      {/* Files Content */}
      <AnimatePresence mode="popLayout">
        {files.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-muted-foreground"
          >
            <div className="p-4 bg-accent rounded-full mb-4">
              <Cloud className="h-8 w-8 opacity-20" />
            </div>
            <p>Nenhum arquivo ou pasta encontrado</p>
            <div className="flex gap-2 mt-2">
              {onCreateFolder && (
                <Button variant="link" onClick={onCreateFolder}>Criar pasta</Button>
              )}
              <Button variant="link" onClick={onUpload}>Começar upload</Button>
            </div>
          </motion.div>
        ) : view === 'grid' ? (
          <motion.div 
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            {files.map((file) => (
              <motion.div
                key={file.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => onFileClick(file)}
              >
                <Card className="p-4 cursor-pointer hover:shadow-lg transition-all group border-none bg-accent/30 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-background rounded-lg shadow-sm">
                      {file.type === 'folder' ? (
                        <Folder className="h-8 w-8 text-blue-500 fill-blue-500/20" />
                      ) : (
                        <File className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {file.type === 'file' && file.url && (
                          <DropdownMenuItem className="gap-2" onClick={(e) => {
                            e.stopPropagation();
                            window.open(file.url, '_blank');
                          }}>
                            <Eye className="h-4 w-4" /> Visualizar
                          </DropdownMenuItem>
                        )}
                        {file.type === 'file' && file.url && (
                          <DropdownMenuItem className="gap-2" onClick={(e) => {
                            e.stopPropagation();
                            const link = document.createElement('a');
                            link.href = file.url || '';
                            link.download = file.name;
                            link.target = '_blank';
                            link.click();
                          }}>
                            <Download className="h-4 w-4" /> Download
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="gap-2 text-destructive" onClick={(e) => {
                          e.stopPropagation();
                          onDelete(file);
                        }}>
                          <Trash2 className="h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-wider">
                      <span>{file.type === 'folder' ? 'Folder' : (file.mimeType?.split('/')[1] || 'File')}</span>
                      {file.type === 'file' && file.size && <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>}
                    </div>
                  </div>

                  {file.category && (
                    <div className="mt-2 flex gap-1 flex-wrap">
                      <Badge variant="secondary" className="text-[8px] px-1 py-0">{file.category}</Badge>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div layout className="rounded-xl border overflow-hidden bg-background">
            <div className="grid grid-cols-12 gap-4 p-4 border-b text-xs font-semibold text-muted-foreground uppercase">
              <div className="col-span-6">Nome</div>
              <div className="col-span-3">Tamanho</div>
              <div className="col-span-2">Modificado</div>
              <div className="col-span-1"></div>
            </div>
            {files.map((file) => (
              <div 
                key={file.id} 
                className="grid grid-cols-12 gap-4 p-4 border-t hover:bg-accent/50 cursor-pointer items-center transition-colors text-sm"
                onClick={() => onFileClick(file)}
              >
                <div className="col-span-6 flex items-center gap-3">
                  {file.type === 'folder' ? <Folder className="h-4 w-4 text-blue-500" /> : <File className="h-4 w-4 text-primary" />}
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="col-span-3 text-muted-foreground">
                  {file.type === 'file' && file.size ? (file.size / 1024 / 1024).toFixed(1) + ' MB' : '--'}
                </div>
                <div className="col-span-2 text-muted-foreground">
                  {format(new Date(file.updatedAt), 'dd/MM/yy')}
                </div>
                <div className="col-span-1 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {file.type === 'file' && file.url && (
                        <DropdownMenuItem className="gap-2" onClick={(e) => {
                          e.stopPropagation();
                          window.open(file.url, '_blank');
                        }}>
                          <Eye className="h-4 w-4" /> Visualizar
                        </DropdownMenuItem>
                      )}
                      {file.type === 'file' && file.url && (
                        <DropdownMenuItem className="gap-2" onClick={(e) => {
                          e.stopPropagation();
                          const link = document.createElement('a');
                          link.href = file.url || '';
                          link.download = file.name;
                          link.target = '_blank';
                          link.click();
                        }}>
                          <Download className="h-4 w-4" /> Download
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="gap-2 text-destructive" onClick={(e) => {
                        e.stopPropagation();
                        onDelete(file);
                      }}>
                        <Trash2 className="h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
