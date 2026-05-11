import TemperatureChart from '@/components/TemperatureChart';
import AuditTable from '@/components/AuditTable';

const Relatorios = () => {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <h2 className="text-lg font-semibold text-foreground">Relatórios e Auditoria</h2>
      <TemperatureChart />
      <AuditTable />
    </div>
  );
};

export default Relatorios;
