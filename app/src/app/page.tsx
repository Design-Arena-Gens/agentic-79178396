import { LeadsTable } from "@/components/LeadTable";
import { generateLeads } from "@/lib/data";

export default function Home() {
  const leads = generateLeads(1000);

  return (
    <main>
      <LeadsTable leads={leads} />
    </main>
  );
}
