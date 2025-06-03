import React from "react";

const testimonials = [
  {
    quote:
      "Business Lending Advocate made the loan process simple and stress-free. We went from declined to approved in under two weeks!",
    name: "Sarah M.",
    title: "Owner, Main Street Café",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    quote:
      "Their DSCR calculator and cash-flow analysis gave us the exact numbers lenders wanted. Highly recommend for any small business!",
    name: "James T.",
    title: "Founder, JT Plumbing Co.",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    quote:
      "The loan-packaging service was a game changer. We got three offers and picked the best terms. Professional and fast!",
    name: "Linda K.",
    title: "CEO, Kline Retail Group",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
  },
];

export default function Testimonials() {
  return (
    <section className="mt-20 mb-10">
      <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 text-blue-900">
        What Our Clients Say
      </h3>
      <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch max-w-4xl mx-auto">
        {testimonials.map((t, i) => (
          <div
            key={i}
            className="flex-1 bg-white/90 border border-slate-100 rounded-2xl shadow-lg p-6 flex flex-col items-center text-center"
          >
            <img
              src={t.avatar}
              alt={t.name}
              className="w-16 h-16 rounded-full border-4 border-blue-200 mb-4 shadow"
            />
            <p className="text-lg italic text-slate-700 mb-4">“{t.quote}”</p>
            <div className="font-semibold text-blue-800">{t.name}</div>
            <div className="text-sm text-slate-500">{t.title}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
