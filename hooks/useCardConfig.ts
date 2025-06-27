import { useMemo } from 'react';
import { 
    CardType, 
    CardTypeConfig, 
    getCardConfig, 
    isValidCardType,
    getAvailableCardTypes,
    CARD_TYPE_CONFIGS 
} from '@/lib/ui/card-types';

/**
 * Options for the useCardConfig hook
 */
interface UseCardConfigOptions {
    /** Whether to log warnings for invalid card types */
    suppressWarnings?: boolean;
}

/**
 * Return type for the useCardConfig hook
 */
interface UseCardConfigReturn {
    /** Get configuration for a specific card type */
    getConfig: (type: string) => CardTypeConfig;
    /** Check if a card type is valid */
    isValid: (type: string) => type is CardType;
    /** Get all available card types */
    getAllTypes: () => CardType[];
    /** Get all configurations */
    getAllConfigs: () => typeof CARD_TYPE_CONFIGS;
}

/**
 * Hook for accessing card configurations
 * 
 * Provides type-safe access to card configurations with caching
 * and validation utilities.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { getConfig, isValid } = useCardConfig();
 *   
 *   const config = getConfig('about-event');
 *   
 *   if (isValid('about-event')) {
 *     // Type-safe access to config
 *   }
 * }
 * ```
 */
export function useCardConfig(options: UseCardConfigOptions = {}): UseCardConfigReturn {
    const { suppressWarnings = false } = options;
    
    // Memoize the functions to prevent unnecessary re-renders
    const configUtils = useMemo(() => ({
        getConfig: (type: string): CardTypeConfig => {
            const config = getCardConfig(type);
            
            if (!suppressWarnings && !isValidCardType(type)) {
                console.warn(`useCardConfig: Unknown card type "${type}"`);
            }
            
            return config;
        },
        
        isValid: (type: string): type is CardType => {
            return isValidCardType(type);
        },
        
        getAllTypes: (): CardType[] => {
            return getAvailableCardTypes();
        },
        
        getAllConfigs: () => {
            return CARD_TYPE_CONFIGS;
        },
    }), [suppressWarnings]);
    
    return configUtils;
}

/**
 * Hook for getting a specific card configuration
 * 
 * Simplified hook for when you only need one card configuration.
 * 
 * @example
 * ```tsx
 * function AboutEventCard() {
 *   const config = useSpecificCardConfig('about-event');
 *   
 *   return (
 *     <div>
 *       <config.icon />
 *       <h2>{config.title}</h2>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSpecificCardConfig(cardType: CardType): CardTypeConfig {
    return useMemo(() => getCardConfig(cardType), [cardType]);
}