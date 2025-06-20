'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import EventForm from '@/components/events/EventForm'

export default function StaffEventCreateClient() {
    const router = useRouter()
    const [showPreview, setShowPreview] = useState(false)

    const handleSuccess = () => {
        // Redirect to the staff dashboard after successful creation
        router.push('/staff?tab=events')
    }

    const handleCancel = () => {
        router.push('/staff')
    }

    return (
        <>
            <div className="mb-4 flex justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2"
                >
                    {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
            </div>
            <EventForm
                onSuccess={handleSuccess}
                onCancel={handleCancel}
                showPreview={showPreview}
            />
        </>
    )
} 