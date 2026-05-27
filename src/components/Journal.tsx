import { motion } from 'framer-motion'

const ENTRIES = [
  {
    id: 1,
    title: 'The Psychology of Minimal Design',
    image: 'https://images.unsplash.com/photo-1518655048521-f130df041f66?w=200&q=80',
    readTime: '5 min read',
    date: 'Dec 12, 2025',
    tag: 'Design',
  },
  {
    id: 2,
    title: 'Building in Public: Year One Lessons',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&q=80',
    readTime: '8 min read',
    date: 'Nov 28, 2025',
    tag: 'Startup',
  },
  {
    id: 3,
    title: 'Motion Design as Storytelling Medium',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&q=80',
    readTime: '6 min read',
    date: 'Nov 10, 2025',
    tag: 'Motion',
  },
  {
    id: 4,
    title: 'System Thinking in Interface Design',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80',
    readTime: '7 min read',
    date: 'Oct 22, 2025',
    tag: 'Systems',
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

export default function Journal() {
  return (
    <section id="journal" className="bg-bg py-16 md:py-24">
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
              <span className="text-xs text-muted uppercase tracking-[0.3em]">Journal</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-body font-light text-text-primary mb-3">
              Recent <em className="font-display italic">thoughts</em>
            </h2>
            <p className="text-sm text-muted max-w-sm">
              Writing on design, development, and the intersection of both.
            </p>
          </div>
          <a
            href="#"
            className="hidden md:inline-flex items-center gap-2 rounded-full text-sm text-muted hover:text-text-primary border border-stroke px-5 py-2.5 transition-all duration-300 hover:border-transparent relative group"
          >
            <span className="absolute inset-[-1px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 accent-gradient -z-10" />
            <span className="relative">View all</span>
            <span className="relative">→</span>
          </a>
        </motion.div>

        {/* Journal entries */}
        <div className="flex flex-col gap-3">
          {ENTRIES.map((entry, i) => (
            <motion.a
              key={entry.id}
              href="#"
              className="flex items-center gap-6 p-4 bg-surface/30 hover:bg-surface border border-stroke rounded-[40px] sm:rounded-full transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {/* Image */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden flex-shrink-0">
                <img
                  src={entry.image}
                  alt={entry.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              {/* Tag */}
              <span className="hidden sm:block text-xs text-muted uppercase tracking-[0.2em] w-16 flex-shrink-0">
                {entry.tag}
              </span>

              {/* Title */}
              <p className="flex-1 text-sm text-text-primary group-hover:text-white transition-colors duration-200">
                {entry.title}
              </p>

              {/* Meta */}
              <div className="hidden md:flex items-center gap-4 flex-shrink-0">
                <span className="text-xs text-muted">{entry.readTime}</span>
                <span className="text-xs text-muted">{entry.date}</span>
              </div>

              {/* Arrow */}
              <span className="text-muted group-hover:text-text-primary transition-colors duration-200 flex-shrink-0 text-sm">
                →
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
