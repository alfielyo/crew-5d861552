import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PageShell from "@/components/PageShell";
import ProgressBar from "@/components/ProgressBar";
import PillOption from "@/components/PillOption";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const INTERESTS = [
  "Reading",
  "Music",
  "Cooking",
  "Socialising",
  "Education",
  "Technology",
  "Gaming",
  "Photography",
  "Fitness",
  "Self Improvement",
  "Politics",
  "Entrepreneurship",
];

type PersonalityQuestion = {
  q: string;
  options: string[];
  multi?: boolean;
};

const PERSONALITY_QUESTIONS: PersonalityQuestion[] = [
  { q: "How do you usually connect with people?", options: ["I ask questions", "I share stories", "I listen"] },
  {
    q: "What makes a conversation meaningful to you?",
    options: ["Talking about life", "Finding common ground", "Exploring big ideas"],
  },
  { q: "I like to spend more time…", options: ["In the city", "In nature", "At home"] },
  {
    q: "What kind of people do you like to meet?",
    options: ["Creatives", "Artists & Musicians", "Entrepreneurs & Founders", "Sporty types", "Techies"],
    multi: true,
  },
  { q: "Do you enjoy politically incorrect humour?", options: ["Yes", "No"] },
  { q: "Do you enjoy discussing politics/news?", options: ["Yes", "No"] },
  {
    q: "What is your training style?",
    options: ["Keep it casual", "I like to push myself", "I like to break the limits"],
  },
];

