import { Suspense } from 'react'
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import LogoCloud from "@/components/LogoCloud";
import Problem from "@/components/Problem";
import FeaturesAccordion from "@/components/FeaturesAccordion";
import HowItWorks from "@/components/HowItWorks";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main>
        <Hero />
        <LogoCloud />
        <Problem />
        <FeaturesAccordion />
        <HowItWorks />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
