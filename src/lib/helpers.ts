export function shortenAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function generateTxHash(): string {
  return '0x' + Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

export function generateIpfsHash(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return 'Qm' + Array.from({ length: 44 }, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp)
}

export function generateEnergyData(days: number = 30): Array<{ date: string; kwh: number }> {
  const data: Array<{ date: string; kwh: number }> = []
  const today = new Date()
  
  // California 10kW system production profile
  // Based on NREL data for Southern California (San Diego area)
  // Annual: ~14,000 kWh, Daily average: ~38 kWh
  // Summer peak: 50-65 kWh, Winter low: 20-35 kWh
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Seasonal variation (higher in summer, lower in winter)
    const month = date.getMonth(); // 0 = Jan, 11 = Dec
    const seasonalFactor = 1 + 0.4 * Math.sin((month - 2) * Math.PI / 6); // Peak in June, low in December
    
    // Weekly variation (slightly higher on weekends for residential)
    const dayOfWeek = date.getDay();
    const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.05 : 1.0;
    
    // Random daily weather variation (clouds, fog)
    const weatherVariation = 0.8 + Math.random() * 0.4; // 80% to 120%
    
    // Base 38 kWh/day * seasonal * weekend * weather
    const baseProduction = 38;
    let kwh = baseProduction * seasonalFactor * weekendBoost * weatherVariation;
    
    // Add some realistic noise
    kwh = Math.max(15, Math.min(70, kwh)); // Cap between 15-70 kWh
    kwh = Math.round(kwh * 10) / 10; // Round to 1 decimal
    
    data.push({
      date: date.toISOString().split('T')[0],
      kwh,
    })
  }
  
  return data
}
