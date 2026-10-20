import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Container from '../../components/ui/Container';
import { Shield, Award, Loader2, PawPrint } from 'lucide-react';

// Custom inline SVG brand icons to match Lucide's design language
const TikTokIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const FacebookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
);

export const About: React.FC = () => {
  const [socials, setSocials] = useState({
    tiktok: '',
    facebook: '',
    instagram: '',
    x: ''
  });
  const [loadingSocials, setLoadingSocials] = useState(true);

  useEffect(() => {
    const fetchSocialSettings = async () => {
      try {
        setLoadingSocials(true);
        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .in('key', ['social_tiktok', 'social_facebook', 'social_instagram', 'social_x']);

        if (error) throw error;

        const fetchedSocials = {
          tiktok: '',
          facebook: '',
          instagram: '',
          x: ''
        };

        if (data) {
          data.forEach((row: any) => {
            if (row.key === 'social_tiktok') fetchedSocials.tiktok = row.value || '';
            if (row.key === 'social_facebook') fetchedSocials.facebook = row.value || '';
            if (row.key === 'social_instagram') fetchedSocials.instagram = row.value || '';
            if (row.key === 'social_x') fetchedSocials.x = row.value || '';
          });
        }
        setSocials(fetchedSocials);
      } catch (err) {
        console.error('Error fetching social links:', err);
      } finally {
        setLoadingSocials(false);
      }
    };

    fetchSocialSettings();
  }, []);

  // Determine which socials are populated and should be rendered
  const activeSocialLinks = [
    { name: 'TikTok', url: socials.tiktok, icon: TikTokIcon, color: 'hover:text-hprh-clay hover:bg-hprh-clay/10' },
    { name: 'Facebook', url: socials.facebook, icon: FacebookIcon, color: 'hover:text-hprh-pine hover:bg-hprh-pine/10' },
    { name: 'Instagram', url: socials.instagram, icon: InstagramIcon, color: 'hover:text-pink-600 hover:bg-pink-50' },
    { name: 'X (Twitter)', url: socials.x, icon: XIcon, color: 'hover:text-slate-900 hover:bg-slate-100' }
  ].filter(link => link.url && link.url.trim() !== '');

  return (
    <div className="py-14 md:py-20 bg-slate-50 min-h-screen text-slate-900 font-sans flex flex-col justify-between">
      <Container className="space-y-16 flex-grow">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700 shadow-xs select-none">
            <PawPrint className="w-3.5 h-3.5" />
            <span>Our Heritage & Dedication</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold font-display tracking-tight text-slate-900 leading-tight">
            About Rescue4paws
          </h1>

          <div className="pt-1">
            <span className="inline-block text-xs font-semibold text-slate-600 bg-white border border-slate-200/90 px-4 py-1.5 rounded-full shadow-xs">
              Established December 4, 2015 • Dedicated Foster Network
            </span>
          </div>
        </div>

        {/* Narrative & Visual Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          {/* Narrative Text Column */}
          <div className="lg:col-span-7 space-y-5 text-sm sm:text-base leading-relaxed text-slate-600 font-normal">
            <p className="font-semibold text-lg leading-relaxed text-slate-900">
              Founded on December 4, 2015, Rescue4paws is dedicated to
              giving homeless, abandoned, neglected, and at-risk animals a second
              chance at life. What began as a passion for helping vulnerable
              animals has grown into a mission-driven rescue organization focused
              on saving lives and creating lasting connections between pets and
              loving families.
            </p>

            <p>
              At Rescue4paws, we believe that every animal deserves
              compassion, safety, and the opportunity to thrive. Through rescue
              efforts, foster placement support, adoption coordination, and
              community outreach, we work tirelessly to help animals find the
              caring homes they deserve.
            </p>

            <p>
              Our commitment extends beyond rescue. We strive to educate
              communities about responsible pet ownership, promote animal welfare,
              and advocate for the humane treatment of all animals. Every adoption
              represents a new beginning, and every life saved reinforces our
              dedication to making a meaningful difference.
            </p>

            <p>
              Whether you're looking to adopt, foster, volunteer, or support our
              mission, we welcome you to become part of the Rescue4paws
              family. Together, we can continue creating brighter futures for
              animals in need — one paw at a time.
            </p>
          </div>

          {/* Visual Showcase Card */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-[400px] overflow-hidden group">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 relative mb-4 shadow-inner">
                <img
                  src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800"
                  alt="Happy rescue dogs cuddling"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-emerald-700 shadow-sm border border-emerald-500/20">
                    FAMILY FIRST
                  </span>
                </div>
              </div>
              <div className="text-center font-display italic text-base text-slate-700">
                “A second chance at life and unconditional love...”
              </div>
            </div>
          </div>
        </div>

        {/* Mission & Vision Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Mission Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 space-y-4 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-display text-2xl font-bold text-slate-900">Our Mission</h3>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              To rescue, rehabilitate, and rehome animals in need while promoting
              compassion, responsible pet ownership, and lifelong human-animal
              bonds.
            </p>
          </div>

          {/* Vision Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 space-y-4 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-xs">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-display text-2xl font-bold text-slate-900">Our Vision</h3>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              A world where every animal is valued, protected, and loved in a safe
              and permanent home, supported by a resilient community network.
            </p>
          </div>
        </div>

        {/* Social Media Links Section */}
        <div className="border-t border-slate-200/80 pt-10 text-center max-w-3xl mx-auto space-y-6">
          <div className="space-y-1.5">
            <span className="text-xs uppercase tracking-widest text-indigo-600 font-bold">
              Stay Connected
            </span>
            <h3 className="font-display text-2xl font-bold text-slate-900">
              Follow Our Rescue Journey
            </h3>
          </div>

          {loadingSocials ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : activeSocialLinks.length === 0 ? (
            <p className="text-xs text-slate-400 font-mono italic">
              Social platforms coordinates coming soon.
            </p>
          ) : (
            <div className="flex flex-wrap justify-center gap-4">
              {activeSocialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200/90 text-xs font-semibold text-slate-800 bg-white transition-all shadow-xs hover:shadow-md hover:border-indigo-300 ${social.color}`}
                    title={`Follow us on ${social.name}`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{social.name}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default About;
