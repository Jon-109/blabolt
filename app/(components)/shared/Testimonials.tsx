'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

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
    name: "Gerald M. Gonzales",
    role: "Attorney at Law",
    company: "Law Offices of Gerald M. Gonzales P.C.",
    content: "Business Lending Advocate's breadth of knowledge, expertise, and genuine interest in the financial health of small businesses makes them an incredible asset when navigating the complexities of the U.S. lending system. Their guidance helped us secure funding that directly supported our organization's growth. On a scale of 0 to 5 stars, BLA gets 6!",
    image: "/images/GeraldPicture.png"
  },
  {
    id: 2,
    name: "Timothy N. Ramon",
    role: "President",
    company: "JR Ramon & Sons",
    content: "For over a decade, I've relied on the financial guidance and professionalism now provided through Business Lending Advocate. Their knowledge of the banking industry, attention to detail, and accountability have consistently helped me achieve major business milestones.",
    image: "/images/TimothyRamon.png"
  },
  {
    id: 3,
    name: "Teresa Garcia",
    role: "Instructor & Corporate Trainer",
    company: "Food Safety Direct",
    content: "Business Lending Advocate hit the ground running. It's refreshing to know there are still people out there truly committed to helping small businesses succeed. Their passion and dedication shine through in everything they do.",
    image: "/images/teresa-garcia.png"
  },
  {
    id: 4,
    name: "Skylar Moon",
    role: "President, Authorized Dealer",
    company: "Boost Mobile",
    content: "From start to finish, the BLA team was amazing. They listened to my needs, created tailored solutions, and successfully closed the loans I needed to grow my business. I highly recommend their services to anyone seeking funding.",
    image: "/images/SkylarMoonProfilePicture.png"
  },
  {
    id: 5,
    name: "Rafa Juarez",
    role: "Creative Director & Web Architect",
    company: "RJC Communications",
    content: "With decades of insight into the banking world, Business Lending Advocate is the go-to resource for small businesses looking to prepare for funding. Their advice is always practical, timely, and rooted in real experience.",
    image: "/images/rafa-juarez.png"
  },
  {
    id: 6,
    name: "Robert Stockhausen",
    role: "Sales Executive",
    company: "SWBC PEO",
    content: "Most business owners don't know what lenders are actually looking for. Business Lending Advocate helps bridge that gap by preparing entrepreneurs to apply with confidence—and to receive the best offers with favorable terms. They're a valuable ally to have on your side.",
    image: "/images/robert-stockhousen.png"
  }
];

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Responsive: 1 on mobile, 2 on md+
  const [testimonialsPerPage, setTestimonialsPerPage] = useState(2);
  const totalTestimonials = testimonials.length;

  useEffect(() => {
    // Update testimonialsPerPage based on window width
    const updateTestimonialsPerPage = () => {
      if (window.innerWidth < 768) {
        setTestimonialsPerPage(1);
      } else {
        setTestimonialsPerPage(2);
      }
    };
    updateTestimonialsPerPage();
    window.addEventListener('resize', updateTestimonialsPerPage);
    return () => window.removeEventListener('resize', updateTestimonialsPerPage);
  }, []);

  const firstIndex = currentIndex % totalTestimonials;
  const secondIndex = (currentIndex + 1) % totalTestimonials;

  // Rotate testimonials every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + testimonialsPerPage) % totalTestimonials);
    }, 5000);
    return () => clearInterval(interval);
  }, [totalTestimonials, testimonialsPerPage]);

  return (
    <section className="bg-primary-blue pt-3 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            What Our Clients Say
          </h2>
          <p className="mt-2 text-lg text-white">
            Discover how we've helped businesses achieve their financial goals
          </p>
        </div>
        <div className={`grid gap-6 ${testimonialsPerPage === 2 ? 'md:grid-cols-2' : ''}`}> 
          {testimonials.length > 0 && (
            <>
              {/* Always show the first testimonial */}
              <div
                key={testimonials[firstIndex]!.id}
                className="bg-white rounded-lg shadow-lg p-6 transform transition duration-500 hover:scale-105"
              >
                <div className="flex flex-col sm:flex-row items-center mb-4">
                  <div className="relative h-24 w-24 rounded-md overflow-hidden mb-4 sm:mb-0">
                    <Image
                      src={testimonials[firstIndex]!.image}
                      alt={testimonials[firstIndex]!.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="ml-0 sm:ml-6 text-center sm:text-left">
                    <h3 className="text-lg font-semibold text-gray-900">{testimonials[firstIndex]!.name}</h3>
                    <p className="text-sm text-gray-600">{testimonials[firstIndex]!.role} at {testimonials[firstIndex]!.company}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">&ldquo;{testimonials[firstIndex]!.content}&rdquo;</p>
              </div>
              {/* Only show the second testimonial if testimonialsPerPage === 2 */}
              {testimonialsPerPage === 2 && (
                <div
                  key={testimonials[secondIndex]!.id}
                  className="bg-white rounded-lg shadow-lg p-6 transform transition duration-500 hover:scale-105"
                >
                  <div className="flex flex-col sm:flex-row items-center mb-4">
                    <div className="relative h-24 w-24 rounded-md overflow-hidden mb-4 sm:mb-0">
                      <Image
                        src={testimonials[secondIndex]!.image}
                        alt={testimonials[secondIndex]!.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="ml-0 sm:ml-6 text-center sm:text-left">
                      <h3 className="text-lg font-semibold text-gray-900">{testimonials[secondIndex]!.name}</h3>
                      <p className="text-sm text-gray-600">{testimonials[secondIndex]!.role} at {testimonials[secondIndex]!.company}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 italic">&ldquo;{testimonials[secondIndex]!.content}&rdquo;</p>
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex justify-center mt-6">
          {Array.from({ length: Math.ceil(totalTestimonials / testimonialsPerPage) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index * testimonialsPerPage)}
              className={`mx-1 h-2 w-2 rounded-full ${
                Math.floor(currentIndex / testimonialsPerPage) === index
                  ? 'bg-blue-600'
                  : 'bg-gray-300'
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
