
-- Fix: All policies were created as RESTRICTIVE instead of PERMISSIVE.
-- PostgreSQL requires at least one PERMISSIVE policy; RESTRICTIVE only narrows.
-- Drop all and recreate as PERMISSIVE.

-- ===== PROFILES =====
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ===== BOOKINGS =====
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bookings;

CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all bookings" ON public.bookings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own bookings" ON public.bookings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can update bookings" ON public.bookings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete bookings" ON public.bookings FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- ===== NOTIFICATIONS =====
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== RUN_DATES =====
DROP POLICY IF EXISTS "Anyone can view run dates" ON public.run_dates;
DROP POLICY IF EXISTS "Admins can insert run dates" ON public.run_dates;
DROP POLICY IF EXISTS "Admins can update run dates" ON public.run_dates;
DROP POLICY IF EXISTS "Admins can delete run dates" ON public.run_dates;

CREATE POLICY "Anyone can view run dates" ON public.run_dates FOR SELECT USING (true);
CREATE POLICY "Admins can insert run dates" ON public.run_dates FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update run dates" ON public.run_dates FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete run dates" ON public.run_dates FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- ===== RUN_GROUPS =====
DROP POLICY IF EXISTS "Authenticated can view run groups" ON public.run_groups;
DROP POLICY IF EXISTS "Admins can insert run groups" ON public.run_groups;
DROP POLICY IF EXISTS "Admins can update run groups" ON public.run_groups;
DROP POLICY IF EXISTS "Admins can delete run groups" ON public.run_groups;

CREATE POLICY "Authenticated can view run groups" ON public.run_groups FOR SELECT USING (true);
CREATE POLICY "Admins can insert run groups" ON public.run_groups FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update run groups" ON public.run_groups FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete run groups" ON public.run_groups FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- ===== RUN_GROUP_MEMBERS =====
DROP POLICY IF EXISTS "Users can view own group membership" ON public.run_group_members;
DROP POLICY IF EXISTS "Admins can view all group members" ON public.run_group_members;
DROP POLICY IF EXISTS "Admins can insert group members" ON public.run_group_members;
DROP POLICY IF EXISTS "Admins can delete group members" ON public.run_group_members;

CREATE POLICY "Users can view own group membership" ON public.run_group_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all group members" ON public.run_group_members FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert group members" ON public.run_group_members FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete group members" ON public.run_group_members FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- ===== USER_ROLES =====
DROP POLICY IF EXISTS "Admins can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Admins can view roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
