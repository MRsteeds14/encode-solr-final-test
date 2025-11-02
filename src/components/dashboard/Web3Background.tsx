import { useEffect, useRef } from 'react'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
}

export default function Web3Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Node[]>([])
  const animationFrameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const nodeCount = 12
    const connectionDistance = 250

    nodesRef.current = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    }))

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      nodesRef.current.forEach(node => {
        node.x += node.vx
        node.y += node.vy

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1

        node.x = Math.max(0, Math.min(canvas.width, node.x))
        node.y = Math.max(0, Math.min(canvas.height, node.y))
      })

      ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)'
      ctx.lineWidth = 1.5

      for (let i = 0; i < nodesRef.current.length; i++) {
        for (let j = i + 1; j < nodesRef.current.length; j++) {
          const dx = nodesRef.current[i].x - nodesRef.current[j].x
          const dy = nodesRef.current[i].y - nodesRef.current[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.4
            ctx.strokeStyle = `rgba(100, 150, 255, ${opacity})`
            ctx.beginPath()
            ctx.moveTo(nodesRef.current[i].x, nodesRef.current[i].y)
            ctx.lineTo(nodesRef.current[j].x, nodesRef.current[j].y)
            ctx.stroke()
          }
        }
      }

      ctx.fillStyle = 'rgba(50, 255, 150, 0.6)'
      ctx.strokeStyle = 'rgba(50, 255, 150, 0.8)'
      ctx.lineWidth = 2

      nodesRef.current.forEach(node => {
        const size = 20
        ctx.beginPath()
        ctx.moveTo(node.x, node.y - size / 2)
        ctx.lineTo(node.x - size / 2, node.y + size / 2)
        ctx.lineTo(node.x + size / 2, node.y + size / 2)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: 'screen' }}
      />
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '6s', animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '5s', animationDelay: '2s' }} />
    </div>
  )
}
