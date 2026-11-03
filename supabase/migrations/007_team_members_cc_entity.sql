-- ============================================================================
-- 007_team_members_cc_entity.sql
-- Call-center team support: allow team_members.entity_type = 'call_center'.
--
-- WHY
-- ---
-- Call-center managers and agents are stored as team_members rows with
-- entity_type='call_center' and entity_id=<call_centers.id>, mirroring how
-- agency staff use entity_type='agency'. The existing CHECK constraint only
-- permitted ('agency','client'), so any call-center team insert failed with a
-- 23514 check-constraint violation (the same class of failure that blocked
-- cc_* roles before migration 006 extended valid_user_role).
--
-- team_members.entity_id has NO foreign key, so a call_centers id is already
-- valid to store there; only the entity_type CHECK needs to be widened.
--
-- Safe + idempotent: drops the old constraint if present and recreates it with
-- the extra allowed value. Existing 'agency' / 'client' rows are unaffected.
-- ============================================================================

ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_entity_type_check;

ALTER TABLE team_members
  ADD CONSTRAINT team_members_entity_type_check
  CHECK (entity_type = ANY (ARRAY['agency'::text, 'client'::text, 'call_center'::text]));
