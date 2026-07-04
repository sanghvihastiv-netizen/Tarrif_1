'use client';


import Header from './components/Header';
import Hero from './components/Hero';
import MetricsBar from './components/MetricsBar';
import HubsShowcase from './components/HubsShowcase';
import Capabilities from './components/Capabilities';
import CTASection from './components/CTASection';
import Footer from './components/Footer';


export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <Header />
      <Hero />
      <MetricsBar />
      <HubsShowcase />
      <Capabilities />
      <CTASection />
      <Footer />
    </main>
  );
}



