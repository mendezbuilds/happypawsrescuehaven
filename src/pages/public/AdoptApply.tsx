import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import supabase from '../../lib/supabase';
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import { ArrowLeft, CheckCircle2, AlertTriangle, Loader2, Upload, FileText, ShieldCheck, Sparkles, Heart } from 'lucide-react';

// Zod Validation Schema
const schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(6, 'Phone number must be at least 6 characters'),
  address: z.string().min(5, 'Please enter your complete address'),
  housingType: z.enum(['House', 'Apartment', 'Condo', 'Other']),
  hasOtherPets: z.boolean(),
  experienceDetails: z.string().min(10, 'Please describe your pet care experience (min 10 characters)'),
  ageConfirmed: z.boolean().refine(val => val === true, {
    message: 'You must confirm that you are at least 18 years old',
  }),
});

type FormValues = z.infer<typeof schema>;

export const AdoptApply: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [pet, setPet] = useState<{ name: string; status: string } | null>(null);
  const [loadingPet, setLoadingPet] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [selectedIdFile, setSelectedIdFile] = useState<File | null>(null);
  const [idFileError, setIdFileError] = useState<string | null>(null);
  const [idPreviewUrl, setIdPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (idPreviewUrl) {
        URL.revokeObjectURL(idPreviewUrl);
      }
    };
  }, [idPreviewUrl]);

  const handleClearIdFile = () => {
    setSelectedIdFile(null);
    setIdFileError(null);
    if (idPreviewUrl) {
      URL.revokeObjectURL(idPreviewUrl);
      setIdPreviewUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setIdFileError(null);

    if (idPreviewUrl) {
      URL.revokeObjectURL(idPreviewUrl);
      setIdPreviewUrl(null);
    }

    if (!file) {
      setSelectedIdFile(null);
      return;
    }

    // Validate size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setIdFileError('File size must be less than 5MB');
      setSelectedIdFile(null);
      return;
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'heic', 'pdf'];

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
      setIdFileError('Unsupported file format. Please upload JPG, PNG, HEIC, or PDF.');
      setSelectedIdFile(null);
      return;
    }

    setSelectedIdFile(file);

    // Image preview
    if (file.type.startsWith('image/') && fileExtension !== 'heic') {
      try {
        const url = URL.createObjectURL(file);
        setIdPreviewUrl(url);
      } catch (err) {
        console.error('Failed to create object URL:', err);
      }
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      housingType: 'House',
      hasOtherPets: false,
      ageConfirmed: false,
    },
  });

  const hasOtherPetsVal = watch('hasOtherPets');

  useEffect(() => {
    const fetchPet = async () => {
      if (!id) return;
      try {
        setLoadingPet(true);
        const { data, error } = await supabase
          .from('pets')
          .select('name, status')
          .eq('id', id)
          .single();

        if (error) throw error;
        setPet(data);
      } catch (err: any) {
        console.error('Error fetching pet:', err);
        setSubmitError('Failed to load pet details.');
      } finally {
        setLoadingPet(false);
      }
    };

    fetchPet();
  }, [id]);

  const onSubmit = async (values: FormValues) => {
    if (!id) return;

    if (!selectedIdFile) {
      setIdFileError('A government-issued ID is required to complete your application.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      // Validate schema
      const validated = schema.parse(values);

      // Storage upload
      const fileExt = selectedIdFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const storagePath = `applications/${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('adopter-ids')
        .upload(storagePath, selectedIdFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('ID upload error:', uploadError);
        throw new Error('Failed to upload ID document. Please try again.');
      }

      // Step 1: Check existing adopter by email or insert
      const { data: existingAdopter } = await supabase
        .from('adopters')
        .select('id')
        .eq('email', validated.email)
        .maybeSingle();

      let confirmedAdopterId = existingAdopter?.id;

      if (!confirmedAdopterId) {
        const { data: newAdopter, error: insertAdopterError } = await supabase
          .from('adopters')
          .insert([
            {
              full_name: validated.fullName,
              email: validated.email,
              phone: validated.phone,
              address: validated.address,
              id_document_url: storagePath,
            }
          ])
          .select('id')
          .single();

        if (insertAdopterError) throw insertAdopterError;
        confirmedAdopterId = newAdopter.id;
      } else {
        // Update existing adopter ID record
        await supabase
          .from('adopters')
          .update({
            full_name: validated.fullName,
            phone: validated.phone,
            address: validated.address,
            id_document_url: storagePath,
          })
          .eq('id', confirmedAdopterId);
      }

      // Step 2: Insert into adoption_applications
      const { error: appError } = await supabase
        .from('adoption_applications')
        .insert([
          {
            pet_id: id,
            adopter_id: confirmedAdopterId,
            status: 'PENDING',
            housing_type: validated.housingType,
            has_other_pets: validated.hasOtherPets,
            experience_details: validated.experienceDetails,
          }
        ]);

      if (appError) {
        await supabase.storage.from('adopter-ids').remove([storagePath]);
        throw appError;
      }

      setSubmitSuccess(true);
    } catch (err: any) {
      console.error('Submission error:', err);
      setSubmitError(err.message || 'An error occurred during submission. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPet) {
    return (
      <div className="py-24 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold font-mono">Loading Pet Profile...</p>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="py-16 md:py-24 bg-slate-50 min-h-screen flex items-center relative overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <Container className="max-w-xl mx-auto relative z-10">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-6">
            <div className="inline-flex p-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wider font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-full inline-block">
                Application Received
              </span>
              <h2 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight">
                Application Submitted!
              </h2>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Thank you! Your adoption application for <strong className="text-slate-900 font-bold">{pet?.name}</strong> has been securely logged. Our placement coordinators review every application with care and will reach out within 24 to 48 hours.
            </p>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <Link
                to="/adopt"
                className="w-full bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-xs uppercase tracking-wider py-4 px-6 rounded-2xl shadow-lg shadow-indigo-600/25 transition-all text-center"
              >
                Browse Other Pets
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const housingOptions = [
    { value: 'House', label: 'Single Family Home' },
    { value: 'Apartment', label: 'Apartment' },
    { value: 'Condo', label: 'Condominium' },
    { value: 'Other', label: 'Other / Shared Housing' },
  ];

  return (
    <div className="py-12 md:py-20 bg-slate-50 min-h-screen text-slate-800 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-10 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <Container className="max-w-3xl space-y-6 relative z-10">
        <div>
          <Link
            to={`/adopt/${id}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-full border border-slate-200/80 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-600" /> Cancel & Back to {pet?.name || 'Pet Profile'}
          </Link>
        </div>

        {/* Application Form Container */}
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xl p-6 sm:p-10">
          
          {/* Form Header */}
          <div className="border-b border-slate-100 pb-6 mb-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Rescue4paws Adoption Application
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Adoption Application for {pet?.name}
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Please complete all sections. All personal information is securely encrypted and reviewed only by verified Rescue4paws coordinators.
            </p>
          </div>

          {submitError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs mb-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold uppercase tracking-wider text-rose-900 block">Notice</span>
                <p className="leading-relaxed">{submitError}</p>
              </div>
            </div>
          )}

          {/* Form Inputs */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Section 1: Adopter Contact Details */}
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-bold text-indigo-700 border-b border-slate-100 pb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 inline-flex items-center justify-center text-[10px]">1</span>
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  placeholder="e.g. John Doe"
                  error={errors.fullName?.message}
                  {...register('fullName')}
                />
                
                <Input
                  label="Email Address *"
                  type="email"
                  placeholder="e.g. john@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number *"
                  placeholder="e.g. +1 (555) 019-2834"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
                
                <Input
                  label="Home Address *"
                  placeholder="e.g. 123 Main St, Seattle, WA"
                  error={errors.address?.message}
                  {...register('address')}
                />
              </div>
            </div>

            {/* Section 2: ID Verification */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs uppercase tracking-wider font-bold text-indigo-700 border-b border-slate-100 pb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 inline-flex items-center justify-center text-[10px]">2</span>
                Government ID Verification
              </h3>
              
              <p className="text-xs text-slate-500 leading-relaxed -mt-1">
                Verifying identity ensures pet safety and keeps our community secure. Your ID is encrypted and never shared.
              </p>

              {/* File Dropzone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 select-none">
                  Upload Government ID (Driver's License, Passport, or State ID) *
                </label>
                
                <div className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all ${
                  selectedIdFile 
                    ? 'border-indigo-500 bg-indigo-50/40' 
                    : idFileError 
                    ? 'border-rose-300 bg-rose-50/30'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60'
                }`}>
                  {selectedIdFile ? (
                    <div className="text-center space-y-2">
                      {idPreviewUrl ? (
                        <div className="w-20 h-20 bg-white border border-slate-200 rounded-xl overflow-hidden mx-auto shadow-xs p-1">
                          <img src={idPreviewUrl} alt="ID Document preview" className="w-full h-full object-cover rounded-lg" />
                        </div>
                      ) : (
                        <FileText className="w-10 h-10 text-indigo-600 mx-auto" />
                      )}
                      <span className="text-xs font-bold text-slate-900 block truncate max-w-[250px] mx-auto">
                        {selectedIdFile.name}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-mono">
                        {(selectedIdFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                      <button
                        type="button"
                        onClick={handleClearIdFile}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 block mx-auto mt-1"
                      >
                        Remove Document
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 cursor-pointer relative py-2">
                      <Upload className="w-8 h-8 text-indigo-500 mx-auto" />
                      <span className="text-xs font-bold text-slate-800 block">Click or drag document to upload</span>
                      <span className="text-[11px] text-slate-400 block">PNG, JPG, HEIC, or PDF up to 5MB</span>
                      
                      <label className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                        <input 
                          type="file" 
                          accept="image/png, image/jpeg, image/jpg, image/heic, application/pdf"
                          onChange={handleFileChange}
                          required
                        />
                      </label>
                    </div>
                  )}
                </div>

                {idFileError && (
                  <span className="text-xs text-rose-600 font-medium pl-1">
                    {idFileError}
                  </span>
                )}
              </div>
            </div>

            {/* Section 3: Housing & Lifestyle */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs uppercase tracking-wider font-bold text-indigo-700 border-b border-slate-100 pb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 inline-flex items-center justify-center text-[10px]">3</span>
                Home & Living Environment
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                <Select
                  label="Housing Structure *"
                  options={housingOptions}
                  error={errors.housingType?.message}
                  {...register('housingType')}
                />

                {/* Has Other Pets Toggle */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-700 select-none">
                    Do you currently own other pets?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setValue('hasOtherPets', true)}
                      className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                        hasOtherPetsVal 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('hasOtherPets', false)}
                      className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                        !hasOtherPetsVal 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Care Assessment Details */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs uppercase tracking-wider font-bold text-indigo-700 border-b border-slate-100 pb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 inline-flex items-center justify-center text-[10px]">4</span>
                Experience & Care Routine
              </h3>
              
              <Textarea
                label="Care & Experience Details *"
                placeholder="Describe your pet experience, typical daily schedules, yard setup, and why you feel this companion is a great fit..."
                error={errors.experienceDetails?.message}
                {...register('experienceDetails')}
              />
            </div>

            {/* Age Confirmation Checkbox */}
            <div className="pt-2 flex flex-col gap-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="flex items-start gap-3 cursor-pointer select-none text-xs text-slate-700">
                <input
                  type="checkbox"
                  {...register('ageConfirmed')}
                  className="w-4.5 h-4.5 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="leading-relaxed">
                  <strong className="text-slate-900 block font-semibold">Age Declaration *</strong>
                  I confirm that I am at least 18 years of age and all information provided is accurate.
                </span>
              </label>
              {errors.ageConfirmed && (
                <span className="text-xs text-rose-600 font-medium pl-7">
                  {errors.ageConfirmed.message}
                </span>
              )}
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Zero application fees • Safe and confidential</span>
              </div>

              <Button
                type="submit"
                disabled={submitting || pet?.status.toUpperCase() !== 'AVAILABLE'}
                className="w-full sm:w-auto px-8 py-4 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  'Submit Adoption Application'
                )}
              </Button>
            </div>

          </form>
        </div>
      </Container>
    </div>
  );
};

export default AdoptApply;
