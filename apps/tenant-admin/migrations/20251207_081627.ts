import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_tenants_settings_timezone" AS ENUM('Europe/Madrid', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Atlantic/Canary');
  CREATE TYPE "public"."enum_tenants_settings_language" AS ENUM('es', 'en', 'pt');
  CREATE TYPE "public"."enum_users_role" AS ENUM('superadmin', 'admin', 'gestor', 'marketing', 'asesor', 'lectura');
  CREATE TYPE "public"."enum_cycles_level" AS ENUM('fp_basica', 'grado_medio', 'grado_superior', 'certificado_profesionalidad');
  CREATE TYPE "public"."enum_entidades_financiadoras_tipo_subvencion" AS ENUM('publica', 'privada', 'europea', 'autonomica');
  CREATE TYPE "public"."enum_courses_modality" AS ENUM('presencial', 'online', 'hibrido');
  CREATE TYPE "public"."enum_courses_course_type" AS ENUM('privado', 'ocupados', 'desempleados', 'teleformacion', 'ciclo_medio', 'ciclo_superior');
  CREATE TYPE "public"."enum_courses_area" AS ENUM('sanitaria', 'horeca', 'salud', 'tecnologia', 'audiovisual', 'administracion', 'marketing', 'educacion');
  CREATE TYPE "public"."enum_course_runs_schedule_days" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
  CREATE TYPE "public"."enum_course_runs_status" AS ENUM('draft', 'published', 'enrollment_open', 'enrollment_closed', 'in_progress', 'completed', 'cancelled');
  CREATE TYPE "public"."enum_students_gender" AS ENUM('male', 'female', 'non-binary', 'prefer-not-to-say');
  CREATE TYPE "public"."enum_students_emergency_contact_relationship" AS ENUM('parent', 'father', 'mother', 'guardian', 'spouse', 'partner', 'sibling', 'friend', 'other');
  CREATE TYPE "public"."enum_students_status" AS ENUM('active', 'inactive', 'suspended', 'graduated');
  CREATE TYPE "public"."enum_enrollments_status" AS ENUM('pending', 'confirmed', 'waitlisted', 'cancelled', 'completed', 'withdrawn');
  CREATE TYPE "public"."enum_enrollments_payment_status" AS ENUM('pending', 'partial', 'paid', 'refunded', 'waived');
  CREATE TYPE "public"."enum_enrollments_financial_aid_status" AS ENUM('none', 'pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_staff_specialties" AS ENUM('marketing-digital', 'desarrollo-web', 'diseno-grafico', 'audiovisual', 'gestion-empresarial', 'redes-sociales', 'seo-sem', 'ecommerce', 'fotografia', 'video');
  CREATE TYPE "public"."enum_staff_staff_type" AS ENUM('profesor', 'administrativo');
  CREATE TYPE "public"."enum_staff_contract_type" AS ENUM('full_time', 'part_time', 'freelance');
  CREATE TYPE "public"."enum_staff_employment_status" AS ENUM('active', 'temporary_leave', 'inactive');
  CREATE TYPE "public"."enum_campaigns_campaign_type" AS ENUM('email', 'social', 'paid_ads', 'organic', 'event', 'referral', 'other');
  CREATE TYPE "public"."enum_campaigns_status" AS ENUM('draft', 'active', 'paused', 'completed', 'archived');
  CREATE TYPE "public"."enum_ads_templates_template_type" AS ENUM('email', 'social_post', 'display_ad', 'landing_page', 'video_script', 'other');
  CREATE TYPE "public"."enum_ads_templates_status" AS ENUM('draft', 'active', 'archived');
  CREATE TYPE "public"."enum_ads_templates_tone" AS ENUM('professional', 'casual', 'urgent', 'friendly', 'educational', 'promotional');
  CREATE TYPE "public"."enum_ads_templates_language" AS ENUM('es', 'en', 'ca');
  CREATE TYPE "public"."enum_leads_preferred_contact_method" AS ENUM('email', 'phone', 'whatsapp');
  CREATE TYPE "public"."enum_leads_preferred_contact_time" AS ENUM('morning', 'afternoon', 'evening', 'anytime');
  CREATE TYPE "public"."enum_leads_status" AS ENUM('new', 'contacted', 'qualified', 'converted', 'rejected', 'spam');
  CREATE TYPE "public"."enum_leads_priority" AS ENUM('low', 'medium', 'high', 'urgent');
  CREATE TYPE "public"."enum_blog_posts_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_blog_posts_language" AS ENUM('es', 'en', 'ca');
  CREATE TYPE "public"."enum_faqs_category" AS ENUM('courses', 'enrollment', 'payments', 'technical', 'general');
  CREATE TYPE "public"."enum_faqs_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_faqs_language" AS ENUM('es', 'en', 'ca');
  CREATE TYPE "public"."enum_audit_logs_action" AS ENUM('create', 'read', 'update', 'delete', 'export', 'login', 'logout', 'permission_change');
  CREATE TYPE "public"."enum_audit_logs_collection_name" AS ENUM('users', 'cycles', 'campuses', 'courses', 'course-runs', 'leads', 'enrollments', 'students', 'campaigns', 'ads-templates', 'blog-posts', 'faqs', 'media', 'audit-logs');
  CREATE TYPE "public"."enum_audit_logs_user_role" AS ENUM('admin', 'gestor', 'marketing', 'asesor', 'lectura');
  CREATE TYPE "public"."enum_audit_logs_status" AS ENUM('success', 'failure', 'blocked');
  CREATE TABLE "tenants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"domain" varchar,
  	"branding_logo_id" integer,
  	"branding_favicon_id" integer,
  	"branding_primary_color" varchar DEFAULT '#F2014B',
  	"branding_secondary_color" varchar DEFAULT '#1a1a2e',
  	"contact_email" varchar,
  	"contact_phone" varchar,
  	"contact_address" varchar,
  	"contact_website" varchar,
  	"settings_timezone" "enum_tenants_settings_timezone" DEFAULT 'Europe/Madrid',
  	"settings_language" "enum_tenants_settings_language" DEFAULT 'es',
  	"settings_features_enable_leads" boolean DEFAULT true,
  	"settings_features_enable_campaigns" boolean DEFAULT true,
  	"settings_features_enable_blog" boolean DEFAULT true,
  	"settings_features_enable_analytics" boolean DEFAULT true,
  	"integrations_ga4_measurement_id" varchar,
  	"integrations_meta_pixel_id" varchar,
  	"integrations_mailchimp_api_key" varchar,
  	"integrations_whatsapp_business_id" varchar,
  	"active" boolean DEFAULT true,
  	"limits_max_users" numeric DEFAULT 50,
  	"limits_max_courses" numeric DEFAULT 100,
  	"limits_max_leads_per_month" numeric DEFAULT 1000,
  	"limits_storage_quota_m_b" numeric DEFAULT 5120,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"password" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'lectura' NOT NULL,
  	"tenant_id" integer,
  	"avatar_url" varchar,
  	"phone" varchar,
  	"is_active" boolean DEFAULT true,
  	"last_login_at" timestamp(3) with time zone,
  	"login_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "cycles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"level" "enum_cycles_level" NOT NULL,
  	"order_display" numeric DEFAULT 0,
  	"tenant_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "campuses" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"city" varchar NOT NULL,
  	"address" varchar,
  	"postal_code" varchar,
  	"phone" varchar,
  	"email" varchar,
  	"maps_url" varchar,
  	"tenant_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "campuses_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"staff_id" integer
  );
  
  CREATE TABLE "areas_formativas" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"codigo" varchar NOT NULL,
  	"descripcion" varchar,
  	"color" varchar,
  	"activo" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "entidades_financiadoras" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"codigo" varchar NOT NULL,
  	"descripcion" varchar,
  	"logo_url" varchar,
  	"tipo_subvencion" "enum_entidades_financiadoras_tipo_subvencion" DEFAULT 'publica' NOT NULL,
  	"url_oficial" varchar,
  	"activo" boolean DEFAULT true,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "courses" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"codigo" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"featured_image_id" integer,
  	"cycle_id" integer,
  	"short_description" varchar,
  	"long_description" jsonb,
  	"modality" "enum_courses_modality" DEFAULT 'presencial' NOT NULL,
  	"course_type" "enum_courses_course_type",
  	"area_formativa_id" integer NOT NULL,
  	"area" "enum_courses_area",
  	"duration_hours" numeric,
  	"base_price" numeric,
  	"subsidy_percentage" numeric DEFAULT 100,
  	"financial_aid_available" boolean DEFAULT true,
  	"active" boolean DEFAULT true,
  	"featured" boolean DEFAULT false,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"created_by_id" integer,
  	"tenant_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "courses_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"campuses_id" integer
  );
  
  CREATE TABLE "course_runs_schedule_days" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_course_runs_schedule_days",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "course_runs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"course_id" integer NOT NULL,
  	"campus_id" integer,
  	"codigo" varchar NOT NULL,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone NOT NULL,
  	"enrollment_deadline" timestamp(3) with time zone,
  	"schedule_time_start" varchar,
  	"schedule_time_end" varchar,
  	"max_students" numeric DEFAULT 30 NOT NULL,
  	"min_students" numeric DEFAULT 5 NOT NULL,
  	"current_enrollments" numeric DEFAULT 0 NOT NULL,
  	"status" "enum_course_runs_status" DEFAULT 'draft' NOT NULL,
  	"price_override" numeric,
  	"financial_aid_available" boolean DEFAULT false,
  	"instructor_id" integer,
  	"notes" varchar,
  	"completion_snapshot_final_student_count" numeric,
  	"completion_snapshot_final_occupation_percentage" numeric,
  	"completion_snapshot_final_price" numeric,
  	"completion_snapshot_completed_at" timestamp(3) with time zone,
  	"created_by_id" integer,
  	"tenant_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "students" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"first_name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"dni" varchar,
  	"address" varchar,
  	"city" varchar,
  	"postal_code" varchar,
  	"country" varchar DEFAULT 'España',
  	"date_of_birth" timestamp(3) with time zone,
  	"gender" "enum_students_gender",
  	"emergency_contact_name" varchar,
  	"emergency_contact_phone" varchar,
  	"emergency_contact_relationship" "enum_students_emergency_contact_relationship",
  	"gdpr_consent" boolean DEFAULT false NOT NULL,
  	"privacy_policy_accepted" boolean DEFAULT false NOT NULL,
  	"marketing_consent" boolean DEFAULT false,
  	"consent_timestamp" timestamp(3) with time zone,
  	"consent_ip_address" varchar,
  	"status" "enum_students_status" DEFAULT 'active' NOT NULL,
  	"notes" varchar,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "enrollments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"student_id" integer NOT NULL,
  	"course_run_id" integer NOT NULL,
  	"status" "enum_enrollments_status" DEFAULT 'pending' NOT NULL,
  	"payment_status" "enum_enrollments_payment_status" DEFAULT 'pending' NOT NULL,
  	"total_amount" numeric NOT NULL,
  	"amount_paid" numeric DEFAULT 0 NOT NULL,
  	"financial_aid_applied" boolean DEFAULT false,
  	"financial_aid_amount" numeric DEFAULT 0,
  	"financial_aid_status" "enum_enrollments_financial_aid_status",
  	"enrolled_at" timestamp(3) with time zone,
  	"confirmed_at" timestamp(3) with time zone,
  	"completed_at" timestamp(3) with time zone,
  	"cancelled_at" timestamp(3) with time zone,
  	"attendance_percentage" numeric,
  	"final_grade" numeric,
  	"certificate_issued" boolean DEFAULT false,
  	"certificate_url" varchar,
  	"notes" varchar,
  	"cancellation_reason" varchar,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "staff_specialties" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_staff_specialties",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "staff_certifications" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"institution" varchar,
  	"year" numeric,
  	"document_id" integer
  );
  
  CREATE TABLE "staff" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"staff_type" "enum_staff_staff_type" DEFAULT 'profesor' NOT NULL,
  	"first_name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"full_name" varchar,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"bio" varchar,
  	"photo_id" integer,
  	"position" varchar NOT NULL,
  	"contract_type" "enum_staff_contract_type" DEFAULT 'full_time' NOT NULL,
  	"employment_status" "enum_staff_employment_status" DEFAULT 'active' NOT NULL,
  	"hire_date" timestamp(3) with time zone NOT NULL,
  	"is_active" boolean DEFAULT true,
  	"notes" varchar,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "staff_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"campuses_id" integer
  );
  
  CREATE TABLE "campaigns" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"campaign_type" "enum_campaigns_campaign_type" NOT NULL,
  	"status" "enum_campaigns_status" DEFAULT 'draft' NOT NULL,
  	"course_id" integer,
  	"utm_source" varchar,
  	"utm_medium" varchar,
  	"utm_campaign" varchar,
  	"utm_term" varchar,
  	"utm_content" varchar,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone,
  	"budget" numeric,
  	"target_leads" numeric,
  	"target_enrollments" numeric,
  	"total_leads" numeric,
  	"total_conversions" numeric,
  	"conversion_rate" numeric,
  	"cost_per_lead" numeric,
  	"notes" varchar,
  	"created_by_id" integer,
  	"tenant_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ads_templates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"template_type" "enum_ads_templates_template_type" NOT NULL,
  	"status" "enum_ads_templates_status" DEFAULT 'draft' NOT NULL,
  	"campaign_id" integer,
  	"headline" varchar NOT NULL,
  	"body_copy" jsonb NOT NULL,
  	"call_to_action" varchar,
  	"cta_url" varchar,
  	"primary_image_url" varchar,
  	"secondary_image_url" varchar,
  	"video_url" varchar,
  	"thumbnail_url" varchar,
  	"target_audience" varchar,
  	"tone" "enum_ads_templates_tone" DEFAULT 'professional' NOT NULL,
  	"language" "enum_ads_templates_language" DEFAULT 'es' NOT NULL,
  	"version" numeric DEFAULT 1,
  	"usage_count" numeric DEFAULT 0,
  	"last_used_at" timestamp(3) with time zone,
  	"active" boolean DEFAULT true,
  	"archived_at" timestamp(3) with time zone,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ads_templates_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"first_name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"course_id" integer,
  	"campus_id" integer,
  	"campaign_id" integer,
  	"message" varchar,
  	"preferred_contact_method" "enum_leads_preferred_contact_method",
  	"preferred_contact_time" "enum_leads_preferred_contact_time" DEFAULT 'anytime',
  	"gdpr_consent" boolean DEFAULT false NOT NULL,
  	"privacy_policy_accepted" boolean DEFAULT false NOT NULL,
  	"marketing_consent" boolean DEFAULT false,
  	"consent_timestamp" timestamp(3) with time zone,
  	"consent_ip_address" varchar,
  	"status" "enum_leads_status" DEFAULT 'new' NOT NULL,
  	"assigned_to_id" integer,
  	"priority" "enum_leads_priority" DEFAULT 'medium',
  	"utm_source" varchar,
  	"utm_medium" varchar,
  	"utm_campaign" varchar,
  	"utm_term" varchar,
  	"utm_content" varchar,
  	"mailchimp_subscriber_id" varchar,
  	"whatsapp_contact_id" varchar,
  	"lead_score" numeric DEFAULT 0,
  	"notes" jsonb,
  	"last_contacted_at" timestamp(3) with time zone,
  	"converted_at" timestamp(3) with time zone,
  	"tenant_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "blog_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"excerpt" varchar NOT NULL,
  	"content" jsonb NOT NULL,
  	"featured_image" varchar,
  	"og_image" varchar,
  	"status" "enum_blog_posts_status" DEFAULT 'draft' NOT NULL,
  	"featured" boolean DEFAULT false,
  	"published_at" timestamp(3) with time zone,
  	"archived_at" timestamp(3) with time zone,
  	"author_id" integer NOT NULL,
  	"created_by_id" integer,
  	"view_count" numeric DEFAULT 0,
  	"estimated_read_time" numeric,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"language" "enum_blog_posts_language" DEFAULT 'es' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "blog_posts_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "blog_posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"courses_id" integer
  );
  
  CREATE TABLE "faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"answer" jsonb NOT NULL,
  	"category" "enum_faqs_category" NOT NULL,
  	"status" "enum_faqs_status" DEFAULT 'draft' NOT NULL,
  	"featured" boolean DEFAULT false,
  	"published_at" timestamp(3) with time zone,
  	"archived_at" timestamp(3) with time zone,
  	"created_by_id" integer,
  	"order" numeric DEFAULT 0,
  	"related_course_id" integer,
  	"view_count" numeric DEFAULT 0,
  	"helpful_count" numeric DEFAULT 0,
  	"language" "enum_faqs_language" DEFAULT 'es' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "faqs_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "audit_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"action" "enum_audit_logs_action" NOT NULL,
  	"collection_name" "enum_audit_logs_collection_name" NOT NULL,
  	"document_id" varchar,
  	"user_id_id" integer NOT NULL,
  	"user_email" varchar NOT NULL,
  	"user_role" "enum_audit_logs_user_role" NOT NULL,
  	"ip_address" varchar NOT NULL,
  	"user_agent" varchar,
  	"changes" jsonb,
  	"metadata" jsonb,
  	"status" "enum_audit_logs_status" DEFAULT 'success' NOT NULL,
  	"error_message" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tenants_id" integer,
  	"users_id" integer,
  	"cycles_id" integer,
  	"campuses_id" integer,
  	"areas_formativas_id" integer,
  	"entidades_financiadoras_id" integer,
  	"courses_id" integer,
  	"course_runs_id" integer,
  	"students_id" integer,
  	"enrollments_id" integer,
  	"staff_id" integer,
  	"campaigns_id" integer,
  	"ads_templates_id" integer,
  	"leads_id" integer,
  	"blog_posts_id" integer,
  	"faqs_id" integer,
  	"media_id" integer,
  	"audit_logs_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "tenants" ADD CONSTRAINT "tenants_branding_logo_id_media_id_fk" FOREIGN KEY ("branding_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tenants" ADD CONSTRAINT "tenants_branding_favicon_id_media_id_fk" FOREIGN KEY ("branding_favicon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cycles" ADD CONSTRAINT "cycles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "campuses" ADD CONSTRAINT "campuses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "campuses_rels" ADD CONSTRAINT "campuses_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."campuses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "campuses_rels" ADD CONSTRAINT "campuses_rels_staff_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "entidades_financiadoras" ADD CONSTRAINT "entidades_financiadoras_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_cycle_id_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."cycles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_area_formativa_id_areas_formativas_id_fk" FOREIGN KEY ("area_formativa_id") REFERENCES "public"."areas_formativas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_rels" ADD CONSTRAINT "courses_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_rels" ADD CONSTRAINT "courses_rels_campuses_fk" FOREIGN KEY ("campuses_id") REFERENCES "public"."campuses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "course_runs_schedule_days" ADD CONSTRAINT "course_runs_schedule_days_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."course_runs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "course_runs" ADD CONSTRAINT "course_runs_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "course_runs" ADD CONSTRAINT "course_runs_campus_id_campuses_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campuses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "course_runs" ADD CONSTRAINT "course_runs_instructor_id_staff_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "course_runs" ADD CONSTRAINT "course_runs_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "course_runs" ADD CONSTRAINT "course_runs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "students" ADD CONSTRAINT "students_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_leads_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_run_id_course_runs_id_fk" FOREIGN KEY ("course_run_id") REFERENCES "public"."course_runs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "staff_specialties" ADD CONSTRAINT "staff_specialties_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "staff_certifications" ADD CONSTRAINT "staff_certifications_document_id_media_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "staff_certifications" ADD CONSTRAINT "staff_certifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "staff" ADD CONSTRAINT "staff_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "staff" ADD CONSTRAINT "staff_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "staff_rels" ADD CONSTRAINT "staff_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "staff_rels" ADD CONSTRAINT "staff_rels_campuses_fk" FOREIGN KEY ("campuses_id") REFERENCES "public"."campuses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ads_templates" ADD CONSTRAINT "ads_templates_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ads_templates" ADD CONSTRAINT "ads_templates_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ads_templates_texts" ADD CONSTRAINT "ads_templates_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ads_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_campus_id_campuses_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campuses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blog_posts_texts" ADD CONSTRAINT "blog_posts_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_posts_rels" ADD CONSTRAINT "blog_posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_posts_rels" ADD CONSTRAINT "blog_posts_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "faqs" ADD CONSTRAINT "faqs_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "faqs" ADD CONSTRAINT "faqs_related_course_id_courses_id_fk" FOREIGN KEY ("related_course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "faqs_texts" ADD CONSTRAINT "faqs_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_id_users_id_fk" FOREIGN KEY ("user_id_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tenants_fk" FOREIGN KEY ("tenants_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cycles_fk" FOREIGN KEY ("cycles_id") REFERENCES "public"."cycles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_campuses_fk" FOREIGN KEY ("campuses_id") REFERENCES "public"."campuses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_areas_formativas_fk" FOREIGN KEY ("areas_formativas_id") REFERENCES "public"."areas_formativas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_entidades_financiadoras_fk" FOREIGN KEY ("entidades_financiadoras_id") REFERENCES "public"."entidades_financiadoras"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_course_runs_fk" FOREIGN KEY ("course_runs_id") REFERENCES "public"."course_runs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_students_fk" FOREIGN KEY ("students_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_enrollments_fk" FOREIGN KEY ("enrollments_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_staff_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_campaigns_fk" FOREIGN KEY ("campaigns_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ads_templates_fk" FOREIGN KEY ("ads_templates_id") REFERENCES "public"."ads_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leads_fk" FOREIGN KEY ("leads_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_posts_fk" FOREIGN KEY ("blog_posts_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk" FOREIGN KEY ("audit_logs_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "tenants_slug_idx" ON "tenants" USING btree ("slug");
  CREATE INDEX "tenants_branding_branding_logo_idx" ON "tenants" USING btree ("branding_logo_id");
  CREATE INDEX "tenants_branding_branding_favicon_idx" ON "tenants" USING btree ("branding_favicon_id");
  CREATE INDEX "tenants_updated_at_idx" ON "tenants" USING btree ("updated_at");
  CREATE INDEX "tenants_created_at_idx" ON "tenants" USING btree ("created_at");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_tenant_idx" ON "users" USING btree ("tenant_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "cycles_slug_idx" ON "cycles" USING btree ("slug");
  CREATE INDEX "cycles_tenant_idx" ON "cycles" USING btree ("tenant_id");
  CREATE INDEX "cycles_updated_at_idx" ON "cycles" USING btree ("updated_at");
  CREATE INDEX "cycles_created_at_idx" ON "cycles" USING btree ("created_at");
  CREATE UNIQUE INDEX "campuses_slug_idx" ON "campuses" USING btree ("slug");
  CREATE INDEX "campuses_city_idx" ON "campuses" USING btree ("city");
  CREATE INDEX "campuses_tenant_idx" ON "campuses" USING btree ("tenant_id");
  CREATE INDEX "campuses_updated_at_idx" ON "campuses" USING btree ("updated_at");
  CREATE INDEX "campuses_created_at_idx" ON "campuses" USING btree ("created_at");
  CREATE INDEX "campuses_rels_order_idx" ON "campuses_rels" USING btree ("order");
  CREATE INDEX "campuses_rels_parent_idx" ON "campuses_rels" USING btree ("parent_id");
  CREATE INDEX "campuses_rels_path_idx" ON "campuses_rels" USING btree ("path");
  CREATE INDEX "campuses_rels_staff_id_idx" ON "campuses_rels" USING btree ("staff_id");
  CREATE UNIQUE INDEX "areas_formativas_codigo_idx" ON "areas_formativas" USING btree ("codigo");
  CREATE INDEX "areas_formativas_updated_at_idx" ON "areas_formativas" USING btree ("updated_at");
  CREATE INDEX "areas_formativas_created_at_idx" ON "areas_formativas" USING btree ("created_at");
  CREATE UNIQUE INDEX "entidades_financiadoras_codigo_idx" ON "entidades_financiadoras" USING btree ("codigo");
  CREATE INDEX "entidades_financiadoras_created_by_idx" ON "entidades_financiadoras" USING btree ("created_by_id");
  CREATE INDEX "entidades_financiadoras_updated_at_idx" ON "entidades_financiadoras" USING btree ("updated_at");
  CREATE INDEX "entidades_financiadoras_created_at_idx" ON "entidades_financiadoras" USING btree ("created_at");
  CREATE UNIQUE INDEX "courses_codigo_idx" ON "courses" USING btree ("codigo");
  CREATE UNIQUE INDEX "courses_slug_idx" ON "courses" USING btree ("slug");
  CREATE INDEX "courses_featured_image_idx" ON "courses" USING btree ("featured_image_id");
  CREATE INDEX "courses_cycle_idx" ON "courses" USING btree ("cycle_id");
  CREATE INDEX "courses_area_formativa_idx" ON "courses" USING btree ("area_formativa_id");
  CREATE INDEX "courses_created_by_idx" ON "courses" USING btree ("created_by_id");
  CREATE INDEX "courses_tenant_idx" ON "courses" USING btree ("tenant_id");
  CREATE INDEX "courses_updated_at_idx" ON "courses" USING btree ("updated_at");
  CREATE INDEX "courses_created_at_idx" ON "courses" USING btree ("created_at");
  CREATE INDEX "courses_rels_order_idx" ON "courses_rels" USING btree ("order");
  CREATE INDEX "courses_rels_parent_idx" ON "courses_rels" USING btree ("parent_id");
  CREATE INDEX "courses_rels_path_idx" ON "courses_rels" USING btree ("path");
  CREATE INDEX "courses_rels_campuses_id_idx" ON "courses_rels" USING btree ("campuses_id");
  CREATE INDEX "course_runs_schedule_days_order_idx" ON "course_runs_schedule_days" USING btree ("order");
  CREATE INDEX "course_runs_schedule_days_parent_idx" ON "course_runs_schedule_days" USING btree ("parent_id");
  CREATE INDEX "course_runs_course_idx" ON "course_runs" USING btree ("course_id");
  CREATE INDEX "course_runs_campus_idx" ON "course_runs" USING btree ("campus_id");
  CREATE UNIQUE INDEX "course_runs_codigo_idx" ON "course_runs" USING btree ("codigo");
  CREATE INDEX "course_runs_start_date_idx" ON "course_runs" USING btree ("start_date");
  CREATE INDEX "course_runs_status_idx" ON "course_runs" USING btree ("status");
  CREATE INDEX "course_runs_instructor_idx" ON "course_runs" USING btree ("instructor_id");
  CREATE INDEX "course_runs_created_by_idx" ON "course_runs" USING btree ("created_by_id");
  CREATE INDEX "course_runs_tenant_idx" ON "course_runs" USING btree ("tenant_id");
  CREATE INDEX "course_runs_updated_at_idx" ON "course_runs" USING btree ("updated_at");
  CREATE INDEX "course_runs_created_at_idx" ON "course_runs" USING btree ("created_at");
  CREATE UNIQUE INDEX "students_email_idx" ON "students" USING btree ("email");
  CREATE UNIQUE INDEX "students_dni_idx" ON "students" USING btree ("dni");
  CREATE INDEX "students_status_idx" ON "students" USING btree ("status");
  CREATE INDEX "students_created_by_idx" ON "students" USING btree ("created_by_id");
  CREATE INDEX "students_updated_at_idx" ON "students" USING btree ("updated_at");
  CREATE INDEX "students_created_at_idx" ON "students" USING btree ("created_at");
  CREATE INDEX "enrollments_student_idx" ON "enrollments" USING btree ("student_id");
  CREATE INDEX "enrollments_course_run_idx" ON "enrollments" USING btree ("course_run_id");
  CREATE INDEX "enrollments_status_idx" ON "enrollments" USING btree ("status");
  CREATE INDEX "enrollments_payment_status_idx" ON "enrollments" USING btree ("payment_status");
  CREATE INDEX "enrollments_created_by_idx" ON "enrollments" USING btree ("created_by_id");
  CREATE INDEX "enrollments_updated_at_idx" ON "enrollments" USING btree ("updated_at");
  CREATE INDEX "enrollments_created_at_idx" ON "enrollments" USING btree ("created_at");
  CREATE INDEX "staff_specialties_order_idx" ON "staff_specialties" USING btree ("order");
  CREATE INDEX "staff_specialties_parent_idx" ON "staff_specialties" USING btree ("parent_id");
  CREATE INDEX "staff_certifications_order_idx" ON "staff_certifications" USING btree ("_order");
  CREATE INDEX "staff_certifications_parent_id_idx" ON "staff_certifications" USING btree ("_parent_id");
  CREATE INDEX "staff_certifications_document_idx" ON "staff_certifications" USING btree ("document_id");
  CREATE INDEX "staff_staff_type_idx" ON "staff" USING btree ("staff_type");
  CREATE INDEX "staff_full_name_idx" ON "staff" USING btree ("full_name");
  CREATE UNIQUE INDEX "staff_email_idx" ON "staff" USING btree ("email");
  CREATE INDEX "staff_photo_idx" ON "staff" USING btree ("photo_id");
  CREATE INDEX "staff_contract_type_idx" ON "staff" USING btree ("contract_type");
  CREATE INDEX "staff_employment_status_idx" ON "staff" USING btree ("employment_status");
  CREATE INDEX "staff_hire_date_idx" ON "staff" USING btree ("hire_date");
  CREATE INDEX "staff_is_active_idx" ON "staff" USING btree ("is_active");
  CREATE INDEX "staff_created_by_idx" ON "staff" USING btree ("created_by_id");
  CREATE INDEX "staff_updated_at_idx" ON "staff" USING btree ("updated_at");
  CREATE INDEX "staff_created_at_idx" ON "staff" USING btree ("created_at");
  CREATE INDEX "staff_rels_order_idx" ON "staff_rels" USING btree ("order");
  CREATE INDEX "staff_rels_parent_idx" ON "staff_rels" USING btree ("parent_id");
  CREATE INDEX "staff_rels_path_idx" ON "staff_rels" USING btree ("path");
  CREATE INDEX "staff_rels_campuses_id_idx" ON "staff_rels" USING btree ("campuses_id");
  CREATE UNIQUE INDEX "campaigns_name_idx" ON "campaigns" USING btree ("name");
  CREATE INDEX "campaigns_campaign_type_idx" ON "campaigns" USING btree ("campaign_type");
  CREATE INDEX "campaigns_status_idx" ON "campaigns" USING btree ("status");
  CREATE INDEX "campaigns_course_idx" ON "campaigns" USING btree ("course_id");
  CREATE INDEX "campaigns_utm_source_idx" ON "campaigns" USING btree ("utm_source");
  CREATE INDEX "campaigns_utm_medium_idx" ON "campaigns" USING btree ("utm_medium");
  CREATE INDEX "campaigns_utm_campaign_idx" ON "campaigns" USING btree ("utm_campaign");
  CREATE INDEX "campaigns_start_date_idx" ON "campaigns" USING btree ("start_date");
  CREATE INDEX "campaigns_created_by_idx" ON "campaigns" USING btree ("created_by_id");
  CREATE INDEX "campaigns_tenant_idx" ON "campaigns" USING btree ("tenant_id");
  CREATE INDEX "campaigns_updated_at_idx" ON "campaigns" USING btree ("updated_at");
  CREATE INDEX "campaigns_created_at_idx" ON "campaigns" USING btree ("created_at");
  CREATE UNIQUE INDEX "ads_templates_name_idx" ON "ads_templates" USING btree ("name");
  CREATE INDEX "ads_templates_template_type_idx" ON "ads_templates" USING btree ("template_type");
  CREATE INDEX "ads_templates_status_idx" ON "ads_templates" USING btree ("status");
  CREATE INDEX "ads_templates_campaign_idx" ON "ads_templates" USING btree ("campaign_id");
  CREATE INDEX "ads_templates_language_idx" ON "ads_templates" USING btree ("language");
  CREATE INDEX "ads_templates_active_idx" ON "ads_templates" USING btree ("active");
  CREATE INDEX "ads_templates_created_by_idx" ON "ads_templates" USING btree ("created_by_id");
  CREATE INDEX "ads_templates_updated_at_idx" ON "ads_templates" USING btree ("updated_at");
  CREATE INDEX "ads_templates_created_at_idx" ON "ads_templates" USING btree ("created_at");
  CREATE INDEX "ads_templates_texts_order_parent" ON "ads_templates_texts" USING btree ("order","parent_id");
  CREATE INDEX "leads_email_idx" ON "leads" USING btree ("email");
  CREATE INDEX "leads_course_idx" ON "leads" USING btree ("course_id");
  CREATE INDEX "leads_campus_idx" ON "leads" USING btree ("campus_id");
  CREATE INDEX "leads_campaign_idx" ON "leads" USING btree ("campaign_id");
  CREATE INDEX "leads_assigned_to_idx" ON "leads" USING btree ("assigned_to_id");
  CREATE INDEX "leads_tenant_idx" ON "leads" USING btree ("tenant_id");
  CREATE INDEX "leads_updated_at_idx" ON "leads" USING btree ("updated_at");
  CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");
  CREATE INDEX "blog_posts_title_idx" ON "blog_posts" USING btree ("title");
  CREATE UNIQUE INDEX "blog_posts_slug_idx" ON "blog_posts" USING btree ("slug");
  CREATE INDEX "blog_posts_status_idx" ON "blog_posts" USING btree ("status");
  CREATE INDEX "blog_posts_featured_idx" ON "blog_posts" USING btree ("featured");
  CREATE INDEX "blog_posts_author_idx" ON "blog_posts" USING btree ("author_id");
  CREATE INDEX "blog_posts_created_by_idx" ON "blog_posts" USING btree ("created_by_id");
  CREATE INDEX "blog_posts_language_idx" ON "blog_posts" USING btree ("language");
  CREATE INDEX "blog_posts_updated_at_idx" ON "blog_posts" USING btree ("updated_at");
  CREATE INDEX "blog_posts_created_at_idx" ON "blog_posts" USING btree ("created_at");
  CREATE INDEX "blog_posts_texts_order_parent" ON "blog_posts_texts" USING btree ("order","parent_id");
  CREATE INDEX "blog_posts_rels_order_idx" ON "blog_posts_rels" USING btree ("order");
  CREATE INDEX "blog_posts_rels_parent_idx" ON "blog_posts_rels" USING btree ("parent_id");
  CREATE INDEX "blog_posts_rels_path_idx" ON "blog_posts_rels" USING btree ("path");
  CREATE INDEX "blog_posts_rels_courses_id_idx" ON "blog_posts_rels" USING btree ("courses_id");
  CREATE INDEX "faqs_question_idx" ON "faqs" USING btree ("question");
  CREATE UNIQUE INDEX "faqs_slug_idx" ON "faqs" USING btree ("slug");
  CREATE INDEX "faqs_category_idx" ON "faqs" USING btree ("category");
  CREATE INDEX "faqs_status_idx" ON "faqs" USING btree ("status");
  CREATE INDEX "faqs_featured_idx" ON "faqs" USING btree ("featured");
  CREATE INDEX "faqs_created_by_idx" ON "faqs" USING btree ("created_by_id");
  CREATE INDEX "faqs_order_idx" ON "faqs" USING btree ("order");
  CREATE INDEX "faqs_related_course_idx" ON "faqs" USING btree ("related_course_id");
  CREATE INDEX "faqs_language_idx" ON "faqs" USING btree ("language");
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE INDEX "faqs_texts_order_parent" ON "faqs_texts" USING btree ("order","parent_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");
  CREATE INDEX "audit_logs_collection_name_idx" ON "audit_logs" USING btree ("collection_name");
  CREATE INDEX "audit_logs_document_id_idx" ON "audit_logs" USING btree ("document_id");
  CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id_id");
  CREATE INDEX "audit_logs_user_email_idx" ON "audit_logs" USING btree ("user_email");
  CREATE INDEX "audit_logs_ip_address_idx" ON "audit_logs" USING btree ("ip_address");
  CREATE INDEX "audit_logs_updated_at_idx" ON "audit_logs" USING btree ("updated_at");
  CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_tenants_id_idx" ON "payload_locked_documents_rels" USING btree ("tenants_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_cycles_id_idx" ON "payload_locked_documents_rels" USING btree ("cycles_id");
  CREATE INDEX "payload_locked_documents_rels_campuses_id_idx" ON "payload_locked_documents_rels" USING btree ("campuses_id");
  CREATE INDEX "payload_locked_documents_rels_areas_formativas_id_idx" ON "payload_locked_documents_rels" USING btree ("areas_formativas_id");
  CREATE INDEX "payload_locked_documents_rels_entidades_financiadoras_id_idx" ON "payload_locked_documents_rels" USING btree ("entidades_financiadoras_id");
  CREATE INDEX "payload_locked_documents_rels_courses_id_idx" ON "payload_locked_documents_rels" USING btree ("courses_id");
  CREATE INDEX "payload_locked_documents_rels_course_runs_id_idx" ON "payload_locked_documents_rels" USING btree ("course_runs_id");
  CREATE INDEX "payload_locked_documents_rels_students_id_idx" ON "payload_locked_documents_rels" USING btree ("students_id");
  CREATE INDEX "payload_locked_documents_rels_enrollments_id_idx" ON "payload_locked_documents_rels" USING btree ("enrollments_id");
  CREATE INDEX "payload_locked_documents_rels_staff_id_idx" ON "payload_locked_documents_rels" USING btree ("staff_id");
  CREATE INDEX "payload_locked_documents_rels_campaigns_id_idx" ON "payload_locked_documents_rels" USING btree ("campaigns_id");
  CREATE INDEX "payload_locked_documents_rels_ads_templates_id_idx" ON "payload_locked_documents_rels" USING btree ("ads_templates_id");
  CREATE INDEX "payload_locked_documents_rels_leads_id_idx" ON "payload_locked_documents_rels" USING btree ("leads_id");
  CREATE INDEX "payload_locked_documents_rels_blog_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("blog_posts_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_logs_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "tenants" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "cycles" CASCADE;
  DROP TABLE "campuses" CASCADE;
  DROP TABLE "campuses_rels" CASCADE;
  DROP TABLE "areas_formativas" CASCADE;
  DROP TABLE "entidades_financiadoras" CASCADE;
  DROP TABLE "courses" CASCADE;
  DROP TABLE "courses_rels" CASCADE;
  DROP TABLE "course_runs_schedule_days" CASCADE;
  DROP TABLE "course_runs" CASCADE;
  DROP TABLE "students" CASCADE;
  DROP TABLE "enrollments" CASCADE;
  DROP TABLE "staff_specialties" CASCADE;
  DROP TABLE "staff_certifications" CASCADE;
  DROP TABLE "staff" CASCADE;
  DROP TABLE "staff_rels" CASCADE;
  DROP TABLE "campaigns" CASCADE;
  DROP TABLE "ads_templates" CASCADE;
  DROP TABLE "ads_templates_texts" CASCADE;
  DROP TABLE "leads" CASCADE;
  DROP TABLE "blog_posts" CASCADE;
  DROP TABLE "blog_posts_texts" CASCADE;
  DROP TABLE "blog_posts_rels" CASCADE;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "faqs_texts" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "audit_logs" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_tenants_settings_timezone";
  DROP TYPE "public"."enum_tenants_settings_language";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_cycles_level";
  DROP TYPE "public"."enum_entidades_financiadoras_tipo_subvencion";
  DROP TYPE "public"."enum_courses_modality";
  DROP TYPE "public"."enum_courses_course_type";
  DROP TYPE "public"."enum_courses_area";
  DROP TYPE "public"."enum_course_runs_schedule_days";
  DROP TYPE "public"."enum_course_runs_status";
  DROP TYPE "public"."enum_students_gender";
  DROP TYPE "public"."enum_students_emergency_contact_relationship";
  DROP TYPE "public"."enum_students_status";
  DROP TYPE "public"."enum_enrollments_status";
  DROP TYPE "public"."enum_enrollments_payment_status";
  DROP TYPE "public"."enum_enrollments_financial_aid_status";
  DROP TYPE "public"."enum_staff_specialties";
  DROP TYPE "public"."enum_staff_staff_type";
  DROP TYPE "public"."enum_staff_contract_type";
  DROP TYPE "public"."enum_staff_employment_status";
  DROP TYPE "public"."enum_campaigns_campaign_type";
  DROP TYPE "public"."enum_campaigns_status";
  DROP TYPE "public"."enum_ads_templates_template_type";
  DROP TYPE "public"."enum_ads_templates_status";
  DROP TYPE "public"."enum_ads_templates_tone";
  DROP TYPE "public"."enum_ads_templates_language";
  DROP TYPE "public"."enum_leads_preferred_contact_method";
  DROP TYPE "public"."enum_leads_preferred_contact_time";
  DROP TYPE "public"."enum_leads_status";
  DROP TYPE "public"."enum_leads_priority";
  DROP TYPE "public"."enum_blog_posts_status";
  DROP TYPE "public"."enum_blog_posts_language";
  DROP TYPE "public"."enum_faqs_category";
  DROP TYPE "public"."enum_faqs_status";
  DROP TYPE "public"."enum_faqs_language";
  DROP TYPE "public"."enum_audit_logs_action";
  DROP TYPE "public"."enum_audit_logs_collection_name";
  DROP TYPE "public"."enum_audit_logs_user_role";
  DROP TYPE "public"."enum_audit_logs_status";`)
}
