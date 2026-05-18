import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Device } from '@/src/types';
import { toast } from 'sonner';

const MOCK_DEVICES_KEY = 'nuveemob_mock_devices';

const INITIAL_MOCK_DEVICES: Device[] = [
  {
    id: 'dev-1',
    name: 'iPhone 15 Pro',
    type: 'mobile',
    status: 'online',
    lastSeen: new Date().toISOString()
  },
  {
    id: 'dev-2',
    name: 'MacBook Air M3',
    type: 'desktop',
    status: 'offline',
    lastSeen: new Date(Date.now() - 86400000).toISOString()
  }
];

export function useDevices(isDemo: boolean = false) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const getMockDevices = useCallback((): Device[] => {
    const saved = localStorage.getItem(MOCK_DEVICES_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_MOCK_DEVICES;
      }
    }
    localStorage.setItem(MOCK_DEVICES_KEY, JSON.stringify(INITIAL_MOCK_DEVICES));
    return INITIAL_MOCK_DEVICES;
  }, []);

  const saveMockDevices = useCallback((updatedDevices: Device[]) => {
    localStorage.setItem(MOCK_DEVICES_KEY, JSON.stringify(updatedDevices));
  }, []);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    if (isDemo) {
      setTimeout(() => {
        setDevices(getMockDevices());
        setLoading(false);
      }, 300);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setDevices([]);
        return;
      }

      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .order('last_seen', { ascending: false });

      if (error) throw error;

      // Adapt snake_case to camelCase
      const formattedDevices = (data || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        status: d.status,
        lastSeen: d.last_seen || d.lastSeen,
      })) as Device[];

      setDevices(formattedDevices);
    } catch (error: any) {
      console.error('Error fetching devices:', error);
      toast.error('Erro ao buscar dispositivos.');
    } finally {
      setLoading(false);
    }
  }, [isDemo, getMockDevices]);

  const connectDevice = useCallback(async (name: string, type: 'mobile' | 'tablet' | 'desktop'): Promise<boolean> => {
    if (isDemo) {
      const allMocks = getMockDevices();
      const newDevice: Device = {
        id: 'dev-' + Math.random().toString(36).substring(2, 9),
        name,
        type,
        status: 'online',
        lastSeen: new Date().toISOString()
      };
      
      const updated = [...allMocks, newDevice];
      saveMockDevices(updated);
      fetchDevices();
      toast.success('Dispositivo conectado com sucesso no modo Demo!');
      return true;
    }

    const connectToast = toast.loading('Conectando dispositivo...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const { error } = await supabase
        .from('devices')
        .insert({
          user_id: user.id,
          name,
          type,
          status: 'online',
          last_seen: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Dispositivo conectado e sincronizado com sucesso!', { id: connectToast });
      fetchDevices();
      return true;
    } catch (error: any) {
      console.error('Error connecting device:', error);
      toast.error(`Falha na conexão: ${error.message || 'Erro desconhecido'}`, { id: connectToast });
      return false;
    }
  }, [isDemo, getMockDevices, saveMockDevices, fetchDevices]);

  const disconnectDevice = useCallback(async (id: string): Promise<boolean> => {
    if (isDemo) {
      const allMocks = getMockDevices();
      const updated = allMocks.filter(d => d.id !== id);
      saveMockDevices(updated);
      fetchDevices();
      toast.success('Dispositivo desconectado (Demo).');
      return true;
    }

    const disconnectToast = toast.loading('Desconectando dispositivo...');
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Dispositivo removido da sua conta.', { id: disconnectToast });
      fetchDevices();
      return true;
    } catch (error: any) {
      console.error('Error disconnecting device:', error);
      toast.error(`Erro ao desconectar: ${error.message}`, { id: disconnectToast });
      return false;
    }
  }, [isDemo, getMockDevices, saveMockDevices, fetchDevices]);

  useEffect(() => {
    fetchDevices();

    if (!isDemo) {
      const channel = supabase
        .channel('devices-realtime-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'devices' },
          () => {
            fetchDevices();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchDevices, isDemo]);

  return {
    devices,
    loading,
    refresh: fetchDevices,
    connectDevice,
    disconnectDevice
  };
}
