import { Card } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { EnergyData } from '@/types'

interface EnergyChartProps {
  data: EnergyData[]
}

export function EnergyChart({ data }: EnergyChartProps) {
  return (
    <Card className="glass-card p-6 border-border/50">
      <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Energy Generation (Last 30 Days)</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.65 0.25 265)" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="oklch(0.65 0.25 265)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.03 265)" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="oklch(0.65 0.02 265)"
              tick={{ fontSize: 12, fill: 'oklch(0.65 0.02 265)' }}
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getMonth() + 1}/${date.getDate()}`
              }}
            />
            <YAxis 
              stroke="oklch(0.65 0.02 265)"
              tick={{ fontSize: 12, fill: 'oklch(0.65 0.02 265)' }}
              label={{ value: 'kWh', angle: -90, position: 'insideLeft', fill: 'oklch(0.65 0.02 265)' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'oklch(0.12 0.03 265)',
                border: '1px solid oklch(0.20 0.03 265)',
                borderRadius: '12px',
                color: 'oklch(0.98 0 0)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 0 20px oklch(0.65 0.25 265 / 0.2)'
              }}
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
              formatter={(value: number) => [`${value} kWh`, 'Generated']}
            />
            <Area 
              type="monotone" 
              dataKey="kwh" 
              stroke="oklch(0.65 0.25 265)" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorKwh)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
