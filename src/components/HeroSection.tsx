import Image from 'next/image';

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  backgroundImage?: string;
}

export default function HeroSection({
  title,
  subtitle,
  description,
  backgroundImage = 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80'
}: HeroSectionProps) {
  return (
    <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-black/50 z-10" />
      <Image
        src={backgroundImage}
        alt="Hero background"
        fill
        className="object-cover"
        priority
        quality={90}
      />
      <div className="container mx-auto px-6 relative z-20">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 [text-shadow:_0_2px_10px_rgb(0_0_0_/_40%)]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl md:text-2xl mb-4 [text-shadow:_0_2px_8px_rgb(0_0_0_/_40%)]">
              {subtitle}
            </p>
          )}
          {description && (
            <p className="text-lg mb-8 text-white/90 [text-shadow:_0_2px_8px_rgb(0_0_0_/_40%)]">
              {description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}