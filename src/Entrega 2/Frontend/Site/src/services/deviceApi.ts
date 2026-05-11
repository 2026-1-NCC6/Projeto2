import { dispositivos as mockDispositivos, type Dispositivo } from '@/data/mockData';

export const USE_MOCK = false;

// SEGURANÇA: Buscando o endpoint das variáveis de ambiente (.env)
// Isso evita expor URLs de produção no código-fonte compilado.
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
      nome: "Geladeira Principal",
      localizacao: "Laboratório A1", 
      temperaturaAtual: ultimaLeitura.temperatura,
      umidadeAtual: ultimaLeitura.umidade,
      status: ultimaLeitura.status === 'ALERTA' ? 'error' : 'normal',
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