import { Card } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { EnergyData } from '@/types'

interface EnergyChartProps {
  data: EnergyData[]
}

export function EnergyChart({ data }: EnergyChartProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Energy Generation (Last 30 Days)</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.55 0.15 160)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="oklch(0.55 0.15 160)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.35 0.02 240)" />
            <XAxis 
              dataKey="date" 
              stroke="oklch(0.70 0.02 240)"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getMonth() + 1}/${date.getDate()}`
              }}
            />
            <YAxis 
              stroke="oklch(0.70 0.02 240)"
              tick={{ fontSize: 12 }}
              label={{ value: 'kWh', angle: -90, position: 'insideLeft', fill: 'oklch(0.70 0.02 240)' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'oklch(0.22 0.02 240)',
                border: '1px solid oklch(0.35 0.02 240)',
                borderRadius: '8px',
                color: 'oklch(0.95 0 0)'
              }}
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
              formatter={(value: number) => [`${value} kWh`, 'Generated']}
            />
            <Area 
              type="monotone" 
              dataKey="kwh" 
              stroke="oklch(0.55 0.15 160)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorKwh)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
