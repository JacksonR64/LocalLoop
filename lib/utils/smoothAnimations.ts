/**
 * Smooth Animation Utilities
 * Provides modular, reusable animation functions with natural easing
 */

export interface AnimationConfig {
  duration?: number;
  easing?: EasingFunction;
  delay?: number;
  onComplete?: () => void;
  onUpdate?: (progress: number) => void;
}

export type EasingFunction = (t: number) => number;

/**
 * Spring-based easing function that provides natural deceleration
 * Based on spring physics with customizable tension and friction
 */
export function createSpringEasing(tension: number = 300, friction: number = 30): EasingFunction {
  return (t: number) => {
    // Spring physics calculation
    const w = Math.sqrt(tension);
    const zeta = friction / (2 * Math.sqrt(tension));
    
    if (zeta < 1) {
      // Under-damped spring (with slight bounce)
      const wd = w * Math.sqrt(1 - zeta * zeta);
      const A = 1;
      const B = (zeta * w) / wd;
      return 1 - Math.exp(-zeta * w * t) * (A * Math.cos(wd * t) + B * Math.sin(wd * t));
    } else {
      // Over-damped spring (no bounce, smooth deceleration)
      return 1 - Math.exp(-w * t) * (1 + w * t);
    }
  };
}

/**
 * Enhanced ease-out cubic with momentum tail
 * Provides smooth deceleration without abrupt stopping
 */
export const easings = {
  // Smooth ease-out with gradual momentum loss
  smoothEaseOut: (t: number) => {
    const base = 1 - Math.pow(1 - t, 3);
    // Add momentum tail for the last 20% of animation
    if (t > 0.8) {
      const tailProgress = (t - 0.8) / 0.2;
      const momentumReduction = Math.exp(-tailProgress * 4); // Exponential decay
      return base * (0.9 + 0.1 * momentumReduction);
    }
    return base;
  },

  // Natural spring easing (balanced)
  spring: createSpringEasing(280, 28),

  // Gentle spring (less bounce, more momentum)
  springGentle: createSpringEasing(200, 26),

  // iOS-style momentum easing
  momentum: (t: number) => {
    // Cubic bezier approximation of iOS momentum scrolling
    const p1 = 0.25, p3 = 0.25, p4 = 1;
    return 3 * Math.pow(1 - t, 2) * t * p1 + 
           3 * (1 - t) * Math.pow(t, 2) * p3 + 
           Math.pow(t, 3) * p4;
  },

  // Ultra-smooth deceleration
  decelerate: (t: number) => {
    // Combination of ease-out and exponential decay
    const easeOut = 1 - Math.pow(1 - t, 2);
    const decay = 1 - Math.exp(-t * 3);
    return Math.min(easeOut, decay);
  }
};

/**
 * Smooth scroll animation with momentum and natural deceleration
 */
export function animateSmooth(
  startValue: number,
  endValue: number,
  config: AnimationConfig & { delay?: number } = {}
): Promise<void> {
  const {
    duration = 400,
    easing = easings.springGentle,
    delay = 0,
    onComplete,
    onUpdate
  } = config;

  return new Promise((resolve) => {
    let startTime: number | null = null;
    let animationId: number;
    let delayStartTime: number | null = null;

    const animate = (timestamp: number) => {
      // Handle delay
      if (delay > 0) {
        if (!delayStartTime) delayStartTime = timestamp;
        const delayElapsed = timestamp - delayStartTime;
        
        if (delayElapsed < delay) {
          animationId = requestAnimationFrame(animate);
          return;
        }
        
        // Delay completed, reset for main animation
        if (!startTime) startTime = timestamp;
      } else {
        if (!startTime) startTime = timestamp;
      }
      
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Apply easing function
      const easedProgress = easing(progress);
      
      // Update callback
      if (onUpdate) {
        onUpdate(easedProgress);
      }

      // Continue animation or complete
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        if (onComplete) onComplete();
        resolve();
      }
    };

    animationId = requestAnimationFrame(animate);

    // Return cleanup function (though Promise doesn't expose it)
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  });
}

