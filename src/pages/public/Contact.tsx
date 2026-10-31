import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Container from '../../components/ui/Container';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Loader2, 
  Send, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Sparkles,
  MessageSquare
} from 'lucide-react';

export const Contact: React.FC = () => {
  // Contact Info State (fetched dynamically)
  const [contactInfo, setContactInfo] = useState({
    phone: '',
    email: '',
    address: ''
  });
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('General');
  const [message, setMessage] = useState('');
  
  // Status State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch contact information from app_settings on mount
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        setLoadingInfo(true);
        const { data, error: fetchError } = await supabase
          .from('app_settings')
          .select('*')
          .in('key', ['contact_phone', 'contact_email', 'contact_address']);

        if (fetchError) throw fetchError;

        const info = {
          phone: '+1 (555) 737-2834',
          email: 'admin@rescue4pawz.site',
          address: 'Grand Rapids, MI 49503'
        };

        if (data) {
          data.forEach((row: any) => {
            if (row.key === 'contact_phone') info.phone = row.value;
            if (row.key === 'contact_email') info.email = row.value;
            if (row.key === 'contact_address') info.address = row.value;
          });
        }
        setContactInfo(info);
      } catch (err) {
        console.error('Error fetching contact info from settings:', err);
        // Fallback defaults in case of network/db issues
        setContactInfo({
          phone: '+1 (555) 737-2834',
          email: 'admin@rescue4pawz.site',
          address: 'Grand Rapids, MI 49503'
        });
      } finally {
        setLoadingInfo(false);
      }
    };

    fetchContactInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validations
    if (!fullName.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all required fields (Name, Email, and Message).');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // 1. Insert into database (contact_submissions) - WITHOUT .select() due to INSERT-only RLS policy
      const { error: dbError } = await supabase
        .from('contact_submissions')
        .insert([
          {
            full_name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim() || null,
            subject: subject,
            message: message.trim()
          }
        ]);

      if (dbError) throw dbError;

      // 2. Trigger email notification via Edge Function (non-blocking if it fails, but we try)
      try {
        const { error: emailError } = await supabase.functions.invoke('send-approval-email', {
          body: {
            type: 'contact_form_submission',
            submitterName: fullName.trim(),
            submitterEmail: email.trim(),
            message: message.trim(),
            subject: subject,
            phone: phone.trim() || undefined
          }
        });

        if (emailError) {
          console.error('Database insert succeeded, but email notification failed to send:', emailError);
        }
      } catch (emailErr) {
        console.error('Error triggering email notification:', emailErr);
      }

      // Show success
      setSubmitSuccess(true);
      
      // Reset form fields
      setFullName('');
      setEmail('');
      setPhone('');
      setSubject('General');
      setMessage('');
    } catch (err: any) {
      console.error('Failed to submit contact form:', err);
      setError(err.message || 'Failed to submit message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-12 md:py-20 bg-slate-50 min-h-screen text-slate-800 relative overflow-hidden">
      {/* Ambient Aurora Orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-10 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <Container className="max-w-6xl space-y-12 relative z-10">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            Get in Touch
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-slate-900 tracking-tight">
            Connect With Rescue4paws
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Have questions about our adoption process, volunteer programs, foster opportunities, or need assistance? Our coordination team is here to help.
          </p>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Form Column */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-10 border border-slate-200/80 rounded-3xl shadow-xl">
            {submitSuccess ? (
              <div className="py-12 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs mb-2">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-display text-2xl font-bold text-slate-900">
                  Message Dispatched Successfully
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out to Rescue4paws. A dedicated coordinator will review your note and respond within 24 business hours.
                </p>
                <Button 
                  onClick={() => setSubmitSuccess(false)}
                  variant="secondary"
                  className="rounded-full px-6 py-2.5 text-xs font-semibold"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-display text-xl font-bold text-slate-900">
                    Send Us a Message
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Fill in the details below and we'll route your inquiry to the appropriate department.
                  </p>
                </div>

                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold uppercase tracking-wider text-rose-900 block">Notice</span>
                      <p className="leading-relaxed">{error}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name *"
                    placeholder="e.g. Jane Doe"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={submitting}
                  />

                  <Input
                    label="Email Address *"
                    placeholder="e.g. jane@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number (Optional)"
                    placeholder="e.g. +1 (555) 019-2834"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={submitting}
                  />

                  <Select
                    label="Topic / Department *"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={submitting}
                    options={[
                      { value: 'General Inquiry', label: 'General Inquiry' },
                      { value: 'Adoption Question', label: 'Adoption Question' },
                      { value: 'Volunteer Inquiry', label: 'Volunteer Inquiry' },
                      { value: 'Fostering Inquiry', label: 'Fostering Inquiry' },
                      { value: 'Donation & Sponsorship', label: 'Donation & Sponsorship' }
                    ]}
                  />
                </div>

                <Textarea
                  label="Message *"
                  placeholder="Tell us how we can assist you..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  required
                  disabled={submitting}
                />

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto font-bold text-xs uppercase tracking-wider py-4 px-8 rounded-full shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Contact Info Column */}
          <div className="lg:col-span-5 space-y-6">
            {/* Display Info Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <h3 className="font-display text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Contact Directory
              </h3>

              {loadingInfo ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2.5">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-mono">
                    Loading directory...
                  </span>
                </div>
              ) : (
                <div className="space-y-5 text-sm">
                  {/* Phone Item */}
                  <div className="flex gap-4 items-start">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                        Direct Phone
                      </span>
                      <span className="font-bold text-slate-900 block text-base">
                        {contactInfo.phone}
                      </span>
                    </div>
                  </div>

                  {/* Email Item */}
                  <div className="flex gap-4 items-start">
                    <div className="p-3 bg-sky-50 border border-sky-100 rounded-2xl text-sky-600 shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                        Support Email
                      </span>
                      <a 
                        href={`mailto:${contactInfo.email}`} 
                        className="font-bold text-indigo-600 hover:text-indigo-700 block text-base break-all transition-colors"
                      >
                        {contactInfo.email}
                      </a>
                    </div>
                  </div>

                  {/* Address Item */}
                  <div className="flex gap-4 items-start">
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                        Headquarters & Intake Center
                      </span>
                      <span className="font-semibold text-slate-900 block text-base leading-relaxed">
                        {contactInfo.address}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Operating Hours Card */}
            <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-display text-base font-bold text-white">
                  Volunteer Operations Hours
                </h3>
              </div>

              <div className="text-xs space-y-3 text-slate-400 leading-relaxed relative">
                <p>
                  Rescue4paws is supported by licensed veterinarians and dedicated foster networks. Inquiries are reviewed during operating windows:
                </p>
                <div className="grid grid-cols-2 gap-y-2 text-xs pt-1">
                  <span className="font-semibold text-white">Monday – Friday:</span>
                  <span className="font-mono text-slate-300">9:00 AM – 5:00 PM EST</span>
                  <span className="font-semibold text-white">Saturday – Sunday:</span>
                  <span className="font-mono text-slate-300">10:00 AM – 2:00 PM EST</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                  Active transport tracking updates operate 24/7 via the real-time logistics portal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Contact;
