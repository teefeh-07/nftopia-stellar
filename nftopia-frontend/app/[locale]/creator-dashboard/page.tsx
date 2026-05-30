"use client";

import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { TrendingUp, Users, DollarSign, Package } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/lib/stores/preferences-store";
import { useLocalizedRoute } from "@/lib/routing";
import { useExperimentVariant } from '@/hooks/useExperiment';
import { useEffect, useRef } from 'react';
import { telemetry } from '@/lib/telemetry';
import { sanitizeTelemetryPayload } from '@/lib/telemetry/sanitizer';
import { EVENT_NAMES } from '@/lib/telemetry/events';

export default function CreatorDashboardPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const localizedRoute = useLocalizedRoute();
  const copyAssignment = useExperimentVariant('creator-onboarding-copy-2026-q2');
  const exposureSentRef = useRef(false);
  const exposureSessionIdRef = useRef<string | null>(null);
  const exposureTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (!copyAssignment || exposureSentRef.current) return;
    const exposureSessionId = crypto.randomUUID();
    exposureSessionIdRef.current = exposureSessionId;
    exposureTimestampRef.current = Date.now();
    telemetry.track(
      EVENT_NAMES.experimentExposed,
      sanitizeTelemetryPayload({
        experiment_id: copyAssignment.experiment_id,
        experiment_name: 'Creator Onboarding Copy Variants',
        variant_id: copyAssignment.variant_id,
        variant_name: copyAssignment.variant_name,
        variant_version: 1,
        surface: 'creator_dashboard_cta',
        placement_category: 'inline_card',
        cta_label: copyAssignment.variant_name,
        assigned_at_timestamp_ms: copyAssignment.assigned_at_timestamp_ms,
        is_control: copyAssignment.is_control,
        target_user_segment: 'creators_only',
        rollout_percentage: 100,
        exposure_session_id: exposureSessionId,
        experiment_session_id: '',
      })
    );
    exposureSentRef.current = true;
  }, [copyAssignment]);

  const handleCreateCollectionClick = () => {
    if (!copyAssignment || !exposureSessionIdRef.current || !exposureTimestampRef.current) return;
    telemetry.track(
      EVENT_NAMES.experimentInteraction,
      sanitizeTelemetryPayload({
        experiment_id: copyAssignment.experiment_id,
        variant_id: copyAssignment.variant_id,
        interaction_type: 'click',
        interaction_timestamp_ms: Date.now(),
        time_to_interaction_ms: Date.now() - exposureTimestampRef.current,
        surface: 'creator_dashboard_cta',
        placement_category: 'inline_card',
        is_control: copyAssignment.is_control,
        exposure_session_id: exposureSessionIdRef.current,
        interaction_sequence: 1,
      })
    );
  };

  const dashboardCards = [
    {
      label: t("creatorDashboard.totalNFTs"),
      value: "142",
      change: "+12%",
      icon: Package,
      color: "text-purple-400",
    },
    {
      label: t("creatorDashboard.sales7d"),
      value: "3.2 STRK",
      change: "+24%",
      icon: DollarSign,
      color: "text-blue-400",
    },
    {
      label: t("creatorDashboard.royalties"),
      value: "0.8 STRK",
      change: "+5%",
      icon: TrendingUp,
      color: "text-green-400",
    },
    {
      label: t("creatorDashboard.followers"),
      value: "1.2K",
      change: "+18%",
      icon: Users,
      color: "text-red-400",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      action: "NFT #1234 sold",
      amount: "0.5 STRK",
      time: "2 hours ago",
      type: "sale",
    },
    {
      id: 2,
      action: "New collection created",
      amount: "Cosmic Dreams",
      time: "1 day ago",
      type: "collection",
    },
    {
      id: 3,
      action: "Royalty payment received",
      amount: "0.1 STRK",
      time: "3 days ago",
      type: "royalty",
    },
  ];

  return (
    <div className="p-6 lg:p-8 bg-background min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t("creatorDashboard.title") || "Creator Dashboard"}
        </h1>
        <p className="text-muted-foreground">
          {t("creatorDashboard.subtitle") || "Manage your NFTs and track your earnings"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <div
              key={card.label}
              className="bg-card border border-border text-card-foreground rounded-xl p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-muted ${card.color}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                  {card.change}
                </span>
              </div>
              <div className="text-2xl font-bold text-card-foreground mb-1">{card.value}</div>
              <div className="text-sm text-muted-foreground">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-semibold text-card-foreground">
            {t("creatorDashboard.recentActivity")}
          </div>
          <a 
            href="#" 
            className="text-primary font-medium hover:text-primary/80 transition-colors"
          >
            {t("creatorDashboard.viewAll")}
          </a>
        </div>
        
        <div className="space-y-4">
          {recentActivities.map((activity, index) => (
            <div
              key={activity.id}
              className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                index % 2 === 0 ? "bg-card" : "bg-background"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === "sale" ? "bg-green-400" :
                  activity.type === "collection" ? "bg-blue-400" :
                  "bg-purple-400"
                }`} />
                <div>
                  <div className="text-card-foreground font-medium">{activity.action}</div>
                  <div className="text-sm text-muted-foreground">{activity.time}</div>
                </div>
              </div>
              <div className="text-card-foreground font-semibold">{activity.amount}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-card-foreground">
              {t("creatorDashboard.mintNewNFT")}
            </h3>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
          <p className="text-muted-foreground mb-4">
            {t("creatorDashboard.singleOrBatch")}
          </p>
          <Link
            href={localizedRoute("/creator-dashboard/mint-nft")}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            {t("creatorDashboard.goToMint")}
          </Link>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-card-foreground">
              {t("creatorDashboard.createCollection")}
            </h3>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
          <p className="text-muted-foreground mb-4">
            {t("creatorDashboard.collectionDescription")}
          </p>
          <Link
            href={localizedRoute("/creator-dashboard/create-your-collection")}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            onClick={handleCreateCollectionClick}
          >
            {t("creatorDashboard.createCollection")}
          </Link>
        </div>
      </div>
    </div>
  );
}