const GENDER_OPTIONS = ["Man", "Woman"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const TOTAL_STEPS = 13; // 1-4 profile + 5 interests + 6-12 personality + 13 final

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
  const [personalityAnswers, setPersonalityAnswers] = useState<Record<string, string | string[]>>({});
  const [saving, setSaving] = useState(false);

  const direction = 1;

  const slideVariants = {
    enter: { x: 40 * direction, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -40 * direction, opacity: 0 },
  };

  const canContinue = () => {
    switch (step) {
      case 1:
        return fullName.trim().length >= 2;
      case 2:
        return location.trim().length > 0;
      case 3:
        return gender !== "" && (gender !== "Other" || genderOther.trim().length > 0);
      case 4:
        return dobDay && dobMonth && dobYear;
      case 5:
        return selectedInterests.length >= 3;
      default:
        if (step >= 6 && step <= 12) {
          const qIndex = step - 6;
          const question = PERSONALITY_QUESTIONS[qIndex];
          const key = `q${qIndex + 1}`;
          const answer = personalityAnswers[key];
          if (question.multi) {
            return Array.isArray(answer) && answer.length > 0;
          }
          return !!answer;
        }
        return true;
    }
  };

  const handleSaveAndFinish = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Not logged in", description: "Please log in first.", variant: "destructive" });
        navigate("/login");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          fitness_level: location.trim(),
          phone: `${dobYear}-${dobMonth.padStart(2, "0")}-${dobDay.padStart(2, "0")}`,
          personality_answers: {
            gender: gender === "Other" ? genderOther : gender,
            interests: selectedInterests,
            ...personalityAnswers,
          },
          has_onboarded: true,
        })
        .eq("id", user.id);

      if (error) throw error;
      navigate(`/onboarding/${TOTAL_STEPS}`);
    } catch (err: any) {
      toast({ title: "Error saving profile", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (step === TOTAL_STEPS) {
      navigate("/home");
      return;
    }
    // Save on last personality question (step 12)
    if (step === 12) {
      handleSaveAndFinish();
      return;
    }
    navigate(`/onboarding/${step + 1}`);
  };

  const handleBack = () => {
    if (step > 1) navigate(`/onboarding/${step - 1}`);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) return prev.filter((i) => i !== interest);
      return [...prev, interest];
    });
  };

  const toggleMultiAnswer = (key: string, option: string) => {
    setPersonalityAnswers((prev) => {
      const current = (prev[key] as string[]) || [];
      if (current.includes(option)) {
        return { ...prev, [key]: current.filter((o) => o !== option) };
      }
      return { ...prev, [key]: [...current, option] };
    });
  };

  const renderStep = () => {
    // Final step
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
          <h1 className="font-serif text-3xl">You're all set{fullName ? `, ${fullName.split(" ")[0]}` : ""} 👋</h1>
          <p className="mt-3 text-muted-foreground">Time to find your crew.</p>
        </div>
      );
    }

    // Personality questions (steps 6-12)
    if (step >= 6 && step <= 12) {
      const qIndex = step - 6;
      const question = PERSONALITY_QUESTIONS[qIndex];
      const key = `q${qIndex + 1}`;

      if (question.multi) {
        const selected = (personalityAnswers[key] as string[]) || [];
        return (
          <div>
            <h1 className="font-serif text-2xl">{question.q}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Select all that apply</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {question.options.map((option) => (
                <PillOption
                  key={option}
                  selected={selected.includes(option)}
                  onClick={() => toggleMultiAnswer(key, option)}
                >
                  {option}
                </PillOption>
              ))}
            </div>
          </div>
        );
      }

      return (
        <div>
          <h1 className="font-serif text-2xl">{question.q}</h1>
          <div className="mt-8 flex flex-wrap gap-3">
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
            <h1 className="font-serif text-2xl">What's your name?</h1>
            <p className="mt-2 text-sm text-muted-foreground">First and last name</p>
            <Input
              autoFocus
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-6 border-border bg-secondary text-lg"
              placeholder="e.g. Alex Johnson"
            />
          </div>
        );
      case 2:
        return (
          <div>
            <h1 className="font-serif text-2xl">Where in London are you?</h1>
            <p className="mt-2 text-sm text-muted-foreground">Your neighbourhood or area</p>
            <Input
              autoFocus
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-6 border-border bg-secondary text-lg"
              placeholder="e.g. Clapham"
            />
          </div>
        );
      case 3:
        return (
          <div>
            <h1 className="font-serif text-2xl">Select your gender?</h1>
            <div className="mt-8 flex flex-wrap gap-3">
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
                placeholder="Select your gender."
              />
            )}
          </div>
        );
      case 4:
        return (
          <div>
            <h1 className="font-serif text-2xl">When were you born?</h1>
            <p className="mt-2 text-sm text-muted-foreground">You must be 18 or older</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <select
                value={dobDay}
                onChange={(e) => setDobDay(e.target.value)}
                className="rounded-lg border border-border bg-secondary px-3 py-3 text-foreground"
              >
                <option value="">Day</option>
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1)}>
                    {i + 1}
                  </option>
                ))}
              </select>
              <select
                value={dobMonth}
                onChange={(e) => setDobMonth(e.target.value)}
                className="rounded-lg border border-border bg-secondary px-3 py-3 text-foreground"
              >
                <option value="">Month</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={String(i + 1)}>
                    {m.slice(0, 3)}
                  </option>
                ))}
              </select>
              <select
                value={dobYear}
                onChange={(e) => setDobYear(e.target.value)}
                className="rounded-lg border border-border bg-secondary px-3 py-3 text-foreground"
              >
                <option value="">Year</option>
                {Array.from({ length: 60 }, (_, i) => {
                  const year = new Date().getFullYear() - 18 - i;
                  return (
                    <option key={year} value={String(year)}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        );
      case 5:
        return (
          <div>
            <h1 className="font-serif text-2xl">Select at least 3 interests</h1>
            <p className="mt-2 text-sm text-muted-foreground">{selectedInterests.length} selected</p>
            <div className="mt-6 flex flex-wrap gap-2.5">
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
    <PageShell className="flex flex-col px-6 py-8">
      {step < TOTAL_STEPS && (
        <div className="mb-6">
          {step > 1 && (
            <button onClick={handleBack} className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
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

      <div className="mt-8">
        <Button
          onClick={handleNext}
          disabled={!canContinue() || saving}
          className="w-full bg-primary py-6 text-base font-semibold text-primary-foreground disabled:opacity-40"
        >
          {saving ? "Saving…" : step === TOTAL_STEPS ? "Book This Week's Run" : "Continue"}
        </Button>
      </div>
    </PageShell>
  );
};

export default Onboarding;
