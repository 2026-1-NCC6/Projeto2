import { dispositivos as mockDispositivos } from '@/data/mockData';
import type { Dispositivo } from '@/data/mockData'; // Importação direta do tipo

export type { Dispositivo }; // Exportação segura do tipo

export const USE_MOCK = false;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

let dispositivosLocais: Dispositivo[] = [...mockDispositivos];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(l => l());
}

export function subscribeDispositivos(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export async function listarDispositivos(): Promise<Dispositivo[]> {
  if (USE_MOCK) return dispositivosLocais;

  try {
    const res = await fetch(`${API_BASE_URL}/temperaturas`);
    if (!res.ok) throw new Error('Falha ao conectar na API Python');
    
    const dadosBrutos = await res.json();

    if (dadosBrutos.length === 0) return [];

    const ultimaLeitura = dadosBrutos[0]; 

    const dispositivoReal: Dispositivo = {
      id: ultimaLeitura.dispositivo,
      nome: "Caixa Térmica Alpha",
      localizacao: "Empresa A | Téc: Carlos", 
      temperaturaAtual: ultimaLeitura.temperatura,
      umidadeAtual: ultimaLeitura.umidade,
      // CORREÇÃO APLICADA: Substituído 'error' por 'alerta'
      status: ultimaLeitura.status === 'ALERTA' ? 'alerta' : 'normal',
      conexao: 'online',
      ultimaAtualizacao: ultimaLeitura.horario
    };

    return [dispositivoReal];

  } catch (error) {
    console.error("Erro ao buscar dados reais:", error);
    return dispositivosLocais;
  }
}

export async function cadastrarDispositivo(input: any): Promise<Dispositivo> {
  const novo: Dispositivo = {
    id: input.id,
    nome: input.nome,
    localizacao: input.localizacao,
    temperaturaAtual: 0,
    umidadeAtual: 0,
    status: 'normal',
    conexao: 'online',
    ultimaAtualizacao: new Date().toISOString(),
  };
  dispositivosLocais = [...dispositivosLocais, novo];
  notify();
  return novo;
}

export function getDispositivosSnapshot(): Dispositivo[] {
  return dispositivosLocais;
}