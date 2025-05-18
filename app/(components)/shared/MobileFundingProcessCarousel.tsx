"use client";
import React, { useState } from "react";
import { ArrowRight, Dot } from "lucide-react";

interface Step {
  icon: React.ElementType;
  title: string;
  description: string;
}

interface Props {
  steps: Step[];
}

function trimWords(text: string, maxWords = 30) {
  const words = text.split(" ");
  return words.length > maxWords ? words.slice(0, maxWords).join(" ") + "..." : text;
}

const MobileFundingProcessCarousel: React.FC<Props> = ({ steps }) => {
  const [current, setCurrent] = useState(0);
  const goTo = (idx: number) => setCurrent(idx);
  const prev = () => setCurrent((c) => (c === 0 ? 0 : c - 1));
  const next = () => setCurrent((c) => (c === steps.length - 1 ? c : c + 1));
  const step = steps[current] ?? { icon: () => null, title: '', description: '' };
  const StepIcon = step.icon ?? (() => null);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">
      <div className="flex items-center justify-center w-full mt-2 mb-4">
        <button
          onClick={prev}
          disabled={current === 0}
          aria-label="Previous step"
          className="p-2 disabled:opacity-30"
        >
          <ArrowRight className="rotate-180 text-blue-600" size={28} />
        </button>
        <div className="flex flex-col items-center mx-6 flex-1">
          <div className="w-14 h-14 bg-primary-blue/10 rounded-full flex items-center justify-center border-2 border-white shadow">
            <StepIcon className="w-7 h-7 text-primary-blue" />
          </div>
          <h3 className="text-lg font-semibold mt-2 mb-1 text-center">{step.title}</h3>
          <p className="text-gray-600 text-sm text-center max-w-xs">{trimWords(step.description)}</p>
        </div>
        <button
          onClick={next}
          disabled={current === steps.length - 1}
          aria-label="Next step"
          className="p-2 disabled:opacity-30"
        >
          <ArrowRight className="text-blue-600" size={28} />
        </button>
      </div>
      <div className="flex items-center gap-2 mt-2">
        {steps.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className={`rounded-full w-2.5 h-2.5 ${idx === current ? "bg-blue-600" : "bg-gray-300"}`}
            aria-label={`Go to step ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default MobileFundingProcessCarousel;
