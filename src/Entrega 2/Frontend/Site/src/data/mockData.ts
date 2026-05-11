// Dados mockados simulando a API REST do backend Python/SQL

export interface Dispositivo {
  id: string;
  nome: string;
  localizacao: string;
  temperaturaAtual: number;
  umidadeAtual: number;
  status: 'normal' | 'alerta' | 'offline';
  conexao: 'online' | 'offline';
  ultimaAtualizacao: string;
}

export interface RegistroTemperatura {
  id: string;
  dispositivoId: string;
  dispositivoNome: string;
  temperatura: number;
  umidade: number;
  status: 'normal' | 'alerta';
  dataHora: string;
}

// Faixa segura: 2°C a 8°C
export const TEMP_MIN = 2;
export const TEMP_MAX = 8;

// Faixa segura de umidade: 35% a 45%
export const UMID_MIN = 35;
export const UMID_MAX = 45;

export const dispositivos: Dispositivo[] = [
  {
    id: 'esp32-001',
    nome: 'Geladeira 01',
    localizacao: 'Estoque Principal',
    temperaturaAtual: 5.2,
    umidadeAtual: 40.3,
    status: 'normal',
    conexao: 'online',
    ultimaAtualizacao: '2026-04-01T14:32:00',
  },
  {
    id: 'esp32-002',
    nome: 'Geladeira 02',
    localizacao: 'Sala de Vacinação',
    temperaturaAtual: 3.8,
    umidadeAtual: 38.7,
    status: 'normal',
    conexao: 'online',
    ultimaAtualizacao: '2026-04-01T14:31:45',
  },
  {
    id: 'esp32-003',
    nome: 'Geladeira 03',
    localizacao: 'Anexo B',
    temperaturaAtual: 9.4,
    umidadeAtual: 52.1,
    status: 'alerta',
    conexao: 'online',
    ultimaAtualizacao: '2026-04-01T14:32:10',
  },
  {
    id: 'esp32-004',
    nome: 'Caixa Térmica 01',
    localizacao: 'Transporte',
    temperaturaAtual: 6.1,
    umidadeAtual: 42.5,
    status: 'normal',
    conexao: 'online',
    ultimaAtualizacao: '2026-04-01T14:30:00',
  },
  {
    id: 'esp32-005',
    nome: 'Geladeira 04',
    localizacao: 'Recepção',
    temperaturaAtual: 0,
    umidadeAtual: 0,
    status: 'offline',
    conexao: 'offline',
    ultimaAtualizacao: '2026-04-01T12:15:00',
  },
];

export type PeriodoFiltro = '6h' | '12h' | '24h' | '3d' | '7d' | '30d';

// Gerar histórico com base no período selecionado
export function gerarHistoricoPorPeriodo(
  dispositivoId: string,
  periodo: PeriodoFiltro
): { hora: string; temperatura: number; umidade: number; min: number; max: number; umidMin: number; umidMax: number }[] {
  const dados: { hora: string; temperatura: number; umidade: number; min: number; max: number; umidMin: number; umidMax: number }[] = [];
  const agora = new Date();

  const config: Record<PeriodoFiltro, { pontos: number; intervaloMs: number; formato: Intl.DateTimeFormatOptions }> = {
    '6h':  { pontos: 24, intervaloMs: 15 * 60 * 1000, formato: { hour: '2-digit', minute: '2-digit' } },
    '12h': { pontos: 24, intervaloMs: 30 * 60 * 1000, formato: { hour: '2-digit', minute: '2-digit' } },
    '24h': { pontos: 25, intervaloMs: 60 * 60 * 1000, formato: { hour: '2-digit', minute: '2-digit' } },
    '3d':  { pontos: 36, intervaloMs: 2 * 60 * 60 * 1000, formato: { day: '2-digit', hour: '2-digit' } },
    '7d':  { pontos: 28, intervaloMs: 6 * 60 * 60 * 1000, formato: { day: '2-digit', month: '2-digit' } },
    '30d': { pontos: 30, intervaloMs: 24 * 60 * 60 * 1000, formato: { day: '2-digit', month: '2-digit' } },
  };

  const { pontos, intervaloMs, formato } = config[periodo];

  for (let i = pontos; i >= 0; i--) {
    const hora = new Date(agora.getTime() - i * intervaloMs);
    let temp: number;
    let umid: number;

    if (dispositivoId === 'esp32-003') {
      const progresso = 1 - i / pontos;
      temp = progresso > 0.6 ? 8.5 + Math.random() * 2 : 4 + Math.random() * 3;
      umid = progresso > 0.6 ? 48 + Math.random() * 8 : 36 + Math.random() * 8;
    } else {
      temp = 3 + Math.random() * 4;
      umid = 35 + Math.random() * 10;
    }

    dados.push({
      hora: hora.toLocaleDateString('pt-BR', formato),
      temperatura: parseFloat(temp.toFixed(1)),
      umidade: parseFloat(umid.toFixed(1)),
      min: TEMP_MIN,
      max: TEMP_MAX,
      umidMin: UMID_MIN,
      umidMax: UMID_MAX,
    });
  }

  return dados;
}

