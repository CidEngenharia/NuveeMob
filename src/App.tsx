/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SplashScreen } from '@/src/components/SplashScreen';
import { useAuth } from '@/src/hooks/useAuth';
import { useFiles } from '@/src/hooks/useFiles';
import { useDevices } from '@/src/hooks/useDevices';
import { FileExplorer } from '@/src/components/FileExplorer';
import { FileViewerModal } from '@/src/components/FileViewerModal';
import { MoveFileModal } from '@/src/components/MoveFileModal';
import { RecentSyncedFiles } from '@/src/components/RecentSyncedFiles';
import { 
  Cloud, 
  Smartphone, 
  LogOut, 
  Bell, 
  Cpu, 
  History, 
  SearchCode,
  Zap,
  LayoutDashboard,
  ShieldCheck,
  QrCode,
  Plus,
  Eye,
  File,
  Folder,
  Trash2,
  Laptop,
  Tablet,
  Monitor
} from 'lucide-react';
import { ThemeToggle } from '@/src/components/ThemeToggle';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/src/lib/supabase';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { FileNode } from '@/src/types';
import { format } from 'date-fns';



interface ActivityLog {
  id: string;
  type: 'upload' | 'delete' | 'create_folder' | 'ai_search' | 'device_connect' | 'device_disconnect';
  description: string;
  timestamp: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  relevantFiles?: FileNode[];
}



const INITIAL_ACTIVITIES: ActivityLog[] = [
  { id: 'act1', type: 'device_connect', description: 'Dispositivo iPhone 15 Pro conectado.', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 'act2', type: 'create_folder', description: 'Pasta "Documentos" criada no diretório raiz.', timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
  { id: 'act3', type: 'upload', description: 'Upload do arquivo "Contrato_Nuvem.pdf" realizado com sucesso.', timestamp: new Date(Date.now() - 3600000 * 12).toISOString() }
];

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  { 
    id: 'msg1', 
    sender: 'assistant', 
    text: 'Olá! Sou o NuveeAssist, seu assistente virtual inteligente. Pergunte-me qualquer coisa sobre os seus arquivos armazenados (por exemplo, "Onde está o contrato da nuvem?") e eu ajudarei você a encontrá-los e resumi-los.', 
    timestamp: new Date().toISOString() 
  }
];

