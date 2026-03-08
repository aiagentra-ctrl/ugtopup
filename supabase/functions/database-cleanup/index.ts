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

      const { data: oldNotifs } = await supabase
        .from("notifications")
        .select("id")
        .lt("created_at", cutoffStr);

      if (oldNotifs && oldNotifs.length > 0) {
        const ids = oldNotifs.map((n: any) => n.id);
        await supabase
          .from("user_notifications")
          .delete()
          .in("notification_id", ids);
        await supabase.from("notifications").delete().in("id", ids);

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

    // 8. Clean expired coupons
    const couponSetting = getSetting("expired_coupon_retention_days");
    if (couponSetting?.is_enabled) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - couponSetting.setting_value);

      const { data: deleted } = await supabase
        .from("coupons")
        .delete()
        .eq("is_used", false)
        .lt("expires_at", cutoff.toISOString())
        .select("id");

      summary.expired_coupons = {
        affected: deleted?.length || 0,
        details: `Deleted ${deleted?.length || 0} expired unused coupons older than ${couponSetting.setting_value} days`,
      };
    }

    // 9. Log each cleanup action
    const logEntries = Object.entries(summary).map(([type, data]) => ({
      cleanup_type: type,
      records_affected: data.affected,
      details: data.details,
    }));

    if (logEntries.length > 0) {
      await supabase.from("cleanup_logs").insert(logEntries);
    }

    // 10. Update last_run_at for all settings
    const now = new Date().toISOString();
    for (const s of settings || []) {
      if (s.is_enabled) {
        await supabase
          .from("cleanup_settings")
          .update({ last_run_at: now, updated_at: now })
          .eq("id", s.id);
      }
    }

    // ========== ALERT GENERATION ==========

    // Alert: Pending orders older than 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { count: stalePendingOrders } = await supabase
      .from("product_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lt("created_at", twoHoursAgo);

    if (stalePendingOrders && stalePendingOrders > 0) {
      await supabase.from("notifications").insert({
        title: "⚠️ Stale Pending Orders",
        message: `${stalePendingOrders} order(s) have been pending for over 2 hours and need attention.`,
        target_type: "all",
        notification_type: "admin",
        is_active: true,
      });
    }

    // Alert: Pending credit requests older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: staleCreditReqs } = await supabase
      .from("payment_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lt("created_at", oneHourAgo);

    if (staleCreditReqs && staleCreditReqs > 0) {
      await supabase.from("notifications").insert({
        title: "💳 Pending Credit Requests",
        message: `${staleCreditReqs} credit request(s) have been waiting for over 1 hour.`,
        target_type: "all",
        notification_type: "admin",
        is_active: true,
      });
    }

    // Alert: Too many failed orders today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: failedToday } = await supabase
      .from("product_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "canceled")
      .gte("canceled_at", todayStart.toISOString());

    if (failedToday && failedToday > 3) {
      await supabase.from("notifications").insert({
        title: "🔴 High Failed Orders",
        message: `${failedToday} orders have failed/been canceled today. Please investigate.`,
        target_type: "all",
        notification_type: "admin",
        is_active: true,
      });
    }

    // ========== DAILY REPORT GENERATION ==========
    const today = new Date().toISOString().split("T")[0];

    const { count: todayOrders } = await supabase
      .from("product_orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString());

    const { data: revenueData } = await supabase
      .from("product_orders")
      .select("price")
      .gte("created_at", todayStart.toISOString())
      .in("status", ["completed", "confirmed"]);

    const todayRevenue = revenueData?.reduce((sum: number, o: any) => sum + (o.price || 0), 0) || 0;

    const { count: todayCreditReqs } = await supabase
      .from("payment_requests")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString());

    const { count: todayChatbot } = await supabase
      .from("chatbot_conversations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString());

    const { count: pendingOrders } = await supabase
      .from("product_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: activeUsers } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    // Get record counts for database stats
    const { count: totalOrders } = await supabase
      .from("product_orders")
      .select("id", { count: "exact", head: true });
    const { count: totalArchived } = await supabase
      .from("archived_orders")
      .select("id", { count: "exact", head: true });
    const { count: totalNotifs } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true });
    const { count: totalActivity } = await supabase
      .from("activity_logs")
      .select("id", { count: "exact", head: true });

    await supabase.from("system_daily_reports").upsert(
      {
        report_date: today,
        total_orders: todayOrders || 0,
        total_revenue: todayRevenue,
        total_credit_requests: todayCreditReqs || 0,
        total_chatbot_interactions: todayChatbot || 0,
        pending_orders: pendingOrders || 0,
        failed_orders: failedToday || 0,
        active_users: activeUsers || 0,
        database_stats: {
          total_orders: totalOrders || 0,
          archived_orders: totalArchived || 0,
          notifications: totalNotifs || 0,
          activity_logs: totalActivity || 0,
        },
      },
      { onConflict: "report_date" }
    );

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
