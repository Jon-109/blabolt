'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Quote, ShieldCheck, Star } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  image: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Gerald M. Gonzales',
    role: 'Attorney at Law',
    company: 'Law Offices of Gerald M. Gonzales P.C.',
    content:
      "Business Lending Advocate's breadth of knowledge, expertise, and genuine interest in the financial health of small businesses makes them an incredible asset when navigating the complexities of the U.S. lending system. Their guidance helped us secure funding that directly supported our organization's growth. On a scale of 0 to 5 stars, BLA gets 6!",
    image: '/images/GeraldPicture.png',
  },
  {
    id: 2,
    name: 'Timothy N. Ramon',
    role: 'President',
    company: 'JR Ramon & Sons',
    content:
      "For over a decade, I've relied on the financial guidance and professionalism now provided through Business Lending Advocate. Their knowledge of the banking industry, attention to detail, and accountability have consistently helped me achieve major business milestones.",
    image: '/images/TimothyRamon.png',
  },
  {
    id: 3,
    name: 'Teresa Garcia',
    role: 'Instructor & Corporate Trainer',
    company: 'Food Safety Direct',
    content:
      "Business Lending Advocate hit the ground running. It's refreshing to know there are still people out there truly committed to helping small businesses succeed. Their passion and dedication shine through in everything they do.",
    image: '/images/teresa-garcia.png',
  },
  {
    id: 4,
    name: 'Skylar Moon',
    role: 'President, Authorized Dealer',
    company: 'Boost Mobile',
    content:
      'From start to finish, the BLA team was amazing. They listened to my needs, created tailored solutions, and successfully closed the loans I needed to grow my business. I highly recommend their services to anyone seeking funding.',
    image: '/images/SkylarMoonProfilePicture.png',
  },
  {
    id: 5,
    name: 'Rafa Juarez',
    role: 'Creative Director & Web Architect',
    company: 'RJC Communications',
    content:
      'With decades of insight into the banking world, Business Lending Advocate is the go-to resource for small businesses looking to prepare for funding. Their advice is always practical, timely, and rooted in real experience.',
    image: '/images/rafa-juarez.png',
  },
  {
    id: 6,
    name: 'Robert Stockhausen',
    role: 'Sales Executive',
    company: 'SWBC PEO',
    content:
      "Most business owners don't know what lenders are actually looking for. Business Lending Advocate helps bridge that gap by preparing entrepreneurs to apply with confidence—and to receive the best offers with favorable terms. They're a valuable ally to have on your side.",
    image: '/images/robert-stockhousen.png',
  },
];

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testimonialsPerPage, setTestimonialsPerPage] = useState(2);
  const totalTestimonials = testimonials.length;

  useEffect(() => {
    const updateTestimonialsPerPage = () => {
      setTestimonialsPerPage(window.innerWidth < 768 ? 1 : 2);
    };

    updateTestimonialsPerPage();
    window.addEventListener('resize', updateTestimonialsPerPage);
    return () => window.removeEventListener('resize', updateTestimonialsPerPage);
  }, []);

  const firstIndex = currentIndex % totalTestimonials;
  const secondIndex = (currentIndex + 1) % totalTestimonials;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + testimonialsPerPage) % totalTestimonials);
    }, 7000);

    return () => clearInterval(interval);
  }, [totalTestimonials, testimonialsPerPage]);

  const pages = Math.ceil(totalTestimonials / testimonialsPerPage);
  const activePage = Math.floor(currentIndex / testimonialsPerPage);

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_42%,#f8fafc_100%)] py-10 sm:py-12">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_16%_18%,rgba(6,182,212,0.15),transparent_28%),radial-gradient(circle_at_84%_20%,rgba(14,165,233,0.12),transparent_26%),radial-gradient(circle_at_80%_88%,rgba(251,191,36,0.12),transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 grid gap-4 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-800 shadow-sm backdrop-blur">
              <ShieldCheck className="h-4 w-4" />
              Client Proof
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">What business owners say after working with us</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Same quotes, presented in a cleaner format that matches the credibility we want the rest of the page to carry.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Positioning</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Trusted by owners who needed real funding guidance</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Themes</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Knowledge, detail, accountability, and real-world support</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Best fit</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Small businesses that want more than generic loan advice</p>
            </div>
          </div>
        </div>

        <div className={`grid gap-5 ${testimonialsPerPage === 2 ? 'md:grid-cols-2' : ''}`}>
          {testimonials.length > 0 && (
            <>
              <article
                key={testimonials[firstIndex]!.id}
                className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/92 p-6 shadow-[0_22px_50px_-34px_rgba(15,23,42,0.32)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_-30px_rgba(15,23,42,0.38)] sm:p-7"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-500 to-amber-400" />
                <div className="flex items-start justify-between gap-4">
                  <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    Client Review
                  </div>
                  <Quote className="h-8 w-8 text-cyan-600/70" />
                </div>

                <p className="mt-5 text-base leading-8 text-slate-700">&ldquo;{testimonials[firstIndex]!.content}&rdquo;</p>

                <div className="mt-6 flex items-center gap-4 border-t border-slate-200 pt-5">
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <Image src={testimonials[firstIndex]!.image} alt={testimonials[firstIndex]!.name} fill className="object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{testimonials[firstIndex]!.name}</h3>
                    <p className="text-sm text-slate-600">{testimonials[firstIndex]!.role}</p>
                    <p className="text-sm text-cyan-700">{testimonials[firstIndex]!.company}</p>
                  </div>
                </div>
              </article>

              {testimonialsPerPage === 2 && (
                <article
                  key={testimonials[secondIndex]!.id}
                  className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/92 p-6 shadow-[0_22px_50px_-34px_rgba(15,23,42,0.32)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_-30px_rgba(15,23,42,0.38)] sm:p-7"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-400" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-700">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Trusted Outcome
                    </div>
                    <Quote className="h-8 w-8 text-cyan-600/70" />
                  </div>

                  <p className="mt-5 text-base leading-8 text-slate-700">&ldquo;{testimonials[secondIndex]!.content}&rdquo;</p>

                  <div className="mt-6 flex items-center gap-4 border-t border-slate-200 pt-5">
                    <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                      <Image src={testimonials[secondIndex]!.image} alt={testimonials[secondIndex]!.name} fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{testimonials[secondIndex]!.name}</h3>
                      <p className="text-sm text-slate-600">{testimonials[secondIndex]!.role}</p>
                      <p className="text-sm text-cyan-700">{testimonials[secondIndex]!.company}</p>
                    </div>
                  </div>
                </article>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: pages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index * testimonialsPerPage)}
              className={`h-2.5 rounded-full transition-all ${
                activePage === index ? 'w-8 bg-cyan-700' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to testimonial set ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
