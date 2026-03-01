import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PageShell from "@/components/PageShell";
import ProgressBar from "@/components/ProgressBar";
import PillOption from "@/components/PillOption";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check } from "lucide-react";

const INTERESTS = [
  "Running", "Fitness", "Food & Drink", "Travel", "Music", "Art",
  "Film", "Books", "Wellness", "Coffee", "Sport", "Nature", "Tech", "Gaming", "Fashion",
];

const PERSONALITY_QUESTIONS = [
  { q: "How do you usually spend a Friday evening?", options: ["At home", "Small gathering", "Big night out", "Depends on mood"] },
  { q: "What's your social energy like?", options: ["Introvert", "Ambivert", "Extrovert"] },
  { q: "How spontaneous are you?", options: ["Very planned", "Mostly planned", "Goes with the flow", "Totally spontaneous"] },
  { q: "What kind of run pace suits you?", options: ["Slow & chatty", "Moderate", "Fast & focused", "Mix it up"] },
  { q: "What motivates you to join a group run?", options: ["Meet people", "Fitness", "Accountability", "All of the above"] },
  { q: "Best way to describe your vibe?", options: ["Laid-back", "Energetic", "Thoughtful", "Adventurous"] },
  { q: "How do you feel in new social situations?", options: ["Nervous but excited", "Totally at ease", "Takes a bit of time", "Depends"] },
  { q: "What do you want from CREW?", options: ["Friends", "Fitness", "Fun", "All three"] },
];

const GENDER_OPTIONS = ["Man", "Woman", "Non-binary", "Prefer not to say", "Other"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const TOTAL_STEPS = 14;

const Onboarding = () => {
  const navigate = useNavigate();
  const { step: stepParam } = useParams();
  const step = parseInt(stepParam || "1");

  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [gender, setGender] = useState("");
  const [genderOther, setGenderOther] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [personalityAnswers, setPersonalityAnswers] = useState<Record<string, string>>({});

  const direction = 1;

  const slideVariants = {
    enter: { x: 40 * direction, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -40 * direction, opacity: 0 },
  };

  const canContinue = () => {
    switch (step) {
      case 1: return fullName.trim().length >= 2;
      case 2: return location.trim().length > 0;
      case 3: return gender !== "" && (gender !== "Other" || genderOther.trim().length > 0);
      case 4: return dobDay && dobMonth && dobYear;
      case 5: return selectedInterests.length === 5;
      default:
        if (step >= 6 && step <= 13) return !!personalityAnswers[`q${step - 5}`];
        return true;
    }
  };

  const handleNext = () => {
    if (step === TOTAL_STEPS) {
      navigate("/home");
    } else {
      navigate(`/onboarding/${step + 1}`);
    }
  };

  const handleBack = () => {
    if (step > 1) navigate(`/onboarding/${step - 1}`);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) return prev.filter((i) => i !== interest);
      if (prev.length >= 5) return prev;
      return [...prev, interest];
    });
  };

  const renderStep = () => {
    if (step === TOTAL_STEPS) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent"
          >
            <Check size={36} className="text-accent-foreground" />
          </motion.div>
          <h1 className="font-serif">You're all set{fullName ? `, ${fullName.split(" ")[0]}` : ""} 👋</h1>
          <p className="mt-3 text-muted-foreground">Time to find your crew.</p>
        </div>
      );
    }

    if (step >= 6 && step <= 13) {
      const qIndex = step - 6;
      const question = PERSONALITY_QUESTIONS[qIndex];
      const key = `q${step - 5}`;
      return (
        <div>
          <h2 className="font-serif">{question.q}</h2>
          <div className="mt-6 flex flex-wrap gap-2.5 sm:mt-8 sm:gap-3">
            {question.options.map((option) => (
              <PillOption
                key={option}
                selected={personalityAnswers[key] === option}
                onClick={() => setPersonalityAnswers({ ...personalityAnswers, [key]: option })}
              >
                {option}
              </PillOption>
            ))}
          </div>
        </div>
      );
    }

    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="font-serif">What's your name?</h2>
            <p className="mt-2 text-sm text-muted-foreground">First and last name</p>
            <Input
              autoFocus
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-5 border-border bg-secondary text-base sm:text-lg"
              placeholder="e.g. Alex Johnson"
            />
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="font-serif">Where in London are you?</h2>
            <p className="mt-2 text-sm text-muted-foreground">Your neighbourhood or area</p>
            <Input
              autoFocus
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-5 border-border bg-secondary text-base sm:text-lg"
              placeholder="e.g. Clapham"
            />
          </div>
        );
      case 3:
        return (
          <div>
            <h2 className="font-serif">How do you identify?</h2>
            <div className="mt-6 flex flex-wrap gap-2.5 sm:gap-3">
              {GENDER_OPTIONS.map((g) => (
                <PillOption key={g} selected={gender === g} onClick={() => setGender(g)}>
                  {g}
                </PillOption>
              ))}
            </div>
            {gender === "Other" && (
              <Input
                autoFocus
                value={genderOther}
                onChange={(e) => setGenderOther(e.target.value)}
                className="mt-4 border-border bg-secondary"
                placeholder="How do you identify?"
              />
            )}
          </div>
        );
      case 4:
        return (
          <div>
            <h2 className="font-serif">When were you born?</h2>
            <p className="mt-2 text-sm text-muted-foreground">You must be 18 or older</p>
            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
              <select value={dobDay} onChange={(e) => setDobDay(e.target.value)}
                className="min-h-[2.75rem] rounded-lg border border-border bg-secondary px-2 py-2.5 text-foreground sm:px-3 sm:py-3">
                <option value="">Day</option>
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                ))}
              </select>
              <select value={dobMonth} onChange={(e) => setDobMonth(e.target.value)}
                className="min-h-[2.75rem] rounded-lg border border-border bg-secondary px-2 py-2.5 text-foreground sm:px-3 sm:py-3">
                <option value="">Month</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={String(i + 1)}>{m.slice(0, 3)}</option>
                ))}
              </select>
              <select value={dobYear} onChange={(e) => setDobYear(e.target.value)}
                className="min-h-[2.75rem] rounded-lg border border-border bg-secondary px-2 py-2.5 text-foreground sm:px-3 sm:py-3">
                <option value="">Year</option>
                {Array.from({ length: 60 }, (_, i) => {
                  const year = new Date().getFullYear() - 18 - i;
                  return <option key={year} value={String(year)}>{year}</option>;
                })}
              </select>
            </div>
          </div>
        );
      case 5:
        return (
          <div>
            <h2 className="font-serif">Pick 5 interests</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedInterests.length} / 5 selected
            </p>
            <div className="mt-5 flex flex-wrap gap-2 sm:gap-2.5">
              {INTERESTS.map((interest) => (
                <PillOption
                  key={interest}
                  selected={selectedInterests.includes(interest)}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </PillOption>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <PageShell className="flex flex-col px-5 py-6 sm:px-8 lg:mx-auto lg:max-w-lg lg:py-10">
      {step < TOTAL_STEPS && (
        <div className="mb-5">
          {step > 1 && (
            <button onClick={handleBack} className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <ProgressBar current={step} total={TOTAL_STEPS - 1} />
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="flex flex-1 flex-col"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 sm:mt-8">
        <Button
          onClick={handleNext}
          disabled={!canContinue()}
          className="w-full bg-primary py-6 text-base font-semibold text-primary-foreground disabled:opacity-40"
        >
          {step === TOTAL_STEPS ? "Book This Week's Run" : "Continue"}
        </Button>
      </div>
    </PageShell>
  );
};

export default Onboarding;
