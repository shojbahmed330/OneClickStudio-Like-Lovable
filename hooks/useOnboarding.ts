
import { useState, useEffect, useRef } from 'react';
import { User } from '../types';

export const useOnboarding = (user: User | null) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const onboardingCheckedRef = useRef(false);

  useEffect(() => {
    if (user && !onboardingCheckedRef.current) {
      const isDone = localStorage.getItem(`onboarding_done_${user.id}`);
      if (!isDone) setShowOnboarding(true);
      onboardingCheckedRef.current = true;
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    if (user) localStorage.setItem(`onboarding_done_${user.id}`, 'true');
    setShowOnboarding(false);
  };

  return { showOnboarding, handleOnboardingComplete };
};
