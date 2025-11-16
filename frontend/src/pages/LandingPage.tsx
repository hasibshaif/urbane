import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight, UsersRound } from 'lucide-react'
import { CardContainer, CardBody, CardItem } from '../components/Card3D'

const destinations = [
  {
    name: 'Amsterdam',
    country: 'Netherlands',
    image: '/images/places/amsterdam-netherlands.jpeg',
  },
  {
    name: 'Venice',
    country: 'Italy',
    image: '/images/places/venice-italy.jpeg',
  },
  {
    name: 'New York',
    country: 'United States',
    image: '/images/places/new-york-united-states.jpeg',
  },
  {
    name: 'Kiev',
    country: 'Ukraine',
    image: '/images/places/kiev-ukraine.jpeg',
  },
  {
    name: 'Dhaka',
    country: 'Bangladesh',
    image: '/images/places/dhaka-bangladesh.jpeg',
  },
  {
    name: 'Bangkok',
    country: 'Thailand',
    image: '/images/places/bangkok-thailand.jpeg',
  },
]

const LandingPage = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-hero-gradient opacity-95" />
      <motion.div
        className="pointer-events-none absolute -top-40 right-20 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl"
        animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.05, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-[-10rem] left-[-6rem] h-[32rem] w-[32rem] rounded-full bg-sky-400/15 blur-3xl"
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1080px] flex-col px-4 pb-20 pt-8 sm:px-8">
        <header className="flex items-center justify-between">
          <Link
            to="/discover"
            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200"
          >
            <img
              src="/urbane-logo.png"
              alt="Urbane"
              className="h-10 w-10 rounded-full object-cover"
            />
            Urbane
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-slate-300 sm:flex">
            <a href="#destinations" className="hover:text-white">
              Destinations
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300 hover:text-white"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-glow transition hover:bg-cyan-300"
            >
              Join free
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <main className="mt-20 flex flex-col gap-16">
          <section className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="space-y-6"
            >
              <h1 className="font-display text-5xl font-semibold leading-tight text-white sm:text-6xl lg:text-7xl">
                Make every city feel like you already have friends there.
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-slate-300">
                Connect with travelers and locals who share your interests. Find
                experiences, make friends, and explore cities together.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-glow transition hover:bg-cyan-300"
                >
                  Get started
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-white/15 px-6 py-3 text-sm text-slate-200 transition hover:border-cyan-300 hover:text-white"
                >
                  Sign in
                </Link>
              </div>
            </motion.div>
          </section>

          <section id="destinations" className="space-y-8">
            <div className="text-center">
              <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
                Explore destinations
              </h2>
              <p className="mt-2 text-slate-300">
                Connect with travelers and locals in cities around the world
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              {destinations.map((destination, index) => (
                <motion.div
                  key={destination.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <CardContainer
                    className="h-full w-full"
                    containerClassName="h-full w-full"
                  >
                    <CardBody className="h-full w-full">
                      <CardItem
                        translateZ="40"
                        className="h-full w-full"
                      >
                        <div className="relative h-full w-full overflow-hidden rounded-2xl aspect-[4/3]">
                          <CardItem
                            translateZ="80"
                            rotateX="5"
                            className="absolute inset-0"
                          >
                            <img
                              src={destination.image}
                              alt={`${destination.name}, ${destination.country}`}
                              className="h-full w-full object-cover"
                            />
                          </CardItem>
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                          <CardItem
                            translateZ="120"
                            translateY="-10"
                            className="absolute bottom-0 left-0 right-0 p-4"
                          >
                            <h3 className="font-display text-lg font-semibold text-white">
                              {destination.name}
                            </h3>
                            <p className="text-sm text-slate-300">
                              {destination.country}
                            </p>
                          </CardItem>
                        </div>
                      </CardItem>
                    </CardBody>
                  </CardContainer>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-3">
                <UsersRound className="h-6 w-6 text-cyan-300" />
              </div>
              <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
                Find your travel community
              </h2>
              <p className="text-slate-300">
                We match you with like-minded travelers based on your interests,
                travel style, and location. Start connecting today.
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-glow transition hover:bg-cyan-300"
              >
                Get started
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </section>
        </main>

        <footer className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Urbane. Adventure responsibly.</p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-white">
              Sign in
            </Link>
            <a
              href="mailto:hello@urbane.app"
              className="hover:text-white"
            >
              Contact
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default LandingPage

