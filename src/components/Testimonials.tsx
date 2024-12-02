"use client";

import React, { useEffect, useState } from 'react';
import Gerald from '@/assets/images/GeraldPicture.png';
import Rafa from '@/assets/images/rafa-juarez.png';
import Robert from '@/assets/images/robert-stockhousen.png';
import Skylar from '@/assets/images/SkylarMoonProfilePicture.png';
import Teresa from '@/assets/images/teresa-garcia.png';
import Timothy from '@/assets/images/TimothyRamon.png';

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      imgSrc: Skylar,
      text:
        '“Rosantina and her team were AMAZING from start to finish. She heard my needs, took her time with me, and created custom solutions for my needs and was able to close the loans needed. I highly recommend her services to anyone needing help getting funded!”',
      name: 'Skylar Moon',
      position: 'President, Authorized Dealer at Boost Mobile',
    },
    {
      imgSrc: Gerald,
      text:
        '“Ms. Aranda’s breadth of knowledge, expertise, and genuine interest in the economic health and well-being of her clients makes her a true asset when navigating the complexities of the U.S. financial system. Her invaluable guidance has been instrumental in acquiring monetary assets used to support and grow my organization’s bottom line. Rosantina is uniquely qualified and driven to ”get the job done!” On a scale of 0 to 5 stars Mrs. Aranda, my Business Lending Advocate, gets 6!”',
      name: 'Gerald M. Gonzalez',
      position: 'Attorney at Law Law Offices of Gerald M. Gonzales P.C.',
    },
    {
      imgSrc: Timothy,
      text:
        '“For the past thirteen years Rosantina Aranda served as my Business Banker where she provided the guidance and financial advisement I needed to achieve “next level” milestones. Her knowledge of the banking industry and professional demeanor is appreciated and respected.  Rosantina’s work ethic consistently produced timely actions and replies. The attention to detail and diligence she applied to our accounts demonstrates her sense of accountability and pride in her work.”',
      name: 'Timothy N. Ramon',
      position: 'President of J.R. Ramon & Sons',
    },
    {
      imgSrc: Teresa,
      text:
        '“Ms. Aranda Really hit the ground running, she inspires me in knowing that there are still people out there helping small businesses succeed, her passion comes through in what she does.”',
      name: 'Teresa Garcia',
      position: 'ServSafe® Food Safety Instructor/Consultant and Corporate Trainer',
    },
    {
      imgSrc: Robert,      
      text:
        '“Business owners need to know what is needed when asking for a loan. They don’t know what they don’t know. Rosantina helps them prepare for the application to ensure they get the best offers on the kindest terms with the greatest chance for success. She is a valuable ally“',
      name: 'Robert Stockhousen',
      position: 'Sales Executive at SWBC',
    },
    {
      imgSrc: Rafa,      
      text:
        '“With decades of experience in the banking business in San Antonio, TX Rosantina is the go-to person to get first-hand advice on how to best prepare your business to deal with banks.“',
      name: 'Rafa Juarez',
      position: 'Creative Director –  DP Film Director – Web Architect at RJC Communications',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 2) % testimonials.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 2) % testimonials.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex - 2 < 0 ? testimonials.length - 2 : prevIndex - 2
    );
  };

  return (
    <section className="py-0">
      <div className="container mx-auto px-6">
        <div className="text-center mb-2">
          <h2 className="text-4xl font-bold mb-1 text-gray-900">
            What Our Clients Are Saying
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it—hear how we've helped small business owners achieve their goals with expert guidance and personalized solutions.
          </p>
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.slice(currentIndex, currentIndex + 2).map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-md border border-gray-200 transform transition-transform duration-300 hover:scale-105"
              >
                <div className="mb-6">
                  <img
                    src={testimonial.imgSrc.src}
                    alt={testimonial.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                  <p className="text-gray-600 italic mb-4">{testimonial.text}</p>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.position}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            className="absolute left-[-2rem] top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-900 transition-colors duration-300"
            onClick={handlePrev}
          >
            &#8249;
          </button>
          <button
            className="absolute right-[-2rem] top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-900 transition-colors duration-300"
            onClick={handleNext}
          >
            &#8250;
          </button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials; 