// Manter compatibilidade
export function gerarHistorico24h(dispositivoId: string) {
  return gerarHistoricoPorPeriodo(dispositivoId, '24h');
}

// Estatísticas do dispositivo
export function calcularEstatisticas(dados: { temperatura: number; umidade: number }[]) {
  const temps = dados.map(d => d.temperatura);
  const umids = dados.map(d => d.umidade);
  const media = temps.reduce((a, b) => a + b, 0) / temps.length;
  const minima = Math.min(...temps);
  const maxima = Math.max(...temps);
  const excursoes = temps.filter(t => t < TEMP_MIN || t > TEMP_MAX).length;
  const conformidade = ((temps.length - excursoes) / temps.length) * 100;

  const mediaUmid = umids.reduce((a, b) => a + b, 0) / umids.length;
  const minimaUmid = Math.min(...umids);
  const maximaUmid = Math.max(...umids);

  return {
    media: parseFloat(media.toFixed(1)),
    minima: parseFloat(minima.toFixed(1)),
    maxima: parseFloat(maxima.toFixed(1)),
    excursoes,
    conformidade: parseFloat(conformidade.toFixed(1)),
    totalLeituras: temps.length,
    mediaUmid: parseFloat(mediaUmid.toFixed(1)),
    minimaUmid: parseFloat(minimaUmid.toFixed(1)),
    maximaUmid: parseFloat(maximaUmid.toFixed(1)),
  };
}

// Logs para a tabela de auditoria
export const logsAuditoria: RegistroTemperatura[] = [
  { id: '1', dispositivoId: 'esp32-003', dispositivoNome: 'Geladeira 03', temperatura: 9.4, umidade: 52.1, status: 'alerta', dataHora: '2026-04-01 14:32:10' },
  { id: '2', dispositivoId: 'esp32-001', dispositivoNome: 'Geladeira 01', temperatura: 5.2, umidade: 40.3, status: 'normal', dataHora: '2026-04-01 14:32:00' },
  { id: '3', dispositivoId: 'esp32-002', dispositivoNome: 'Geladeira 02', temperatura: 3.8, umidade: 38.7, status: 'normal', dataHora: '2026-04-01 14:31:45' },
  { id: '4', dispositivoId: 'esp32-004', dispositivoNome: 'Caixa Térmica 01', temperatura: 6.1, umidade: 42.5, status: 'normal', dataHora: '2026-04-01 14:30:00' },
  { id: '5', dispositivoId: 'esp32-003', dispositivoNome: 'Geladeira 03', temperatura: 8.9, umidade: 49.8, status: 'alerta', dataHora: '2026-04-01 14:15:00' },
  { id: '6', dispositivoId: 'esp32-001', dispositivoNome: 'Geladeira 01', temperatura: 5.0, umidade: 41.0, status: 'normal', dataHora: '2026-04-01 14:00:00' },
  { id: '7', dispositivoId: 'esp32-003', dispositivoNome: 'Geladeira 03', temperatura: 9.1, umidade: 51.3, status: 'alerta', dataHora: '2026-04-01 13:45:00' },
  { id: '8', dispositivoId: 'esp32-002', dispositivoNome: 'Geladeira 02', temperatura: 4.2, umidade: 39.5, status: 'normal', dataHora: '2026-04-01 13:30:00' },
  { id: '9', dispositivoId: 'esp32-001', dispositivoNome: 'Geladeira 01', temperatura: 4.8, umidade: 40.8, status: 'normal', dataHora: '2026-04-01 13:15:00' },
  { id: '10', dispositivoId: 'esp32-004', dispositivoNome: 'Caixa Térmica 01', temperatura: 5.9, umidade: 43.2, status: 'normal', dataHora: '2026-04-01 13:00:00' },
];
