import { useProjectStore } from '../store/projectStore'
import { getDMCHex, getDMCName } from '../utils/dmcColors'
import { Trash2, Plus, Minus, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

export function InventoryPanel() {
  const {
    inventory,
    addToInventory,
    removeFromInventory,
    updateInventoryQuantity,
    updateStitchUsage,
    dmcPalette,
    dmcUsage,
  } = useProjectStore()

  const [newDmc, setNewDmc] = useState('')
  const [newQty, setNewQty] = useState(1)

  const handleAdd = () => {
    const num = parseInt(newDmc)
    if (!num || !newQty) return
    addToInventory(num, newQty)
    setNewDmc('')
    setNewQty(1)
  }

  const getUsage = (dmcNum: number) => {
    return dmcUsage.get(dmcNum) || 0
  }

  const getSkeinCapacity = (dmcNum: number) => {
    const skein = inventory.find((s) => s.dmcNumber === dmcNum)
    return skein ? skein.quantity * 800 : 0 // ~800 stitches per skein estimate
  }

  const alerts = inventory
    .filter((skein) => {
      const used = getUsage(skein.dmcNumber)
      const capacity = getSkeinCapacity(skein.dmcNumber)
      return used > capacity * 0.8
    })
    .map((skein) => ({
      dmcNumber: skein.dmcNumber,
      used: getUsage(skein.dmcNumber),
      available: getSkeinCapacity(skein.dmcNumber),
      name: getDMCName(skein.dmcNumber),
    }))

  return (
    <div className="p-4 space-y-4">
      {/* Add skein */}
      <div className="p-3 bg-gray-50 rounded-lg border">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Add Skeins</h3>
        <div className="flex gap-2">
          <input
            type="number"
            value={newDmc}
            onChange={(e) => setNewDmc(e.target.value)}
            placeholder="DMC #"
            className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm"
          />
          <input
            type="number"
            value={newQty}
            onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
            min="1"
            className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm"
            placeholder="Qty"
          />
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
          >
            Add
          </button>
        </div>
        {/* Quick add for palette colors */}
        {dmcPalette.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">Quick add from palette:</p>
            <div className="flex flex-wrap gap-1">
              {dmcPalette.slice(0, 20).map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    addToInventory(num, 1)
                  }}
                  className="w-6 h-6 rounded border border-gray-300 hover:ring-2 hover:ring-indigo-300 transition-all"
                  style={{ backgroundColor: getDMCHex(num) }}
                  title={`DMC ${num}: ${getDMCName(num)}`}
                />
              ))}
              {dmcPalette.length > 20 && (
                <span className="text-xs text-gray-400 self-center">+{dmcPalette.length - 20}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">Low Stock Alerts</span>
          </div>
          {alerts.map((alert) => (
            <div key={alert.dmcNumber} className="text-xs text-amber-600">
              {alert.name} (DMC {alert.dmcNumber}): using {alert.used} stitches, capacity {alert.available}
            </div>
          ))}
        </div>
      )}

      {/* Inventory list */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Your Skeins ({inventory.length})
        </h3>
        {inventory.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-8">
            No skeins added yet.
          </div>
        ) : (
          <div className="space-y-2">
            {inventory.map((skein) => (
              <div
                key={skein.id}
                className="p-2 bg-white border border-gray-200 rounded-lg flex items-center gap-2"
              >
                <div
                  className="w-8 h-8 rounded border border-gray-300 shrink-0"
                  style={{ backgroundColor: getDMCHex(skein.dmcNumber) }}
                  title={`DMC ${skein.dmcNumber}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">DMC {skein.dmcNumber}</div>
                  <div className="text-xs text-gray-500">{getDMCName(skein.dmcNumber)}</div>
                  <div className="text-xs text-gray-400">
                    Used: {getUsage(skein.dmcNumber)} stitches
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateInventoryQuantity(skein.id, Math.max(0, skein.quantity - 1))}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Minus size={14} className="text-gray-400" />
                  </button>
                  <span className="w-8 text-center text-sm font-mono">{skein.quantity}</span>
                  <button
                    onClick={() => updateInventoryQuantity(skein.id, skein.quantity + 1)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Plus size={14} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => removeFromInventory(skein.id)}
                    className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

