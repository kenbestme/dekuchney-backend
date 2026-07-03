import Image from 'next/image';
import AvailabilityWidget from '@/components/AvailabilityWidget';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/hero-pool.jpg" // Placeholder for luxury pool
            alt="De Kuchney Villa Hotel Pool"
            fill
            className="object-cover brightness-50"
            priority
          />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16">
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 drop-shadow-lg">
            Welcome to De Kuchney Villa Hotel
          </h1>
          <p className="text-xl text-neutral-200 mb-10 font-light">
            Unparalleled luxury, breathtaking views, and uncompromising service.
          </p>
          <Link 
            href="/rooms" 
            className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-sm transition-colors text-lg tracking-wide uppercase"
          >
            Explore Our Suites
          </Link>
        </div>

        {/* Floating Availability Widget */}
        <div className="absolute -bottom-16 left-0 right-0 z-20 px-4">
          <AvailabilityWidget />
        </div>
      </section>

      {/* Spacing for floating widget */}
      <div className="h-24"></div>

      {/* Introduction Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-serif mb-6 text-amber-900">Your Comfort, Our Priority</h2>
          <p className="text-neutral-600 leading-relaxed mb-6">
            Situated in the heart of the city, De Kuchney Villa Hotel offers a complete experience 
            of standard and state-of-the-art guest facilities. From our stunning Executive Suites 
            to our serene poolside lounge, every detail is crafted for your utmost relaxation.
          </p>
          <ul className="space-y-3 text-neutral-600 mb-8">
            <li className="flex items-center">✓ High-speed WiFi (500+ Mbps)</li>
            <li className="flex items-center">✓ 24-hour Room Service & Front Desk</li>
            <li className="flex items-center">✓ Outdoor Pool & Premium Gym</li>
          </ul>
        </div>
        <div className="relative h-96 rounded-lg overflow-hidden shadow-2xl">
          <Image 
            src="/images/lobby.jpg" 
            alt="Hotel Lobby" 
            fill 
            className="object-cover" 
          />
        </div>
      </section>
    </main>
  );
}