/**
 * Smooth scroll to position with momentum
 */
export function smoothScrollTo(
  targetPosition: number,
  config: AnimationConfig = {}
): Promise<void> {
  const startPosition = window.pageYOffset || document.documentElement.scrollTop;
  
  return animateSmooth(startPosition, targetPosition, {
    ...config,
    easing: config.easing || easings.momentum,
    delay: config.delay,
    onUpdate: (progress) => {
      const currentPosition = startPosition + ((targetPosition - startPosition) * progress);
      window.scrollTo(0, currentPosition);
      config.onUpdate?.(progress);
    }
  });
}

/**
 * Synchronized animation that matches another element's movement
 * Useful for coordinating multiple animations
 */
export function createSynchronizedAnimation(
  config: AnimationConfig & {
    onSync: (progress: number, easedProgress: number) => void;
  }
): Promise<void> {
  const { onSync, ...animationConfig } = config;
  
  return animateSmooth(0, 1, {
    ...animationConfig,
    onUpdate: (easedProgress) => {
      // Calculate linear progress for synchronization
      const linearProgress = easedProgress; // This could be calculated differently if needed
      onSync(linearProgress, easedProgress);
      animationConfig.onUpdate?.(easedProgress);
    }
  });
}

/**
 * Calculate optimal scroll target with intelligent offset handling
 */
export function calculateScrollTarget(
  elementHeight: number,
  currentScrollTop: number,
  options: {
    navHeight?: number;
    bufferZone?: number;
    minScroll?: number;
    maxReduction?: number;
  } = {}
): number {
  const {
    navHeight = 64,
    bufferZone = 20,
    minScroll = 0,
    maxReduction = 0.8
  } = options;

  // Only scroll if we're significantly past the navigation
  if (currentScrollTop <= navHeight + bufferZone) {
    return currentScrollTop; // Don't scroll if we're already near the top
  }

  // Calculate base target
  const baseReduction = Math.min(elementHeight, currentScrollTop * maxReduction);
  const targetScrollTop = Math.max(minScroll, currentScrollTop - baseReduction);
  
  return targetScrollTop;
}

/**
 * Animation presets for common UI scenarios
 */
export const animationPresets = {
  // Search bar closing - synchronized with UI element
  searchClose: {
    duration: 600, // Increased from 350ms to 600ms for slower animation
    easing: easings.momentum,
  },
  
  // Content navigation - scrolling to results
  contentNavigation: {
    duration: 700, // Increased from 400ms to 700ms for slower animation
    easing: easings.smoothEaseOut,
  },
  
  // Quick interactions - button clicks, toggles
  interaction: {
    duration: 400, // Increased from 250ms
    easing: easings.spring,
  },
  
  // Page transitions - major view changes
  pageTransition: {
    duration: 800, // Increased from 500ms
    easing: easings.springGentle,
  },
  
  // Micro-interactions - hover states, focus changes
  micro: {
    duration: 250, // Increased from 150ms
    easing: easings.decelerate,
  }
};

/**
 * Smart scroll function that adapts animation based on distance
 */
export function adaptiveScrollTo(
  targetPosition: number,
  options: {
    minDuration?: number;
    maxDuration?: number;
    distanceMultiplier?: number;
    baseEasing?: EasingFunction;
  } = {}
): Promise<void> {
  const {
    minDuration = 250,
    maxDuration = 600,
    distanceMultiplier = 0.5,
    baseEasing = easings.momentum
  } = options;

  const startPosition = window.pageYOffset || document.documentElement.scrollTop;
  const distance = Math.abs(targetPosition - startPosition);
  
  // Calculate adaptive duration based on scroll distance
  const adaptiveDuration = Math.min(
    Math.max(minDuration, distance * distanceMultiplier),
    maxDuration
  );

  return smoothScrollTo(targetPosition, {
    duration: adaptiveDuration,
    easing: baseEasing,
  });
}