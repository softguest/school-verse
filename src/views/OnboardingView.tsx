import React, { useEffect, useState } from 'react';
import { GraduationCap, ArrowRight, ArrowLeft, Check, Sparkles, School, Search, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { School as SchoolType } from '../types/index.ts';
import { api } from '../lib/api.ts';

interface OnboardingViewProps {
  onComplete: () => void;
}

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=sarah',
  'https://api.dicebear.com/7.x/bottts/svg?seed=emmanuel',
  'https://api.dicebear.com/7.x/bottts/svg?seed=grace',
  'https://api.dicebear.com/7.x/bottts/svg?seed=michael',
  'https://api.dicebear.com/7.x/bottts/svg?seed=amina',
  'https://api.dicebear.com/7.x/bottts/svg?seed=kofi',
  'https://api.dicebear.com/7.x/bottts/svg?seed=chidi',
  'https://api.dicebear.com/7.x/bottts/svg?seed=tariq',
];

const COUNTRIES = [
  { code: 'CM', name: 'Cameroon (Default)' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'GH', name: 'Ghana' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'SN', name: 'Senegal' },
  { code: 'CI', name: 'Côte d’Ivoire' },
];

const CAMEROON_REGIONS = [
  'South West',
  'North West',
  'Centre',
  'Littoral',
  'West',
  'Adamawa',
  'Far North',
  'North',
  'East',
  'South',
];

const GRADES = [
  'Form 1 (Grade 6)',
  'Form 2 (Grade 7)',
  'Form 3 (Grade 8)',
  'Form 4 (Grade 9)',
  'Form 5 (Grade 10)',
  'Lower Sixth (Grade 11)',
  'Upper Sixth (Grade 12)',
];

