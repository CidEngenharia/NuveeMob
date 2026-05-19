import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { FileNode } from '@/src/types';
import { toast } from 'sonner';

interface FileViewerModalProps {
  file: FileNode | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FileViewerModal({ file, isOpen, onClose }: FileViewerModalProps) {
  if (!file) return null;

  const isImage = file.mimeType?.startsWith('image/');
  const isPdf = file.mimeType === 'application/pdf';

  const handleShare = async () => {
    if (file.url) {
      try {
        await navigator.clipboard.writeText(file.url);
        toast.success('Link copiado para a área de transferência!');
      } catch (err) {
        toast.error('Erro ao copiar link.');
      }
    } else {
      toast.error('URL não disponível para este arquivo.');
    }
  };

  const handleDownload = () => {
    if (file.url) {
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Download iniciado!');
    }
  };

  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [file]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="p-4 border-b border-white/5 bg-accent/30">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg truncate pr-4 text-foreground">
              {isImage ? <ImageIcon className="h-5 w-5 text-blue-400" /> : <FileText className="h-5 w-5 text-purple-400" />}
              <span className="truncate">{file.name}</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2 h-8 rounded-full border border-white/5 hover:bg-white/10 text-foreground">
                <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">Copiar Link</span>
              </Button>
              <Button variant="default" size="sm" onClick={handleDownload} className="gap-2 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                <Download className="h-4 w-4" /> <span className="hidden sm:inline">Baixar</span>
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-left">
            {file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : ''} • Atualizado em {new Date(file.updatedAt).toLocaleDateString('pt-BR')}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-black/40 min-h-[50vh]">
          {isImage && !imageError ? (
            <img 
              src={file.url} 
              alt={file.name} 
              onError={() => setImageError(true)}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          ) : isPdf ? (
            <iframe 
              src={`${file.url}#toolbar=0`} 
              className="w-full h-full min-h-[60vh] rounded-lg bg-white"
              title={file.name}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-6">
              <div className="p-6 bg-accent/50 rounded-full border border-white/5">
                <FileText className="h-16 w-16 text-muted-foreground animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">Visualização não suportada</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  Este tipo de arquivo não pode ser visualizado diretamente no aplicativo. Utilize os botões abaixo para visualizar externamente ou baixar o arquivo.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                {file.url && (
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(file.url, '_blank')} 
                    className="gap-2 border-white/10 text-foreground hover:bg-white/5 rounded-full px-6"
                  >
                    <ExternalLink className="h-4 w-4 text-blue-400" /> Visualizar Arquivo
                  </Button>
                )}
                <Button 
                  variant="default" 
                  onClick={handleDownload} 
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-lg shadow-blue-500/20"
                >
                  <Download className="h-4 w-4" /> Baixar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
