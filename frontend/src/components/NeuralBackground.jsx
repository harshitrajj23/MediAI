import React, { useEffect, useRef } from 'react';

export default function NeuralBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: null, y: null, radius: 180 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    // Configuration
    const particleCount = Math.min(80, Math.floor((window.innerWidth * window.innerHeight) / 15000));
    const connectionDistance = 110;
    const colors = [
      'rgba(34, 197, 94, ',  // Green
      'rgba(6, 182, 212, ',  // Cyan
      'rgba(16, 185, 129, ', // Emerald
    ];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = (Math.random() - 0.5) * 0.7;
        this.radius = Math.random() * 2.5 + 1.5;
        this.colorIndex = Math.floor(Math.random() * colors.length);
        this.pulseSpeed = 0.02 + Math.random() * 0.03;
        this.pulseAngle = Math.random() * Math.PI;
      }

      update() {
        // Normal movement
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off walls
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        // Pulse the size slightly for interactive feel
        this.pulseAngle += this.pulseSpeed;
        
        // Mouse interaction: pull particles slightly toward mouse if close
        if (mouseRef.current.x !== null && mouseRef.current.y !== null) {
          const dx = mouseRef.current.x - this.x;
          const dy = mouseRef.current.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < mouseRef.current.radius) {
            // Gentle gravitational pull
            const force = (mouseRef.current.radius - distance) / mouseRef.current.radius;
            this.x += (dx / distance) * force * 0.5;
            this.y += (dy / distance) * force * 0.5;
          }
        }
      }

      draw() {
        const pulse = 1 + Math.sin(this.pulseAngle) * 0.25;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        
        // Highly noticeable glow on nodes
        ctx.fillStyle = colors[this.colorIndex] + '0.75)';
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.colorIndex === 0 ? '#22c55e' : this.colorIndex === 1 ? '#06b6d4' : '#10b981';
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow for lines
      }
    }

    // Initialize particles
    const initParticles = () => {
      particles = [];
      const count = Math.min(100, Math.floor((canvas.width * canvas.height) / 16000));
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    };

    initParticles();

    // Mouse events on window to track mouse even if over other elements
    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.28;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            
            // Choose line color based on node colors
            const grad = ctx.createLinearGradient(
              particles[i].x, particles[i].y,
              particles[j].x, particles[j].y
            );
            grad.addColorStop(0, colors[particles[i].colorIndex] + alpha + ')');
            grad.addColorStop(1, colors[particles[j].colorIndex] + alpha + ')');
            
            ctx.strokeStyle = grad;
            ctx.lineWidth = (1 - dist / connectionDistance) * 1.5;
            ctx.stroke();
          }
        }
      }

      // Draw connections to the mouse cursor (extra premium interactivity!)
      if (mouseRef.current.x !== null && mouseRef.current.y !== null) {
        particles.forEach((p) => {
          const dx = p.x - mouseRef.current.x;
          const dy = p.y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouseRef.current.radius) {
            const alpha = (1 - dist / mouseRef.current.radius) * 0.45; // brighter lines near mouse
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
            
            ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
            ctx.lineWidth = (1 - dist / mouseRef.current.radius) * 2;
            
            // High glow style for lines touching the mouse
            ctx.shadowBlur = 4;
            ctx.shadowColor = '#22c55e';
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        });
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 bg-dark-950 pointer-events-none transition-colors duration-500"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