const INTERESTS = [
  'Mathematics',
  'Science',
  'Technology',
  'Coding',
  'Entrepreneurship',
  'Agriculture',
  'Sports',
  'Arts & Design',
  'Reading & Literature',
  'Leadership',
];

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0]);
  const [country, setCountry] = useState('Cameroon');
  const [region, setRegion] = useState('South West');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [grade, setGrade] = useState('Upper Sixth (Grade 12)');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Mathematics', 'Science']);
  const [bio, setBio] = useState('Eager learner ready to conquer academic missions on SchoolVerse.');

  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [searchSchool, setSearchSchool] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getSchools().then((data) => {
      setSchools(data);
      if (data.length > 0) setSelectedSchoolId(data[0].id);
    });
  }, []);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 2) {
      if (!displayName.trim() || displayName.length < 2) {
        setErrorMsg('Please enter a display name (at least 2 characters).');
        return;
      }
      if (!username.trim() || username.length < 3) {
        setErrorMsg('Please enter a valid username (at least 3 alphanumeric characters).');
        return;
      }
    }
    if (step === 5 && !selectedSchoolId) {
      setErrorMsg('Please select your school to represent them in competitions.');
      return;
    }
    if (step === 7 && selectedInterests.length === 0) {
      setErrorMsg('Please select at least one interest.');
      return;
    }

    if (step < 8) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (step > 1) setStep((s) => s - 1);
  };

  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await api.registerStudent({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        avatar,
        schoolId: selectedSchoolId,
        grade,
        country,
        region,
        interests: selectedInterests,
        bio,
      });

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
      });

      onComplete();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(searchSchool.toLowerCase()) ||
      s.code.toLowerCase().includes(searchSchool.toLowerCase()) ||
      s.city.toLowerCase().includes(searchSchool.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 py-12">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-amber-400">Step {step} of 8</span>
            <span>
              {step === 1 && 'Welcome'}
              {step === 2 && 'Student Identity'}
              {step === 3 && 'Country'}
              {step === 4 && 'Region'}
              {step === 5 && 'School Selection'}
              {step === 6 && 'Class & Grade'}
              {step === 7 && 'Interests'}
              {step === 8 && 'Journey Begins'}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-300 rounded-full"
              style={{ width: `${(step / 8) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center space-y-4 py-4">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg">
              <GraduationCap className="h-9 w-9" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Welcome to SchoolVerse
            </h1>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Step into your digital school world. Complete academic missions, earn XP, unlock scholarships, defend your school in national battles, and connect with fellow students across the continent.
            </p>
            <div className="pt-2 text-xs text-slate-400 flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Safe student community · Verified academic rewards</span>
            </div>
          </div>
        )}

        {/* Step 2: Student Identity */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Create Your Student Identity</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose how classmates and teachers will identify you on SchoolVerse.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Sarah Njie"
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Username</label>
                <div className="relative mt-1">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="sarah_n"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 mb-2 block">Choose Your Avatar</label>
                <div className="grid grid-cols-4 gap-3">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                        avatar === av
                          ? 'border-amber-400 bg-amber-500/10'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                      }`}
                    >
                      <img src={av} alt="Avatar" className="h-10 w-10 rounded-full" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Select Country */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Select Your Country</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Default Cameroon, but students join from across Africa and beyond.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {COUNTRIES.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setCountry(c.name)}
                  className={`p-3 text-left rounded-xl border text-xs font-medium transition-all ${
                    country === c.name
                      ? 'border-amber-400 bg-amber-500/10 text-white font-semibold'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Select Region */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Select Your Region</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Connect with regional inter-school rankings and academic events.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {CAMEROON_REGIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegion(r)}
                  className={`p-3 text-left rounded-xl border text-xs font-medium transition-all ${
                    region === r
                      ? 'border-amber-400 bg-amber-500/10 text-white font-semibold'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Select School */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Select Your School</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Search and join your school's official roster to contribute points to school battles.
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchSchool}
                onChange={(e) => setSearchSchool(e.target.value)}
                placeholder="Search school by name, code or city..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {filteredSchools.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSchoolId(s.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                    selectedSchoolId === s.id
                      ? 'border-amber-400 bg-amber-500/10 text-white font-semibold'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold text-white">{s.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {s.city}, {s.region} · Code: {s.code}
                    </div>
                  </div>
                  <div className="text-xs text-amber-400 font-mono tabular-nums">
                    {s.points} pts
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Grade / Class */}
        {step === 6 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Select Your Class / Grade</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enables grade-appropriate academic missions and class leaderboards.
              </p>
            </div>

            <div className="space-y-2">
              {GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all ${
                    grade === g
                      ? 'border-amber-400 bg-amber-500/10 text-white font-semibold'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Interests */}
        {step === 7 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Choose Your Academic Interests</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Personalizes your mission recommendations and peer matching.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {INTERESTS.map((item) => {
                const isSelected = selectedInterests.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInterest(item)}
                    className={`p-3 text-left rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/10 text-white font-semibold'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300'
                    }`}
                  >
                    <span>{item}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 8: Welcome / First Day */}
        {step === 8 && (
          <div className="text-center space-y-5 py-4">
            <div className="text-5xl">🎒</div>
            <h2 className="text-2xl font-bold text-white">
              Your SchoolVerse Journey Begins
            </h2>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Welcome, <span className="text-amber-400 font-semibold">{displayName}</span>! You have joined{' '}
              <span className="text-white font-medium">
                {schools.find((s) => s.id === selectedSchoolId)?.name}
              </span>.
            </p>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 max-w-sm mx-auto space-y-3">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Starting Rewards
              </div>
              <div className="flex items-center justify-center gap-6">
                <div>
                  <div className="text-2xl font-bold text-amber-400 font-mono">+100</div>
                  <div className="text-xs text-slate-400">Starting XP</div>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div>
                  <div className="text-2xl font-bold text-emerald-400 font-mono">+20</div>
                  <div className="text-xs text-slate-400">School Points</div>
                </div>
              </div>
              <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 flex items-center justify-center gap-2">
                <span>Starter Badge Unlocked:</span>
                <span className="font-bold">🎒 First Day</span>
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
            {errorMsg}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          {step > 1 && step < 8 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 8 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-sm"
            >
              Next Step
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinishOnboarding}
              className="w-full py-3 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Entering Campus...' : 'Enter SchoolVerse Campus'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
