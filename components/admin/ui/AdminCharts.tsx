"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface RevenueChartProps {
  labels?: string[];
  revenueData?: number[];
  ordersData?: number[];
}

export function RevenueOrdersChart({
  labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
  revenueData = [120000, 190000, 150000, 280000, 240000, 320000, 410000],
}: RevenueChartProps) {
  const data = {
    labels,
    datasets: [
      {
        fill: true,
        label: "Revenue (₹)",
        data: revenueData,
        borderColor: "#d9a441",
        backgroundColor: "rgba(214, 160, 79, 0.08)",
        tension: 0.35,
        borderWidth: 2,
        pointBackgroundColor: "#d9a441",
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#f8fafc",
        bodyColor: "#f8fafc",
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: function (context: any) {
            return ` ₹${context.parsed.y.toLocaleString("en-IN")}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#94a3b8",
          font: { size: 12 },
        },
      },
      y: {
        grid: {
          color: "#f1f5f9",
        },
        ticks: {
          color: "#94a3b8",
          font: { size: 12 },
          callback: function (value: any) {
            return `₹${value >= 1000 ? `${value / 1000}k` : value}`;
          },
        },
      },
    },
  };

  return (
    <div className="w-full h-72">
      <Line data={data} options={options} />
    </div>
  );
}

interface LeadStatusChartProps {
  newLeads?: number;
  contacted?: number;
  qualified?: number;
  converted?: number;
}

export function LeadStatusChart({
  newLeads = 12,
  contacted = 18,
  qualified = 9,
  converted = 15,
}: LeadStatusChartProps) {
  const data = {
    labels: ["New", "Contacted", "Qualified", "Converted"],
    datasets: [
      {
        data: [newLeads, contacted, qualified, converted],
        backgroundColor: ["#d9a441", "#4a0b52", "#f59e0b", "#10b981"],
        borderColor: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          boxWidth: 12,
          padding: 16,
          color: "#64748b",
          font: { size: 12 },
        },
      },
    },
  };

  return (
    <div className="w-full h-72 flex items-center justify-center">
      <Doughnut data={data} options={options} />
    </div>
  );
}
