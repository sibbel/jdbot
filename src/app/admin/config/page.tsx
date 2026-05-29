import { getSlotConfigData } from '@/lib/conflict'
import { SlotConfigForm } from '@/components/admin/SlotConfigForm'

export default async function ConfigPage() {
  const config = await getSlotConfigData()
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Slot-Konfiguration</h1>
      <SlotConfigForm initialConfig={config} />
    </div>
  )
}
