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

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let nodeCount = 25
    let connectionDistance = 250
    let triangleSize = 10

    const updateForScreenSize = () => {
      const width = window.innerWidth
      if (width < 640) {
        nodeCount = 30
        connectionDistance = 180
        triangleSize = 8
      } else if (width < 1024) {
        nodeCount = 35
        connectionDistance = 200
        triangleSize = 9
      } else {
        nodeCount = 45
        connectionDistance = 250
        triangleSize = 10
      }
    }

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(dpr, dpr)
      updateForScreenSize()
      
      nodesRef.current = Array.from({ length: nodeCount }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      }))
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      nodesRef.current.forEach(node => {
        node.x += node.vx
        node.y += node.vy

        if (node.x < 0 || node.x > window.innerWidth) node.vx *= -1
        if (node.y < 0 || node.y > window.innerHeight) node.vy *= -1

        node.x = Math.max(0, Math.min(window.innerWidth, node.x))
        node.y = Math.max(0, Math.min(window.innerHeight, node.y))
      })

      ctx.lineWidth = window.innerWidth < 640 ? 0.8 : 1

      for (let i = 0; i < nodesRef.current.length; i++) {
        for (let j = i + 1; j < nodesRef.current.length; j++) {
          const dx = nodesRef.current[i].x - nodesRef.current[j].x
          const dy = nodesRef.current[i].y - nodesRef.current[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.15
            ctx.strokeStyle = `rgba(165, 200, 255, ${opacity})`
            ctx.beginPath()
            ctx.moveTo(nodesRef.current[i].x, nodesRef.current[i].y)
            ctx.lineTo(nodesRef.current[j].x, nodesRef.current[j].y)
            ctx.stroke()
          }
        }
      }

      nodesRef.current.forEach(node => {
        ctx.save()
        ctx.translate(node.x, node.y)

        ctx.shadowBlur = 15
        ctx.shadowColor = 'rgba(200, 100, 255, 0.6)'
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, triangleSize)
        gradient.addColorStop(0, 'rgba(220, 120, 255, 0.4)')
        gradient.addColorStop(1, 'rgba(180, 80, 255, 0.1)')
        ctx.fillStyle = gradient

        ctx.beginPath()
        ctx.moveTo(0, -triangleSize / 2)
        ctx.lineTo(-triangleSize / 2, triangleSize / 2)
        ctx.lineTo(triangleSize / 2, triangleSize / 2)
        ctx.closePath()
        ctx.fill()

        ctx.shadowBlur = 0
        ctx.strokeStyle = 'rgba(230, 150, 255, 0.3)'
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.restore()
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
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-background to-accent/3" />
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: 'normal', opacity: 0.85 }}
      />
      
      <div className="absolute top-1/4 left-1/4 w-48 h-48 md:w-72 md:h-72 lg:w-96 lg:h-96 bg-primary/8 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-72 md:h-72 lg:w-96 lg:h-96 bg-accent/8 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '6s', animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-72 md:h-72 lg:w-96 lg:h-96 bg-secondary/8 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '5s', animationDelay: '2s' }} />
    </div>
  )
}
