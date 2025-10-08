import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem,
  TooltipLabelStyle,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface MonthlyChartProps {
  chartData: { name: string; Revenue: number; Expenses: number }[];
}

const MonthlyFinancialChart: React.FC<MonthlyChartProps> = ({ chartData }) => {
  const labels = chartData.map((d) => d.name);

  const data = {
    labels,
    datasets: [
      {
        label: "Expenses",
        data: chartData.map((d) => d.Expenses),
        backgroundColor: "#dc3545",
        borderRadius: 4,
        hoverBackgroundColor: "rgba(220, 53, 69, 0.7)",
      },
      {
        label: "Revenue",
        data: chartData.map((d) => d.Revenue),
        backgroundColor: "#0d6efd",
        borderRadius: 4,
        hoverBackgroundColor: "rgba(13, 110, 253, 0.7)",
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          padding: 15,
        },
        onClick: (event, legendItem, legend) => {
          const chart = legend.chart;
          const datasetIndex = legendItem.datasetIndex!;
          const meta = chart.getDatasetMeta(datasetIndex);
          meta.hidden = !meta.hidden;
          chart.update();
        },
      },
      tooltip: {
        enabled: true,
        mode: "index",
        intersect: false,
        backgroundColor: "#fff",
        titleColor: "#000",
        bodyColor: "#000",
        callbacks: {
          label: (tooltipItem: TooltipItem<"bar">) => {
            const datasetLabel = tooltipItem.dataset.label;
            const value = tooltipItem.formattedValue;
            if (datasetLabel === "Expenses") return `Expenses: ₹${value}`;
            if (datasetLabel === "Revenue") return `Revenue: ₹${value}`;
            return `${datasetLabel}: ${value}`;
          },
          labelColor: (tooltipItem: TooltipItem<"bar">): TooltipLabelStyle => {
            const datasetLabel = tooltipItem.dataset.label;
            if (datasetLabel === "Expenses") {
              return { backgroundColor: "#dc3545", borderColor: "#dc3545", borderWidth: 1 };
            }
            if (datasetLabel === "Revenue") {
              return { backgroundColor: "#0d6efd", borderColor: "#0d6efd", borderWidth: 1 };
            }
            return { backgroundColor: "#000", borderColor: "#000", borderWidth: 1 };
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#495057", font: { size: 12 } },
        grid: { display: false },
      },
      y: {
        ticks: { color: "#495057", font: { size: 12 } },
        grid: { color: "rgba(128,128,128,0.2)" },
      },
    },
  };

  return <Bar data={data} options={options} />;
};

export default MonthlyFinancialChart;