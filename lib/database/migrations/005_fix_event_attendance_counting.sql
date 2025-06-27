-- Fix Event Attendance Counting for Paid Events
-- Migration: 005_fix_event_attendance_counting.sql
-- 
-- Problem: rsvp_count only counts free RSVPs, not paid ticket purchases
-- Solution: Update computed columns to include both RSVPs and ticket sales

-- ================================
-- Drop existing computed columns that need to be updated
-- ================================

-- Remove old computed columns from events table
ALTER TABLE events DROP COLUMN IF EXISTS rsvp_count;
ALTER TABLE events DROP COLUMN IF EXISTS spots_remaining;
ALTER TABLE events DROP COLUMN IF EXISTS is_full;
ALTER TABLE events DROP COLUMN IF EXISTS is_open_for_registration;

-- ================================
-- Create updated computed columns that count both RSVPs and ticket purchases
-- ================================

-- Calculate total attendance (RSVPs + ticket purchases)
-- This replaces rsvp_count to be more accurate for all event types
ALTER TABLE events ADD COLUMN rsvp_count integer GENERATED ALWAYS AS (
  COALESCE(
    (SELECT COUNT(*) FROM rsvps WHERE event_id = events.id AND status = 'confirmed'), 0
  ) + 
  COALESCE(
    (SELECT SUM(tickets.quantity) 
     FROM tickets 
     INNER JOIN orders ON tickets.order_id = orders.id 
     WHERE orders.event_id = events.id 
     AND orders.status = 'completed'
     -- Exclude fully refunded orders
     AND (orders.refund_amount = 0 OR orders.refund_amount < orders.total_amount)
    ), 0
  )
) STORED;

-- Calculate spots remaining (accounting for both RSVPs and ticket sales)
ALTER TABLE events ADD COLUMN spots_remaining integer GENERATED ALWAYS AS (
  CASE 
    WHEN capacity IS NULL THEN NULL
    ELSE capacity - (
      COALESCE(
        (SELECT COUNT(*) FROM rsvps WHERE event_id = events.id AND status = 'confirmed'), 0
      ) + 
      COALESCE(
        (SELECT SUM(tickets.quantity) 
         FROM tickets 
         INNER JOIN orders ON tickets.order_id = orders.id 
         WHERE orders.event_id = events.id 
         AND orders.status = 'completed'
         -- Exclude fully refunded orders
         AND (orders.refund_amount = 0 OR orders.refund_amount < orders.total_amount)
        ), 0
      )
    )
  END
) STORED;

-- Boolean flag for if event is at capacity (accounting for both RSVPs and ticket sales)
ALTER TABLE events ADD COLUMN is_full boolean GENERATED ALWAYS AS (
  CASE 
    WHEN capacity IS NULL THEN false
    ELSE (
      COALESCE(
        (SELECT COUNT(*) FROM rsvps WHERE event_id = events.id AND status = 'confirmed'), 0
      ) + 
      COALESCE(
        (SELECT SUM(tickets.quantity) 
         FROM tickets 
         INNER JOIN orders ON tickets.order_id = orders.id 
         WHERE orders.event_id = events.id 
         AND orders.status = 'completed'
         -- Exclude fully refunded orders
         AND (orders.refund_amount = 0 OR orders.refund_amount < orders.total_amount)
        ), 0
      )
    ) >= capacity
  END
) STORED;

-- Boolean flag for if RSVP/ticket sales are open (accounting for both RSVPs and ticket sales)
ALTER TABLE events ADD COLUMN is_open_for_registration boolean GENERATED ALWAYS AS (
  published = true 
  AND cancelled = false 
  AND start_time > now()
  AND (
    capacity IS NULL OR (
      COALESCE(
        (SELECT COUNT(*) FROM rsvps WHERE event_id = events.id AND status = 'confirmed'), 0
      ) + 
      COALESCE(
        (SELECT SUM(tickets.quantity) 
         FROM tickets 
         INNER JOIN orders ON tickets.order_id = orders.id 
         WHERE orders.event_id = events.id 
         AND orders.status = 'completed'
         -- Exclude fully refunded orders
         AND (orders.refund_amount = 0 OR orders.refund_amount < orders.total_amount)
        ), 0
      )
    ) < capacity
  )
) STORED;

-- ================================
-- Update comments to reflect new behavior
-- ================================

COMMENT ON COLUMN events.rsvp_count IS 'Total attendance count including both confirmed RSVPs and completed ticket purchases (excluding refunded tickets)';
COMMENT ON COLUMN events.spots_remaining IS 'Remaining capacity accounting for both RSVPs and ticket sales, NULL if unlimited';
COMMENT ON COLUMN events.is_full IS 'Boolean flag indicating if event has reached capacity (RSVPs + ticket sales)';
COMMENT ON COLUMN events.is_open_for_registration IS 'Boolean flag for if event accepts new registrations (RSVPs + ticket sales)';

-- ================================
-- Performance note
-- ================================

-- Note: These computed columns now perform more complex queries including JOINs.
-- Monitor performance in production. If needed, consider:
-- 1. Adding indexes on orders(event_id, status) and tickets(order_id)
-- 2. Using triggers instead of computed columns for high-traffic events
-- 3. Implementing a scheduled job to update cached counts

-- Recommended indexes for performance (add if not already present):
-- CREATE INDEX IF NOT EXISTS idx_orders_event_status ON orders(event_id, status);
-- CREATE INDEX IF NOT EXISTS idx_tickets_order_id ON tickets(order_id);
-- CREATE INDEX IF NOT EXISTS idx_rsvps_event_status ON rsvps(event_id, status);