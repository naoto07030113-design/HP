import { useState } from 'react'
import { motion } from 'framer-motion'

const PROJECTS = [
  {
    id: 1,
    title: 'Automotive Motion',
    span: 'md:col-span-7',
    aspect: 'aspect-[4/3]',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
  },
  {
    id: 2,
    title: 'Urban Architecture',
    span: 'md:col-span-5',
    aspect: 'aspect-[3/4]',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
  },
  {
    id: 3,
    title: 'Human Perspective',
    span: 'md:col-span-5',
    aspect: 'aspect-[3/4]',
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80',
  },
  {
    id: 4,
    title: 'Brand Identity',
    span: 'md:col-span-7',
    aspect: 'aspect-[4/3]',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
  },
]

const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: [0.25, 0.1, 0.25, 1] },
  },
}

export default function Works() {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <section id="work" className="bg-bg py-12 md:py-16">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16">
        {/* Header */}
        <motion.div
          className="flex items-end justify-between mb-10 md:mb-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUpVariant}
        >
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-px bg-stroke" />
              <span className="text-xs text-muted uppercase tracking-[0.3em]">Selected Work</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-body font-light text-text-primary mb-3">
              Featured <em className="font-display italic">projects</em>
            </h2>
            <p className="text-sm text-muted max-w-sm">
              A selection of projects I've worked on, from concept to launch.
            </p>
          </div>
          <a
            href="#"
            className="hidden md:inline-flex items-center gap-2 rounded-full text-sm text-muted hover:text-text-primary border border-stroke px-5 py-2.5 transition-all duration-300 hover:border-transparent relative group"
          >
            <span className="absolute inset-[-1px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 accent-gradient -z-10" />
            <span className="relative">View all work</span>
            <span className="relative">→</span>
          </a>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">
          {PROJECTS.map((project, i) => (
            <motion.div
              key={project.id}
              className={`${project.span} ${project.aspect} group relative rounded-3xl overflow-hidden bg-surface border border-stroke cursor-pointer`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              onMouseEnter={() => setHovered(project.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Background image */}
              <img
                src={project.image}
                alt={project.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Halftone overlay */}
              <div
                className="absolute inset-0 opacity-20 mix-blend-multiply"
                style={{
                  backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                  backgroundSize: '4px 4px',
                }}
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-bg/70 backdrop-blur-lg opacity-0 group-hover:opacity-100 transition-all duration-400 flex items-center justify-center">
                {/* Hover label pill */}
                <div className="relative">
                  <span className="absolute inset-[-2px] rounded-full accent-gradient" />
                  <div className="relative bg-white rounded-full px-5 py-2.5 text-sm text-black">
                    View — <em className="font-display italic">{project.title}</em>
                  </div>
                </div>
              </div>

              {/* Bottom project name (always visible) */}
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-sm text-white/80">{project.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
