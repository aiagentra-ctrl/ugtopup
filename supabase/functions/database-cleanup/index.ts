import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const summary: Record<string, { affected: number; details: string }> = {};

    // 1. Read cleanup settings
    const { data: settings, error: settingsErr } = await supabase
      .from("cleanup_settings")
      .select("*");

    if (settingsErr) throw settingsErr;

    const getSetting = (key: string) =>
      settings?.find((s: any) => s.setting_key === key);

    // 2. Clean notifications
    const notifSetting = getSetting("notification_retention_days");
    if (notifSetting?.is_enabled) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - notifSetting.setting_value);
      const cutoffStr = cutoff.toISOString();

      // Get old notification IDs
      const { data: oldNotifs } = await supabase
        .from("notifications")
        .select("id")
        .lt("created_at", cutoffStr);

      if (oldNotifs && oldNotifs.length > 0) {
        const ids = oldNotifs.map((n: any) => n.id);
        // Delete user_notifications first
        await supabase
          .from("user_notifications")
          .delete()
          .in("notification_id", ids);
        // Then delete notifications
        const { count } = await supabase
          .from("notifications")
          .delete()
          .in("id", ids)
          .select("*", { count: "exact", head: true });

        summary.notifications = {
          affected: oldNotifs.length,
          details: `Deleted ${oldNotifs.length} notifications older than ${notifSetting.setting_value} days`,
        };
      } else {
        summary.notifications = { affected: 0, details: "No old notifications" };
      }
    }

    // 3. Clean chatbot conversations
    const chatSetting = getSetting("chatbot_retention_days");
    if (chatSetting?.is_enabled) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - chatSetting.setting_value);

      const { data: deleted } = await supabase
        .from("chatbot_conversations")
        .delete()
        .lt("created_at", cutoff.toISOString())
        .select("id");

      summary.chatbot = {
        affected: deleted?.length || 0,
        details: `Deleted ${deleted?.length || 0} chatbot conversations older than ${chatSetting.setting_value} days`,
      };
    }

    // 4. Clean activity logs
    const actSetting = getSetting("activity_log_retention_days");
    if (actSetting?.is_enabled) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - actSetting.setting_value);

      const { data: deleted } = await supabase
        .from("activity_logs")
        .delete()
        .lt("created_at", cutoff.toISOString())
        .select("id");

      summary.activity_logs = {
        affected: deleted?.length || 0,
        details: `Deleted ${deleted?.length || 0} activity logs older than ${actSetting.setting_value} days`,
      };
    }

    // 5. Deactivate expired offers
    const offerSetting = getSetting("offer_retention_days");
    if (offerSetting?.is_enabled) {
      const now = new Date().toISOString();
      const { data: expired } = await supabase
        .from("offers")
        .update({ is_active: false })
        .eq("is_active", true)
        .not("timer_end_date", "is", null)
        .lt("timer_end_date", now)
        .select("id");

      summary.offers = {
        affected: expired?.length || 0,
        details: `Deactivated ${expired?.length || 0} expired offers`,
      };
    }

    // 6. Archive old orders
    const archiveSetting = getSetting("order_archive_days");
    if (archiveSetting?.is_enabled) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - archiveSetting.setting_value);

      const { data: oldOrders } = await supabase
        .from("product_orders")
        .select("*")
        .in("status", ["completed", "canceled"])
        .lt("created_at", cutoff.toISOString())
        .limit(500);

      if (oldOrders && oldOrders.length > 0) {
        const archiveRows = oldOrders.map((o: any) => ({
          id: o.id,
          user_id: o.user_id,
          user_email: o.user_email,
          user_name: o.user_name,
          order_number: o.order_number,
          product_category: o.product_category,
          product_name: o.product_name,
          package_name: o.package_name,
          quantity: o.quantity,
          price: o.price,
          product_details: o.product_details,
          status: o.status,
          payment_method: o.payment_method,
          credits_deducted: o.credits_deducted,
          metadata: o.metadata,
          admin_remarks: o.admin_remarks,
          reviewed_by: o.reviewed_by,
          transaction_id: o.transaction_id,
          cancellation_reason: o.cancellation_reason,
          failure_reason: o.failure_reason,
          created_at: o.created_at,
          updated_at: o.updated_at,
          confirmed_at: o.confirmed_at,
          completed_at: o.completed_at,
          canceled_at: o.canceled_at,
          failed_at: o.failed_at,
          processing_started_at: o.processing_started_at,
        }));

        const { error: insertErr } = await supabase
          .from("archived_orders")
          .upsert(archiveRows, { onConflict: "id" });

        if (!insertErr) {
          const ids = oldOrders.map((o: any) => o.id);
          await supabase.from("product_orders").delete().in("id", ids);
        }

        summary.orders = {
          affected: oldOrders.length,
          details: `Archived ${oldOrders.length} orders older than ${archiveSetting.setting_value} days`,
        };
      } else {
        summary.orders = { affected: 0, details: "No orders to archive" };
      }
    }

    // 7. Clean chatbot feedback
    const feedbackSetting = getSetting("chatbot_feedback_retention_days");
    if (feedbackSetting?.is_enabled) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - feedbackSetting.setting_value);

      const { data: deleted } = await supabase
        .from("chatbot_feedback")
        .delete()
        .lt("created_at", cutoff.toISOString())
        .select("id");

      summary.chatbot_feedback = {
        affected: deleted?.length || 0,
        details: `Deleted ${deleted?.length || 0} chatbot feedback older than ${feedbackSetting.setting_value} days`,
      };
    }

    // 8. Log each cleanup action
    const logEntries = Object.entries(summary).map(([type, data]) => ({
      cleanup_type: type,
      records_affected: data.affected,
      details: data.details,
    }));

    if (logEntries.length > 0) {
      await supabase.from("cleanup_logs").insert(logEntries);
    }

    // 9. Update last_run_at for all settings
    const now = new Date().toISOString();
    for (const s of settings || []) {
      if (s.is_enabled) {
        await supabase
          .from("cleanup_settings")
          .update({ last_run_at: now, updated_at: now })
          .eq("id", s.id);
      }
    }

    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