export default function App() {
  const { user, loading: authLoading, loginAsDemo, logout } = useAuth();
  const [currentFolderId, setCurrentFolderId] = React.useState<string | null>(null);
  const [folderHistory, setFolderHistory] = React.useState<string[]>([]);
  const { 
    files, 
    loading: filesLoading, 
    uploadFile, 
    createFolder, 
    deleteFile,
    moveFile
  } = useFiles(currentFolderId, (user as any)?.isDemo);

  const [activeTab, setActiveTab] = React.useState('files');
  const [isUploading, setIsUploading] = React.useState(false);
  const [splashDone, setSplashDone] = React.useState(false);
  
  // Estados de Autenticação por E-mail e Senha
  const [authMode, setAuthMode] = React.useState<'login' | 'signup'>('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [authSubmitting, setAuthSubmitting] = React.useState(false);
  
  // Estados para Visualização de Arquivo
  const [selectedFileForView, setSelectedFileForView] = React.useState<FileNode | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = React.useState(false);

  // Estados para Mover Arquivo
  const [selectedFileForMove, setSelectedFileForMove] = React.useState<FileNode | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = React.useState(false);

  // Controle do diálogo de nova pasta
  const [isNewFolderOpen, setIsNewFolderOpen] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState('');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Estados para Dispositivos
  const { devices, connectDevice, disconnectDevice } = useDevices((user as any)?.isDemo);

  // Modal do QR Code de Dispositivos
  const [isQrModalOpen, setIsQrModalOpen] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);

  // Estados para Módulos de Sincronização em Nuvem (Google Drive, OneDrive, Dropbox)
  const [cloudIntegrations, setCloudIntegrations] = React.useState(() => {
    const saved = localStorage.getItem('nuveemob_cloud_integrations');
    return saved ? JSON.parse(saved) : {
      googleDrive: { connected: false, email: '', sizeUsed: '0 GB', totalSize: '15 GB' },
      oneDrive: { connected: false, email: '', sizeUsed: '0 GB', totalSize: '5 GB' },
      dropbox: { connected: false, email: '', sizeUsed: '0 GB', totalSize: '2 GB' }
    };
  });

  React.useEffect(() => {
    localStorage.setItem('nuveemob_cloud_integrations', JSON.stringify(cloudIntegrations));
  }, [cloudIntegrations]);

  const handleConnectCloud = (provider: 'googleDrive' | 'oneDrive' | 'dropbox') => {
    const providerNames = {
      googleDrive: 'Google Drive',
      oneDrive: 'OneDrive',
      dropbox: 'Dropbox'
    };
    const defaultEmails = {
      googleDrive: 'usuario@gmail.com',
      oneDrive: 'usuario@outlook.com',
      dropbox: 'usuario@dropbox.com'
    };
    const spaceUsed = {
      googleDrive: '4.2 GB',
      oneDrive: '1.8 GB',
      dropbox: '450 MB'
    };

    const isConnected = cloudIntegrations[provider].connected;

    if (isConnected) {
      // Desconectar
      setCloudIntegrations(prev => ({
        ...prev,
        [provider]: { ...prev[provider], connected: false, email: '' }
      }));
      toast.success(`${providerNames[provider]} desconectado com sucesso.`);
      logActivity('device_disconnect', `Integração com ${providerNames[provider]} removida.`);
    } else {
      // Conectar
      const email = window.prompt(`Digite seu e-mail de autenticação para o ${providerNames[provider]}:`, defaultEmails[provider]);
      if (email === null) return; // Cancelado
      
      const finalEmail = email.trim() || defaultEmails[provider];
      setCloudIntegrations(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          connected: true,
          email: finalEmail,
          sizeUsed: spaceUsed[provider]
        }
      }));
      toast.success(`Conexão com ${providerNames[provider]} realizada com sucesso!`);
      logActivity('device_connect', `Integração com ${providerNames[provider]} configurada (${finalEmail}).`);
    }
  };

  const handleSyncCloud = async (provider: 'googleDrive' | 'oneDrive' | 'dropbox') => {
    const providerNames = {
      googleDrive: 'Google Drive',
      oneDrive: 'OneDrive',
      dropbox: 'Dropbox'
    };
    
    const syncToast = toast.loading(`Sincronizando arquivos do ${providerNames[provider]}...`);
    
    setTimeout(async () => {
      // Simula a sincronização adicionando um arquivo do serviço na lista
      const demoFiles = {
        googleDrive: { name: 'Apresentacao_Nuveemob_GDrive.pptx', size: 1024 * 1024 * 4.5, mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
        oneDrive: { name: 'Relatorio_Financeiro_OneDrive.xlsx', size: 1024 * 1024 * 1.2, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        dropbox: { name: 'Backup_Config_Dropbox.zip', size: 1024 * 1024 * 8.7, mimeType: 'application/zip' }
      };

      const fileData = demoFiles[provider];
      
      // Se estiver no modo demo ou logado no supabase, adicionamos o arquivo no banco
      if (!(user as any)?.isDemo) {
        try {
          const { error } = await supabase.from('files').insert([
            { 
              name: fileData.name, 
              type: 'file', 
              size: fileData.size, 
              mimeType: fileData.mimeType, 
              userId: user.id,
              category: 'document'
            }
          ]);
          if (error) console.error('Erro ao inserir arquivo da nuvem no Supabase:', error);
        } catch (e) {
          console.error(e);
        }
      } else {
        // Mock local
        const mockKey = `nuveemob_mock_files_${user.id}`;
        const saved = localStorage.getItem(mockKey);
        const allMocks = saved ? JSON.parse(saved) : [];
        
        const newFile = {
          id: 'cloud-' + Math.random().toString(36).substring(2, 9),
          name: fileData.name,
          type: 'file',
          size: fileData.size,
          mimeType: fileData.mimeType,
          parentId: null,
          userId: user.id,
          category: 'document',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        allMocks.push(newFile);
        localStorage.setItem(mockKey, JSON.stringify(allMocks));
        
        // Disparar refresh de arquivos
        const refreshEvent = new CustomEvent('nuveemob_refresh_files');
        window.dispatchEvent(refreshEvent);
      }

      toast.success(`Arquivos do ${providerNames[provider]} sincronizados com sucesso!`, { id: syncToast });
      logActivity('upload', `Sincronizados novos arquivos do ${providerNames[provider]}.`);
    }, 1500);
  };

  // Estados para Atividades
  const [activities, setActivities] = React.useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('nuveemob_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  React.useEffect(() => {
    localStorage.setItem('nuveemob_activities', JSON.stringify(activities));
  }, [activities]);

  const logActivity = React.useCallback((type: ActivityLog['type'], description: string) => {
    const newActivity: ActivityLog = {
      id: 'act-' + Math.random().toString(36).substring(2, 9),
      type,
      description,
      timestamp: new Date().toISOString()
    };
    setActivities(prev => [newActivity, ...prev]);
  }, []);

  // Estados para Filtro IA no Dashboard
  const [aiFilterActive, setAiFilterActive] = React.useState(false);
  const [filteredFileIds, setFilteredFileIds] = React.useState<string[]>([]);
  const [aiSearchTerm, setAiSearchTerm] = React.useState('');

  // Estados para a Busca Conversacional por IA (Chat)
  const [messages, setMessages] = React.useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [chatInput, setChatInput] = React.useState('');
  const [isChatLoading, setIsChatLoading] = React.useState(false);

  // Lógica de auto-conexão via QR Code
  React.useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'connect') {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const deviceType = isMobile ? 'mobile' : 'desktop';
      
      let defaultName = isMobile ? 'Smartphone' : 'Computador';
      
      const androidMatch = navigator.userAgent.match(/Android\s[0-9\.]+;\s([^;]+)(?:\sBuild|\))/);
      if (androidMatch && androidMatch[1]) {
        defaultName = androidMatch[1].trim();
      } else if (/iPhone/i.test(navigator.userAgent)) {
        defaultName = 'iPhone';
      } else if (/iPad/i.test(navigator.userAgent)) {
        defaultName = 'iPad';
      } else if (/Android/i.test(navigator.userAgent)) {
        defaultName = 'Android';
      } else if (/Windows/i.test(navigator.userAgent)) {
        defaultName = 'PC Windows';
      } else if (/Mac OS/i.test(navigator.userAgent)) {
        defaultName = 'Mac';
      }

      // Permite que o usuário confirme ou altere o nome do dispositivo
      const finalName = window.prompt('Confirme ou digite o nome exato deste dispositivo para sincronizar:', defaultName) || defaultName;

      connectDevice(finalName, deviceType).then(() => {
        toast.success(`Dispositivo ${finalName} conectado com sucesso!`);
        logActivity('device_connect', `Dispositivo ${finalName} sincronizado via QR Code.`);
        // Limpa a URL para evitar re-conexões no refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }
  }, [user, connectDevice, logActivity]);

  // Garante que a splash screen fique visível por no mínimo 10 segundos
  React.useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }
    setAuthSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setAuthSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Login realizado com sucesso!");
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }
    setAuthSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: email.split('@')[0],
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
        }
      }
    });
    setAuthSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Cadastro realizado com sucesso! Verifique seu e-mail para confirmação.");
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleDemoLogin = () => {
    loginAsDemo();
    toast.success("Logado como Conta Demo!");
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const file = e.target.files[0];
      const success = await uploadFile(file);
      if (success) {
        logActivity('upload', `Upload do arquivo "${file.name}" realizado com sucesso.`);
      }
      setIsUploading(false);
      e.target.value = ''; // Reseta o input
    }
  };

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const success = await createFolder(newFolderName);
    if (success) {
      logActivity('create_folder', `Pasta "${newFolderName.trim()}" criada com sucesso.`);
      setNewFolderName('');
      setIsNewFolderOpen(false);
    }
  };

  const handleDeleteFile = async (file: FileNode) => {
    const success = await deleteFile(file);
    if (success) {
      logActivity('delete', `Item "${file.name}" excluído permanentemente.`);
    }
  };

  const handleFileClick = (file: FileNode) => {
    if (file.type === 'folder') {
      // Guarda a pasta atual no histórico para poder voltar depois
      setFolderHistory(prev => [...prev, currentFolderId as string].filter(id => id !== undefined));
      setCurrentFolderId(file.id);
    } else {
      setSelectedFileForView(file);
      setIsFileViewerOpen(true);
    }
  };

  const handleBack = () => {
    const history = [...folderHistory];
    const prevFolder = history.pop();
    setFolderHistory(history);
    setCurrentFolderId(prevFolder || null);
  };

  // Pareamento de dispositivos
  const handleSimulateConnection = async () => {
    setIsConnecting(true);
    const success = await connectDevice('Samsung Galaxy S24 Ultra', 'mobile');
    if (success) {
      logActivity('device_connect', `Novo dispositivo pareado com sucesso.`);
      setIsQrModalOpen(false);
    }
    setIsConnecting(false);
  };

  const handleDisconnectDevice = async (id: string, name: string) => {
    const success = await disconnectDevice(id);
    if (success) {
      logActivity('device_disconnect', `Dispositivo "${name}" desconectado.`);
    }
  };

  // Busca Semântica na Barra Superior do Dashboard
  const handleAiSearch = async (query: string) => {
    if (!query.trim()) {
      handleClearAiFilter();
      return;
    }
    
    const searchToast = toast.loading('IA do Gemini analisando relevância...');
    try {
      const response = await fetch('/api/ai/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, files })
      });
      
      if (!response.ok) throw new Error('Falha na resposta do servidor.');
      
      const data = await response.json();
      const relevantIds = data.relevantFileIds || [];
      
      setFilteredFileIds(relevantIds);
      setAiSearchTerm(query);
      setAiFilterActive(true);
      
      logActivity('ai_search', `Pesquisa semântica por IA realizada: "${query}".`);
      
      if (relevantIds.length > 0) {
        toast.success(`Busca inteligente concluída! Encontrados ${relevantIds.length} arquivos correspondentes.`, { id: searchToast });
      } else {
        toast.info('Nenhum arquivo relevante foi encontrado para o termo pesquisado.', { id: searchToast });
      }
    } catch (error) {
      console.error('Error in semantic search:', error);
      toast.error('Erro ao realizar busca inteligente por IA.', { id: searchToast });
    }
  };

  const handleClearAiFilter = () => {
    setAiFilterActive(false);
    setFilteredFileIds([]);
    setAiSearchTerm('');
  };

  // Busca Conversacional IA (Chat)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMsgText = chatInput.trim();
    setChatInput('');
    
    const newUserMessage: ChatMessage = {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setIsChatLoading(true);
    
    try {
      const response = await fetch('/api/ai/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsgText, files })
      });
      
      if (!response.ok) throw new Error('Falha no assistente de IA.');
      
      const data = await response.json();
      const recommendedFiles = files.filter(f => data.relevantFileIds?.includes(f.id));
      
      const assistantMessage: ChatMessage = {
        id: 'msg-' + Math.random().toString(36).substring(2, 9),
        sender: 'assistant',
        text: data.response || 'Não consegui encontrar arquivos correspondentes no seu espaço.',
        timestamp: new Date().toISOString(),
        relevantFiles: recommendedFiles
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      logActivity('ai_search', `Conversa com IA iniciada: "${userMsgText}".`);
    } catch (error) {
      console.error('Error chatting with AI:', error);
      const errorMessage: ChatMessage = {
        id: 'msg-' + Math.random().toString(36).substring(2, 9),
        sender: 'assistant',
        text: 'Desculpe, ocorreu um erro ao me comunicar com o servidor. Por favor, tente novamente.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const showSplash = authLoading || !splashDone;

  if (showSplash) {
    return <SplashScreen />;
  }

  if (!user) {
    const floatingDevices = [
      { icon: Smartphone, x: "12%", top: "18%", size: 26, delay: 0, duration: 9 },
      { icon: Laptop, x: "78%", top: "14%", size: 34, delay: 1.2, duration: 11 },
      { icon: Tablet, x: "14%", top: "72%", size: 30, delay: 2.5, duration: 10 },
      { icon: Monitor, x: "76%", top: "68%", size: 38, delay: 0.5, duration: 12 },
      { icon: Zap, x: "46%", top: "8%", size: 22, delay: 1.8, duration: 8 },
      { icon: Cloud, x: "84%", top: "42%", size: 30, delay: 3.2, duration: 9.5 }
    ];

    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background p-6 relative overflow-hidden">
        {/* Dispositivos flutuando no background de forma discreta */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px]" />
          
          {floatingDevices.map((device, index) => {
            const Icon = device.icon;
            return (
              <motion.div
                key={index}
                className="absolute text-purple-500/15 dark:text-purple-400/10"
                style={{ left: device.x, top: device.top }}
                animate={{
                  y: [0, -15, 0],
                  x: [0, 8, 0],
                  rotate: [0, 8, -8, 0],
                }}
                transition={{
                  duration: device.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: device.delay,
                }}
              >
                <Icon style={{ width: device.size, height: device.size }} />
              </motion.div>
            );
          })}
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-6 relative z-10"
        >
          {/* Ícone de Nuvem lilás pulsante */}
          <div className="flex justify-center">
            <motion.div 
              animate={{ 
                scale: [1, 1.08, 1],
                boxShadow: [
                  "0 0 0 0 rgba(168, 85, 247, 0.4)",
                  "0 0 0 15px rgba(168, 85, 247, 0)",
                  "0 0 0 0 rgba(168, 85, 247, 0)"
                ]
              }}
              transition={{ 
                duration: 2.2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="p-5 bg-purple-500/10 border border-purple-500/20 rounded-full shadow-lg shadow-purple-500/5"
            >
              <Cloud className="h-12 w-12 text-purple-400" />
            </motion.div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter text-foreground">NuveeMob</h1>
            <p className="text-muted-foreground text-sm">Faça o login para ter acesso aos seus dispositvos instantaneamente.</p>
          </div>

          {/* Formulário de Login / Cadastro */}
          <form 
            onSubmit={authMode === 'login' ? handleEmailLogin : handleEmailSignup} 
            className="space-y-4 text-left bg-card border border-border p-6 rounded-2xl shadow-xl backdrop-blur-md"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">E-mail</label>
              <Input
                type="email"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl h-11 border-border bg-background focus-visible:ring-purple-500/20 focus-visible:border-purple-500"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Senha</label>
              <Input
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl h-11 border-border bg-background focus-visible:ring-purple-500/20 focus-visible:border-purple-500"
                required
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={authSubmitting}
              className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all font-semibold mt-2 shadow-lg shadow-purple-600/20"
            >
              {authSubmitting 
                ? "Processando..." 
                : authMode === 'login' ? "Entrar" : "Criar Conta"
              }
            </Button>

            <div className="flex flex-col gap-2 pt-2 text-center text-xs text-muted-foreground">
              {authMode === 'login' ? (
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className="text-purple-500 hover:text-purple-600 hover:underline transition-colors font-medium"
                >
                  Não tem uma conta? Cadastre-se
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-purple-500 hover:text-purple-600 hover:underline transition-colors font-medium"
                >
                  Já possui conta? Faça o login
                </button>
              )}
              
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Ou experimente</span>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={handleDemoLogin}
                className="h-10 rounded-xl border border-dashed border-border hover:bg-accent text-foreground transition-all"
              >
                Simular com Conta Demo
              </Button>
            </div>
          </form>

          <div className="flex justify-center gap-4 text-[10px] text-muted-foreground pt-2">
             <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Seguro</span>
             <span className="flex items-center gap-1"><Smartphone className="h-3 w-3" /> Mobile-First</span>
             <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Real-time</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Filtrar arquivos exibidos de acordo com a pesquisa semântica por IA
  const displayFiles = aiFilterActive 
    ? files.filter(f => filteredFileIds.includes(f.id)) 
    : files;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-blue-500/30">
      <Toaster position="top-center" expand />
      
      {/* Input oculto para carregar arquivos */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange} 
      />

      {/* Sidebar para Desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-20 md:w-64 bg-background/50 backdrop-blur-xl border-r border-border z-50 hidden md:flex flex-col p-4">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Cloud className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-xl hidden md:block">NuveeMob</span>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem active={activeTab === 'files'} icon={<LayoutDashboard />} label="Dashboard" onClick={() => setActiveTab('files')} />
          <NavItem active={activeTab === 'search'} icon={<SearchCode />} label="Busca IA" onClick={() => setActiveTab('search')} />
          <NavItem active={activeTab === 'devices'} icon={<Smartphone />} label="Dispositivos" onClick={() => setActiveTab('devices')} />
          <NavItem active={activeTab === 'history'} icon={<History />} label="Atividade" onClick={() => setActiveTab('history')} />
        </nav>

        <div className="mt-auto space-y-4">
          <div className="p-4 bg-accent rounded-2xl hidden md:block">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-muted-foreground">Uso</span>
              <span>1.2 GB / 5 GB</span>
            </div>
            <Progress value={24} className="h-1 bg-border" />
            <Button variant="link" className="p-0 h-auto text-[10px] text-blue-400 mt-2">Fazer upgrade</Button>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            <span className="hidden md:block">Sair</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:pl-64 min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 h-16 bg-background/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-40">
           <h2 className="font-semibold text-lg capitalize">{activeTab === 'files' ? 'Dashboard' : activeTab === 'search' ? 'Busca IA' : activeTab === 'devices' ? 'Dispositivos' : 'Atividade'}</h2>
           <div className="flex items-center gap-2">
             <ThemeToggle />
             <Button variant="ghost" size="icon" className="relative text-foreground">
               <Bell className="h-5 w-5" />
               <span className="absolute top-2 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-background" />
             </Button>
             <div className="h-10 w-10 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-500/20 text-white">
               {user.email?.[0].toUpperCase()}
             </div>
           </div>
        </header>

        {/* Content Area */}
        <div className="p-6 pb-24 md:pb-6">
          <AnimatePresence mode="wait">
            {activeTab === 'files' && (
              <motion.div 
                key="files"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <StatCard label="Arquivos Totais" value={files.length.toString()} icon={<Cloud className="text-blue-500" />} />
                  <StatCard label="Dispositivos" value={devices.length.toString()} icon={<Smartphone className="text-purple-500" />} />
                  <StatCard label="IA Insights" value="12" icon={<Cpu className="text-green-500" />} />
                </div>
                
                {isUploading && (
                  <div className="mb-4 p-4 bg-muted/50 rounded-xl flex items-center justify-between border border-border animate-pulse">
                    <span className="text-sm font-medium">Fazendo upload do arquivo...</span>
                    <Progress value={60} className="w-48 h-2 bg-accent" />
                  </div>
                )}

                {/* Badge Informativo de Filtro IA Ativo */}
                {aiFilterActive && (
                  <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-between backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Zap className="h-4 w-4 text-blue-400 animate-pulse" />
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Filtro de IA ativo para:</span>{' '}
                        <span className="font-semibold text-blue-400">"{aiSearchTerm}"</span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleClearAiFilter}
                      className="text-xs hover:bg-blue-500/20 rounded-full h-8 px-4 border border-blue-500/30 text-foreground"
                    >
                      Limpar Filtro
                    </Button>
                  </div>
                )}

                {/* Seção de Arquivos Sincronizados Recentemente (apenas na raiz e se não estiver filtrado por IA) */}
                {!currentFolderId && !aiFilterActive && (
                  <RecentSyncedFiles
                    userId={user?.id || ''}
                    isDemo={(user as any)?.isDemo}
                    onFileClick={handleFileClick}
                    onMoveClick={(file) => {
                      setSelectedFileForMove(file);
                      setIsMoveModalOpen(true);
                    }}
                  />
                )}

                <FileExplorer 
                  files={displayFiles} 
                  loading={filesLoading} 
                  onFileClick={handleFileClick}
                  onDelete={handleDeleteFile}
                  onUpload={handleUploadClick}
                  onCreateFolder={() => setIsNewFolderOpen(true)}
                  onSearch={handleAiSearch}
                  parentId={currentFolderId}
                  onBack={handleBack}
                  onMoveClick={(file) => {
                    setSelectedFileForMove(file);
                    setIsMoveModalOpen(true);
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'search' && (
              <motion.div 
                key="search"
                className="space-y-6 max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className="flex flex-col">
                  <h3 className="text-2xl font-bold">Assistente Inteligente</h3>
                  <p className="text-sm text-muted-foreground">Busque semanticamente e tire dúvidas sobre os seus arquivos em tempo real.</p>
                </div>

                {/* Área de Mensagens */}
                <div className="flex-1 bg-accent/20 border border-white/5 rounded-3xl p-6 overflow-y-auto space-y-4 backdrop-blur-xl relative">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
                    <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-blue-500/5 blur-[80px]" />
                    <div className="absolute bottom-[10%] right-[20%] w-[30%] h-[30%] bg-purple-500/5 blur-[80px]" />
                  </div>
                  
                  <div className="relative space-y-4">
                    {messages.map((msg) => (
                      <div 
                        key={msg.id}
                        className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div 
                          className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed border ${
                            msg.sender === 'user' 
                              ? 'bg-blue-600/90 border-blue-500/30 text-white rounded-br-none shadow-lg shadow-blue-500/10' 
                              : 'bg-accent/40 border-white/5 rounded-bl-none text-foreground backdrop-blur-md'
                          }`}
                        >
                          <p>{msg.text}</p>
                          
                          {/* Cards Clicáveis Integrados */}
                          {msg.relevantFiles && msg.relevantFiles.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-white/10 space-y-2 w-full min-w-[250px]">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">Arquivos relacionados encontrados:</p>
                              {msg.relevantFiles.map((file) => (
                                <div 
                                  key={file.id}
                                  onClick={() => handleFileClick(file)}
                                  className="flex items-center justify-between p-2.5 bg-background/50 border border-white/5 hover:border-blue-500/30 rounded-xl cursor-pointer hover:bg-background/80 transition-all group"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                      {file.type === 'folder' ? (
                                        <Folder className="h-4 w-4 text-blue-500" />
                                      ) : (
                                        <File className="h-4 w-4 text-primary animate-pulse" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-medium truncate text-foreground group-hover:text-blue-400 transition-colors">{file.name}</p>
                                      <p className="text-[9px] text-muted-foreground">{file.type === 'folder' ? 'Pasta' : (file.mimeType?.split('/')[1]?.toUpperCase() || 'Arquivo')} • {file.size ? (file.size / 1024 / 1024).toFixed(1) + ' MB' : ''}</p>
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground">
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] text-muted-foreground mt-1 px-1">{format(new Date(msg.timestamp), 'HH:mm')}</span>
                      </div>
                    ))}
                    
                    {isChatLoading && (
                      <div className="flex flex-col items-start">
                        <div className="bg-accent/40 border border-white/5 rounded-2xl rounded-bl-none p-4 text-sm text-muted-foreground backdrop-blur-md flex items-center gap-3">
                          <div className="flex space-x-1.5">
                            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span>Pensando...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form de Envio */}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem ou pergunta sobre os seus arquivos..."
                    className="flex-1 h-12 bg-accent/20 border-white/5 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/50 text-sm text-foreground"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isChatLoading}
                  />
                  <Button 
                    type="submit" 
                    disabled={isChatLoading || !chatInput.trim()}
                    className="h-12 w-12 rounded-2xl bg-blue-600 hover:opacity-90 flex items-center justify-center shadow-lg shadow-blue-500/10 shrink-0 text-white"
                  >
                    <Zap className="h-5 w-5" />
                  </Button>
                </form>
              </motion.div>
            )}

            {activeTab === 'devices' && (
              <motion.div 
                key="devices"
                className="space-y-6"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold">Meus Dispositivos</h3>
                    <p className="text-sm text-muted-foreground">Monitore e gerencie os aparelhos sincronizados com o NuveeMob.</p>
                  </div>
                  <Button 
                    onClick={() => setIsQrModalOpen(true)}
                    variant="outline" 
                    className="gap-2 rounded-full border-white/10 hover:bg-white/5 text-foreground"
                  >
                    <QrCode className="h-4 w-4" /> Conectar Novo
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {devices.map((device) => (
                    <DeviceCard 
                      key={device.id} 
                      name={device.name} 
                      type={device.type} 
                      status={device.status} 
                      lastSeen={device.lastSeen}
                      onDisconnect={() => handleDisconnectDevice(device.id, device.name)}
                    />
                  ))}
                </div>

                {/* Seção de Integrações de Nuvem (Google Drive, OneDrive, Dropbox) */}
                <div className="pt-6 border-t border-white/5">
                  <div className="mb-4">
                    <h4 className="text-lg font-bold text-foreground">Módulos de Sincronização em Nuvem</h4>
                    <p className="text-xs text-muted-foreground">Conecte seus provedores de armazenamento externos para importar e sincronizar arquivos automaticamente.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Google Drive Card */}
                    <Card className={`p-5 rounded-2xl relative overflow-hidden backdrop-blur-md transition-all border border-white/5 flex flex-col justify-between h-48 ${
                      cloudIntegrations.googleDrive.connected ? 'bg-blue-600/10' : 'bg-accent/40'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-yellow-500/10 rounded-xl">
                            <Cloud className="h-6 w-6 text-yellow-500" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-sm">Google Drive</h5>
                            {cloudIntegrations.googleDrive.connected ? (
                              <span className="text-[10px] text-green-400 font-medium">Sincronizado</span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">Desconectado</span>
                            )}
                          </div>
                        </div>
                        <Badge variant={cloudIntegrations.googleDrive.connected ? 'default' : 'secondary'} className={
                          cloudIntegrations.googleDrive.connected 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-white/5 text-muted-foreground'
                        }>
                          {cloudIntegrations.googleDrive.connected ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>

                      {cloudIntegrations.googleDrive.connected && (
                        <div className="my-2 space-y-1">
                          <p className="text-xs text-muted-foreground truncate">{cloudIntegrations.googleDrive.email}</p>
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Espaço utilizado</span>
                            <span>{cloudIntegrations.googleDrive.sizeUsed} de {cloudIntegrations.googleDrive.totalSize}</span>
                          </div>
                          <Progress value={28} className="h-1 bg-white/5" />
                        </div>
                      )}

                      <div className="flex gap-2 mt-4 pt-2 border-t border-white/5">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleConnectCloud('googleDrive')}
                          className="flex-1 text-xs rounded-xl h-8 border border-white/10 hover:bg-white/5 text-foreground"
                        >
                          {cloudIntegrations.googleDrive.connected ? 'Desconectar' : 'Conectar'}
                        </Button>
                        {cloudIntegrations.googleDrive.connected && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => handleSyncCloud('googleDrive')}
                            className="flex-1 text-xs rounded-xl h-8 bg-blue-600 hover:bg-blue-700 text-white gap-1"
                          >
                            Sincronizar
                          </Button>
                        )}
                      </div>
                    </Card>

                    {/* OneDrive Card */}
                    <Card className={`p-5 rounded-2xl relative overflow-hidden backdrop-blur-md transition-all border border-white/5 flex flex-col justify-between h-48 ${
                      cloudIntegrations.oneDrive.connected ? 'bg-blue-600/10' : 'bg-accent/40'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-blue-500/10 rounded-xl">
                            <Cloud className="h-6 w-6 text-blue-400" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-sm">OneDrive</h5>
                            {cloudIntegrations.oneDrive.connected ? (
                              <span className="text-[10px] text-green-400 font-medium">Sincronizado</span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">Desconectado</span>
                            )}
                          </div>
                        </div>
                        <Badge variant={cloudIntegrations.oneDrive.connected ? 'default' : 'secondary'} className={
                          cloudIntegrations.oneDrive.connected 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-white/5 text-muted-foreground'
                        }>
                          {cloudIntegrations.oneDrive.connected ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>

                      {cloudIntegrations.oneDrive.connected && (
                        <div className="my-2 space-y-1">
                          <p className="text-xs text-muted-foreground truncate">{cloudIntegrations.oneDrive.email}</p>
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Espaço utilizado</span>
                            <span>{cloudIntegrations.oneDrive.sizeUsed} de {cloudIntegrations.oneDrive.totalSize}</span>
                          </div>
                          <Progress value={36} className="h-1 bg-white/5" />
                        </div>
                      )}

                      <div className="flex gap-2 mt-4 pt-2 border-t border-white/5">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleConnectCloud('oneDrive')}
                          className="flex-1 text-xs rounded-xl h-8 border border-white/10 hover:bg-white/5 text-foreground"
                        >
                          {cloudIntegrations.oneDrive.connected ? 'Desconectar' : 'Conectar'}
                        </Button>
                        {cloudIntegrations.oneDrive.connected && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => handleSyncCloud('oneDrive')}
                            className="flex-1 text-xs rounded-xl h-8 bg-blue-600 hover:bg-blue-700 text-white gap-1"
                          >
                            Sincronizar
                          </Button>
                        )}
                      </div>
                    </Card>

                    {/* Dropbox Card */}
                    <Card className={`p-5 rounded-2xl relative overflow-hidden backdrop-blur-md transition-all border border-white/5 flex flex-col justify-between h-48 ${
                      cloudIntegrations.dropbox.connected ? 'bg-blue-600/10' : 'bg-accent/40'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-indigo-500/10 rounded-xl">
                            <Cloud className="h-6 w-6 text-indigo-400" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-sm">Dropbox</h5>
                            {cloudIntegrations.dropbox.connected ? (
                              <span className="text-[10px] text-green-400 font-medium">Sincronizado</span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">Desconectado</span>
                            )}
                          </div>
                        </div>
                        <Badge variant={cloudIntegrations.dropbox.connected ? 'default' : 'secondary'} className={
                          cloudIntegrations.dropbox.connected 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-white/5 text-muted-foreground'
                        }>
                          {cloudIntegrations.dropbox.connected ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>

                      {cloudIntegrations.dropbox.connected && (
                        <div className="my-2 space-y-1">
                          <p className="text-xs text-muted-foreground truncate">{cloudIntegrations.dropbox.email}</p>
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Espaço utilizado</span>
                            <span>{cloudIntegrations.dropbox.sizeUsed} de {cloudIntegrations.dropbox.totalSize}</span>
                          </div>
                          <Progress value={22} className="h-1 bg-white/5" />
                        </div>
                      )}

                      <div className="flex gap-2 mt-4 pt-2 border-t border-white/5">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleConnectCloud('dropbox')}
                          className="flex-1 text-xs rounded-xl h-8 border border-white/10 hover:bg-white/5 text-foreground"
                        >
                          {cloudIntegrations.dropbox.connected ? 'Desconectar' : 'Conectar'}
                        </Button>
                        {cloudIntegrations.dropbox.connected && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => handleSyncCloud('dropbox')}
                            className="flex-1 text-xs rounded-xl h-8 bg-blue-600 hover:bg-blue-700 text-white gap-1"
                          >
                            Sincronizar
                          </Button>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div 
                key="history"
                className="space-y-6 max-w-2xl mx-auto"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-bold">Histórico de Atividades</h3>
                    <p className="text-sm text-muted-foreground">Linha do tempo das suas operações de upload, exclusão e busca inteligente.</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-xs hover:bg-accent rounded-full border border-white/5 text-foreground"
                    onClick={() => {
                      localStorage.setItem('nuveemob_activities', JSON.stringify(INITIAL_ACTIVITIES));
                      setActivities(INITIAL_ACTIVITIES);
                      toast.success('Histórico restaurado para os dados iniciais.');
                    }}
                  >
                    Limpar Logs
                  </Button>
                </div>

                <div className="relative border-l border-white/10 pl-6 ml-4 space-y-8 py-4">
                  {activities.map((act, index) => {
                    const dateFormatted = format(new Date(act.timestamp), 'dd/MM/yyyy HH:mm');
                    
                    return (
                      <motion.div 
                        key={act.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative group"
                      >
                        {/* Indicador Luminoso na Linha do Tempo */}
                        <div className="absolute -left-[35px] top-1.5 w-6 h-6 rounded-full bg-background border border-white/10 flex items-center justify-center group-hover:border-blue-500/50 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.3)] transition-all">
                          {act.type === 'upload' && <Cloud className="h-3 w-3 text-blue-400" />}
                          {act.type === 'delete' && <Trash2 className="h-3 w-3 text-red-400" />}
                          {act.type === 'create_folder' && <Folder className="h-3 w-3 text-yellow-400" />}
                          {act.type === 'ai_search' && <Zap className="h-3 w-3 text-purple-400" />}
                          {act.type === 'device_connect' && <Smartphone className="h-3 w-3 text-green-400 animate-pulse" />}
                          {act.type === 'device_disconnect' && <Smartphone className="h-3 w-3 text-gray-400" />}
                        </div>
                        
                        <Card className="p-4 bg-accent/20 hover:bg-accent/30 border-none rounded-2xl transition-all relative overflow-hidden backdrop-blur-md">
                          <p className="text-sm leading-relaxed text-foreground">{act.description}</p>
                          <span className="text-[10px] text-muted-foreground mt-2 block">{dateFormatted}</span>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-t border-white/5 flex md:hidden items-center justify-around z-50">
        <MobileNavItem active={activeTab === 'files'} icon={<LayoutDashboard />} onClick={() => setActiveTab('files')} />
        <MobileNavItem active={activeTab === 'search'} icon={<SearchCode />} onClick={() => setActiveTab('search')} />
        <Button className="h-12 w-12 rounded-full -mt-8 bg-blue-600 shadow-xl shadow-blue-500/40 text-white" onClick={handleUploadClick}>
           <Plus className="h-6 w-6" />
        </Button>
        <MobileNavItem active={activeTab === 'devices'} icon={<Smartphone />} onClick={() => setActiveTab('devices')} />
        <MobileNavItem active={activeTab === 'history'} icon={<History />} onClick={() => setActiveTab('history')} />
      </nav>

      {/* Dialog para Criar Nova Pasta */}
      <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
        <DialogContent className="sm:max-w-md bg-background border border-border">
          <DialogHeader>
            <DialogTitle>Criar Nova Pasta</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateFolderSubmit} className="space-y-4 pt-2">
            <input
              type="text"
              placeholder="Nome da pasta"
              className="w-full px-4 py-2.5 bg-muted/60 rounded-xl border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground text-sm"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsNewFolderOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Criar Pasta
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Pareamento QR Code */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="sm:max-w-md bg-background/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
          <DialogHeader className="items-center text-center">
            <DialogTitle className="text-xl font-bold flex flex-col items-center gap-2">
              <QrCode className="h-8 w-8 text-blue-500 animate-pulse" />
              <span>Conectar Novo Dispositivo</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Abra a câmera do seu smartphone ou o aplicativo NuveeMob para ler o QR Code abaixo e sincronizar instantaneamente.
            </p>
            
            {/* QR Code animado em Glassmorphism */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl relative group overflow-hidden shadow-2xl shadow-blue-500/10 flex items-center justify-center w-48 h-48">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 opacity-50" />
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500 rounded-tl" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500 rounded-br" />
              
              {/* QR Code Real com linhas animadas */}
              <div className="relative w-36 h-36 bg-white rounded-lg border border-border flex items-center justify-center overflow-hidden p-2">
                <QRCodeSVG value={`${window.location.origin}/?action=connect`} size={128} />
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                />
              </div>
            </div>
            
            <div className="w-full pt-4">
              <Button 
                disabled={isConnecting}
                onClick={handleSimulateConnection}
                className="w-full h-12 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-all font-semibold gap-2 text-white"
              >
                {isConnecting ? (
                  <>
                    <Cpu className="h-4 w-4 animate-spin" />
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="h-4 w-4" />
                    <span>Simular Conexão</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Visualizador de Arquivos */}
      <FileViewerModal 
        file={selectedFileForView} 
        isOpen={isFileViewerOpen} 
        onClose={() => {
          setIsFileViewerOpen(false);
          setTimeout(() => setSelectedFileForView(null), 300); // Limpa após animação
        }} 
      />

      {/* Modal para Mover Arquivos */}
      <MoveFileModal
        isOpen={isMoveModalOpen}
        onClose={() => {
          setIsMoveModalOpen(false);
          setSelectedFileForMove(null);
        }}
        fileToMove={selectedFileForMove}
        onMove={moveFile}
        userId={user?.id || ''}
      />
    </div>
  );
}

function NavItem({ active, icon, label, onClick }: any) {
  return (
    <Button 
      variant={active ? 'secondary' : 'ghost'} 
      className={`w-full justify-start gap-3 rounded-xl h-11 transition-all ${
        active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
      onClick={onClick}
    >
      <span className={active ? 'text-blue-500' : ''}>{React.cloneElement(icon as React.ReactElement, { className: 'h-5 w-5' })}</span>
      <span className="hidden md:block font-medium">{label}</span>
    </Button>
  );
}

function MobileNavItem({ active, icon, onClick }: any) {
  return (
    <button onClick={onClick} className={`p-3 transition-all ${active ? 'text-blue-500' : 'text-muted-foreground'}`}>
      {React.cloneElement(icon as React.ReactElement, { className: 'h-6 w-6' })}
    </button>
  );
}

function StatCard({ label, value, icon }: any) {
  return (
    <Card className="bg-accent/40 border-none p-6 rounded-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
        {React.cloneElement(icon, { size: 64 })}
      </div>
      <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </Card>
  );
}

function DeviceCard({ name, type, status, lastSeen, onDisconnect }: any) {
  return (
    <Card className="bg-accent/40 border-none p-4 rounded-2xl flex items-center gap-4 backdrop-blur-md hover:bg-accent/50 transition-all group">
      <div className={`p-3 rounded-xl ${status === 'online' ? 'bg-green-500/10 animate-pulse' : 'bg-gray-500/10'}`}>
        <Smartphone className={`h-6 w-6 ${status === 'online' ? 'text-green-500' : 'text-gray-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground truncate">{name}</h4>
        <p className="text-xs text-muted-foreground capitalize">{type} • {lastSeen}</p>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={status === 'online' ? 'default' : 'secondary'} className={status === 'online' ? 'bg-green-600/20 text-green-400 border border-green-500/30 text-white' : 'bg-gray-600/20 text-gray-400 border border-gray-500/30 text-white'}>
          {status}
        </Badge>
        {onDisconnect && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onDisconnect}
            className="h-8 w-8 text-muted-foreground hover:text-red-400 rounded-full hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
