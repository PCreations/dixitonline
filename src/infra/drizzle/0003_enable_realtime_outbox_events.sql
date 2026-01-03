-- Custom SQL migration file, put your code below! --
-- Enable Supabase Realtime on outbox_events table
-- This allows the OutboxEventRelay to receive INSERT notifications in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE outbox_events;