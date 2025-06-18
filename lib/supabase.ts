import { createClient } from '@/utils/supabase/client'

// Default client for client-side usage - using new structure
export const supabase = createClient()

// Export createClient for backward compatibility
export { createClient } 