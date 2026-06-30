-- ════════════════════════════════════════════════════════════════════════════
--  0002_functions.sql — business logic (RPC), leaderboard views
--  All mutations to points flow through these SECURITY DEFINER functions so the
--  rules (one prediction, settlement scoring, deduct-on-redeem) are enforced in
--  the database, not the client.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Make a prediction (one per user per match, free) ───────────────────────
create or replace function fn_predict(p_match_id uuid, p_pick prediction_pick)
returns predictions language plpgsql security definer set search_path = public as $$
declare v_row predictions;
begin
  if auth.uid() is null then raise exception 'Sign in to predict'; end if;
  insert into predictions (user_id, match_id, pick)
    values (auth.uid(), p_match_id, p_pick)
    returning * into v_row;        -- uniqueness + window enforced by table triggers
  return v_row;
end;
$$;

-- ─── Settle a match → score predictions, award points (admin) ───────────────
create or replace function fn_settle_match(p_match_id uuid, p_home int, p_away int)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_points int;
  v_result prediction_pick;
  v_updated int;
  r record;
begin
  if not is_admin() then raise exception 'Not authorized'; end if;
  if p_home < 0 or p_away < 0 then raise exception 'Scores cannot be negative'; end if;

  perform set_config('app.settling', 'on', true);   -- allow prediction updates this txn

  update matches
     set home_score = p_home, away_score = p_away, status = 'finished', settled_at = now()
   where id = p_match_id;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then raise exception 'Match not found'; end if;

  select c.points_correct, m.result
    into v_points, v_result
    from matches m join campaigns c on c.id = m.campaign_id
   where m.id = p_match_id;

  for r in select * from predictions where match_id = p_match_id and status = 'pending' loop
    if r.pick = v_result then
      update predictions set status = 'won', points_awarded = v_points, settled_at = now() where id = r.id;
      insert into point_ledger (user_id, delta, reason, ref_type, ref_id)
        values (r.user_id, v_points, 'prediction_win', 'prediction', r.id);
    else
      update predictions set status = 'lost', points_awarded = 0, settled_at = now() where id = r.id;
    end if;
  end loop;
end;
$$;

-- ─── Claim an offer (reserve; no points deducted yet) ───────────────────────
create or replace function fn_claim_offer(p_offer_id uuid)
returns claims language plpgsql security definer set search_path = public as $$
declare v_offer offers; v_balance int; v_claim claims;
begin
  if auth.uid() is null then raise exception 'Sign in to claim an offer'; end if;

  select * into v_offer from offers where id = p_offer_id;
  if v_offer.id is null or not v_offer.is_active then raise exception 'Offer unavailable'; end if;
  if v_offer.valid_until is not null and v_offer.valid_until < now() then raise exception 'Offer expired'; end if;
  if v_offer.inventory is not null and v_offer.inventory <= 0 then raise exception 'Out of stock'; end if;

  select points into v_balance from profiles where id = auth.uid();
  if v_balance is null then raise exception 'Profile not found'; end if;
  if v_balance < v_offer.points_cost then raise exception 'Insufficient points'; end if;

  insert into claims (user_id, offer_id, points_cost)
    values (auth.uid(), p_offer_id, v_offer.points_cost)
    returning * into v_claim;      -- partial unique index blocks duplicate pending
  return v_claim;
end;
$$;

-- ─── Redeem a claim in store → deduct points (admin) ────────────────────────
create or replace function fn_redeem_claim(p_claim_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_claim claims; v_offer offers; v_balance int;
begin
  if not is_admin() then raise exception 'Not authorized'; end if;

  select * into v_claim from claims where id = p_claim_id for update;
  if v_claim.id is null then raise exception 'Claim not found'; end if;
  if v_claim.status <> 'pending' then raise exception 'Claim is not pending'; end if;

  select * into v_offer from offers where id = v_claim.offer_id for update;
  if v_offer.id is null then raise exception 'Offer not found'; end if;
  if v_offer.inventory is not null and v_offer.inventory <= 0 then raise exception 'Out of stock'; end if;

  select points into v_balance from profiles where id = v_claim.user_id;
  if v_balance < v_claim.points_cost then raise exception 'Customer has insufficient points'; end if;

  insert into point_ledger (user_id, delta, reason, ref_type, ref_id)
    values (v_claim.user_id, -v_claim.points_cost, 'redemption', 'claim', v_claim.id);

  update offers set inventory = inventory - 1 where id = v_claim.offer_id and inventory is not null;
  update claims set status = 'redeemed', redeemed_at = now(), redeemed_by = auth.uid() where id = p_claim_id;
end;
$$;

-- ─── Cancel a pending claim (owner or admin) ────────────────────────────────
create or replace function fn_cancel_claim(p_claim_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_claim claims;
begin
  if auth.uid() is null then raise exception 'Sign in to cancel a claim'; end if;

  select * into v_claim from claims where id = p_claim_id;
  if v_claim.id is null then raise exception 'Claim not found'; end if;
  if v_claim.user_id <> auth.uid() and not is_admin() then raise exception 'Not authorized'; end if;
  if v_claim.status <> 'pending' then raise exception 'Only pending claims can be cancelled'; end if;
  update claims set status = 'cancelled' where id = p_claim_id;
end;
$$;

-- ─── Views ──────────────────────────────────────────────────────────────────
create or replace view v_leaderboard as
  select row_number() over (order by points desc, created_at) as rank,
         id as user_id, name, points
  from profiles;

create or replace view v_match_breakdown as
  select m.id as match_id,
         count(p.*) filter (where p.pick = 'home') as home_count,
         count(p.*) filter (where p.pick = 'draw') as draw_count,
         count(p.*) filter (where p.pick = 'away') as away_count,
         count(p.*) as total_predictions
  from matches m
  left join predictions p on p.match_id = m.id
  group by m.id;
