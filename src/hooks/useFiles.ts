import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { FileNode } from '@/src/types';
import { toast } from 'sonner';
import { performOCR } from '@/src/services/aiService';

const MOCK_STORAGE_KEY = 'nuveemob_mock_files';

const INITIAL_MOCK_FILES: FileNode[] = [
  {
    id: 'f1',
    name: 'Documentos',
    type: 'folder',
    userId: 'demo-user-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parentId: null,
  },
  {
    id: 'f2',
    name: 'Fotos de Viagem',
    type: 'folder',
    userId: 'demo-user-123',
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
    userId: 'demo-user-123',
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
    userId: 'demo-user-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parentId: null,
  },
  {
    id: 'file3',
    name: 'Planilha_Financeira.xlsx',
    type: 'file',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 850000,
    category: 'document',
    userId: 'demo-user-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parentId: null,
  }
];

function getCategoryFromMime(mimeType: string): 'document' | 'image' | 'video' | 'audio' | 'other' {
  if (!mimeType) return 'other';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  
  const docTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];
  
  if (docTypes.includes(mimeType) || mimeType.startsWith('text/')) {
    return 'document';
  }
  return 'other';
}

export function useFiles(parentId: string | null = null, isDemo: boolean = false) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);

  // Inicializa o localStorage para persistência de mocks em modo Demo
  const getMockFiles = useCallback((): FileNode[] => {
    const saved = localStorage.getItem(MOCK_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_MOCK_FILES;
      }
    }
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_FILES));
    return INITIAL_MOCK_FILES;
  }, []);

  const saveMockFiles = useCallback((updatedFiles: FileNode[]) => {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(updatedFiles));
  }, []);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    if (isDemo) {
      setTimeout(() => {
        const allMocks = getMockFiles();
        const filtered = allMocks.filter(f => f.parentId === parentId);
        setFiles(filtered);
        setLoading(false);
      }, 300);
      return;
    }

    try {
      let query = supabase
        .from('files')
        .select('*')
        .order('type', { ascending: false })
        .order('name', { ascending: true });
      
      if (parentId) {
        query = query.eq('parentId', parentId);
      } else {
        query = query.is('parentId', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Adaptar snake_case do Supabase para camelCase do TypeScript
      const camelCaseFiles = (data || []).map((f: any) => ({
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
        tags: f.tags,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })) as FileNode[];

      setFiles(camelCaseFiles);
    } catch (error: any) {
      console.error('Error fetching files:', error);
      toast.error('Erro ao buscar arquivos no banco de dados.');
    } finally {
      setLoading(false);
    }
  }, [parentId, isDemo, getMockFiles]);

  const uploadFile = useCallback(async (file: File): Promise<boolean> => {
    let extractedText = '';
    if (file.type.startsWith('image/')) {
      try {
        const ocrToast = toast.loading('IA analisando texto da imagem (OCR)...');
        extractedText = await performOCR(file);
        if (extractedText && extractedText.trim()) {
          toast.success('Texto extraído com sucesso!', { id: ocrToast });
        } else {
          toast.dismiss(ocrToast);
        }
      } catch (err) {
        console.warn('Falha no OCR:', err);
      }
    }

    if (isDemo) {
      const allMocks = getMockFiles();
      const mockId = 'mock-file-' + Math.random().toString(36).substring(2, 9);
      const newFile: FileNode = {
        id: mockId,
        name: file.name,
        type: 'file',
        mimeType: file.type,
        size: file.size,
        category: getCategoryFromMime(file.type),
        userId: 'demo-user-123',
        parentId: parentId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const updated = [...allMocks, newFile];
      saveMockFiles(updated);
      fetchFiles();
      toast.success('Arquivo enviado com sucesso!');

      // Chamada assíncrona de IA para modo Demo
      fetch('/api/ai/analyze-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          textContent: extractedText ? `Texto extraído da imagem via OCR: ${extractedText}` : `Nome do arquivo simulado: ${file.name}.`
        })
      }).then(async (res) => {
        if (res.ok) {
          const aiData = await res.json();
          const mocksList = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '[]');
          const index = mocksList.findIndex((m: any) => m.id === mockId);
          if (index !== -1) {
            mocksList[index].summary = aiData.summary;
            mocksList[index].tags = aiData.tags;
            mocksList[index].category = aiData.category || mocksList[index].category;
            localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mocksList));
            fetchFiles();
            toast.success(`IA analisou o arquivo Demo "${file.name}"!`);
          }
        }
      }).catch(e => console.warn('Demo AI Analysis failed:', e));

      return true;
    }

    const uploadToast = toast.loading('Preparando upload do arquivo...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      // Gerar caminho exclusivo dentro do Storage
      const fileId = crypto.randomUUID();
      const sanitizedName = file.name.replace(/[^\x00-\x7F]/g, ''); // Remove acentos ou caracteres especiais
      const filePath = `${user.id}/${fileId}_${sanitizedName}`;

      toast.loading('Enviando para o Supabase Storage...', { id: uploadToast });
      
      const { data: storageData, error: storageError } = await supabase.storage
        .from('nuveemob-files')
        .upload(filePath, file);

      if (storageError) throw storageError;

      toast.loading('Registrando metadados do arquivo...', { id: uploadToast });

      const { data: urlData } = supabase.storage
        .from('nuveemob-files')
        .getPublicUrl(storageData.path);

      const publicUrl = urlData.publicUrl;

      // Inserir registro na tabela files do Supabase
      const { data: insertedData, error: dbError } = await supabase
        .from('files')
        .insert({
          name: file.name,
          type: 'file',
          size: file.size,
          mimeType: file.type,
          parentId: parentId,
          userId: user.id,
          path: storageData.path,
          url: publicUrl,
          category: getCategoryFromMime(file.type),
        })
        .select();

      if (dbError) throw dbError;

      toast.success('Arquivo carregado com sucesso!', { id: uploadToast });
      fetchFiles();

      const insertedFile = insertedData?.[0];
      if (insertedFile) {
        // Chamada assíncrona do Gemini em background para obter resumo e etiquetas inteligentes
        fetch('/api/ai/analyze-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            textContent: extractedText ? `Texto extraído da imagem via OCR: ${extractedText}` : `Arquivo real: ${file.name}. Tamanho: ${(file.size / 1024).toFixed(1)} KB.`
          })
        }).then(async (res) => {
          if (res.ok) {
            const aiData = await res.json();
            if (aiData.summary || aiData.tags) {
              await supabase
                .from('files')
                .update({
                  summary: aiData.summary,
                  tags: aiData.tags,
                  category: aiData.category || insertedFile.category
                })
                .eq('id', insertedFile.id);
              toast.success(`IA do Gemini analisou "${file.name}"!`);
              fetchFiles();
            }
          }
        }).catch(err => console.warn('AI Analysis failed:', err));
      }

      return true;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(`Falha no upload: ${error.message || 'Erro desconhecido'}`, { id: uploadToast });
      return false;
    }
  }, [parentId, isDemo, getMockFiles, saveMockFiles, fetchFiles]);

  const createFolder = useCallback(async (name: string): Promise<boolean> => {
    if (!name.trim()) {
      toast.error('O nome da pasta não pode ser vazio.');
      return false;
    }

    if (isDemo) {
      const allMocks = getMockFiles();
      const newFolder: FileNode = {
        id: 'mock-folder-' + Math.random().toString(36).substring(2, 9),
        name: name.trim(),
        type: 'folder',
        userId: 'demo-user-123',
        parentId: parentId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...allMocks, newFolder];
      saveMockFiles(updated);
      fetchFiles();
      toast.success('Pasta criada com sucesso!');
      return true;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const { error } = await supabase
        .from('files')
        .insert({
          name: name.trim(),
          type: 'folder',
          parentId: parentId,
          userId: user.id,
        });

      if (error) throw error;

      toast.success('Pasta criada com sucesso!');
      fetchFiles();
      return true;
    } catch (error: any) {
      console.error('Error creating folder:', error);
      toast.error(`Erro ao criar pasta: ${error.message}`);
      return false;
    }
  }, [parentId, isDemo, getMockFiles, saveMockFiles, fetchFiles]);

  const deleteFile = useCallback(async (file: FileNode): Promise<boolean> => {
    if (isDemo) {
      const allMocks = getMockFiles();
      // Função recursiva para deletar pasta e todos os seus filhos
      const deleteRecursive = (list: FileNode[], targetId: string): FileNode[] => {
        let currentList = list.filter(item => item.id !== targetId);
        const children = list.filter(item => item.parentId === targetId);
        for (const child of children) {
          currentList = deleteRecursive(currentList, child.id);
        }
        return currentList;
      };

      const updated = deleteRecursive(allMocks, file.id);
      saveMockFiles(updated);
      fetchFiles();
      toast.success('Excluído com sucesso!');
      return true;
    }

    const deleteToast = toast.loading('Excluindo item...');
    try {
      // Se for um arquivo físico e tiver caminho de storage, exclui do bucket
      if (file.type === 'file' && file.path) {
        toast.loading('Removendo arquivo físico do Storage...', { id: deleteToast });
        const { error: storageError } = await supabase.storage
          .from('nuveemob-files')
          .remove([file.path]);

        if (storageError) {
          console.warn('Warning deleting storage file:', storageError);
        }
      }

      toast.loading('Removendo registro do banco de dados...', { id: deleteToast });
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      toast.success('Item excluído permanentemente!', { id: deleteToast });
      fetchFiles();
      return true;
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast.error(`Erro ao excluir item: ${error.message}`, { id: deleteToast });
      return false;
    }
  }, [isDemo, getMockFiles, saveMockFiles, fetchFiles]);

  useEffect(() => {
    fetchFiles();

    if (!isDemo) {
      // Inscrição em tempo real para atualizações da tabela files
      const channel = supabase
        .channel('files-realtime-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'files' },
          () => {
            fetchFiles();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchFiles, isDemo]);

  return { 
    files, 
    loading, 
    refresh: fetchFiles, 
    uploadFile, 
    createFolder, 
    deleteFile 
  };
}
