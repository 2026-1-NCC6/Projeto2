import { dispositivos as mockDispositivos, type Dispositivo } from '@/data/mockData';

// 1. DESATIVAMOS O MOCK:
export const USE_MOCK = false;

// 2. ENDEREÇO DO SEU GARÇOM (PYTHON):
const API_BASE_URL = 'http://localhost:5000/api';

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
    // Busca os dados da sua API Flask
    const res = await fetch(`${API_BASE_URL}/temperaturas`);
    if (!res.ok) throw new Error('Falha ao conectar na API Python');
    
    const dadosBrutos = await res.json();

    if (dadosBrutos.length === 0) return [];

    // Pegamos o registro mais recente (o primeiro da lista)
    const ultimaLeitura = dadosBrutos[0]; 

    // MAPEAMENTO: Transformando os dados do Python para o Site
    const dispositivoReal: Dispositivo = {
      id: ultimaLeitura.dispositivo, // "geladeira_01"
      nome: "Geladeira Principal",   // Nome que aparecerá no Card
      localizacao: "Laboratório A1", 
      temperaturaAtual: ultimaLeitura.temperatura,
      umidadeAtual: ultimaLeitura.umidade,
      // Se o status for ALERTA no banco, o card fica vermelho (error)
      status: ultimaLeitura.status === 'ALERTA' ? 'error' : 'normal',
      conexao: 'online',
      ultimaAtualizacao: ultimaLeitura.horario
    };

    return [dispositivoReal];

  } catch (error) {
    console.error("Erro ao buscar dados reais:", error);
    return dispositivosLocais; // Volta pro mock se o Python estiver desligado
  }
}

// Mantemos as outras funções como estão para evitar erros de compilação
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