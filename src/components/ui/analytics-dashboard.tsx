"use client";

import React, { useState, useEffect } from 'react';
import {
  LineChart, Line,
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];


const mockData = {
  lineChart: [
    { time: 'Jan', gpuUsed: 10 },
    { time: 'Feb', gpuUsed: 20 },
    { time: 'Mar', gpuUsed: 15 },
    { time: 'Apr', gpuUsed: 25 },
  ],
  pieChart: [
    { region: 'US-East', cost: 400 },
    { region: 'US-West', cost: 300 },
    { region: 'EU', cost: 200 },
    { region: 'Asia', cost: 100 },
  ],
  barChart: [
    { model: 'Whisper', frequency: 50 },
    { model: 'LLaMA', frequency: 30 },
    { model: 'SDXL', frequency: 20 },
  ],
};

export default function AnalyticsDashboard() {
    return (
        <div className="analytics-dashboard space-y-12">
        <h2 className="text-2xl font-semibold">Analytics Dashboard</h2>

        {/* Line Chart: GPU Usage Over Time */}
        <div className="chart-container">
        <h3 className="text-lg font-medium mb-2">GPU Usage Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mockData.lineChart}>
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="gpuUsed" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
        </div>
        {/* Pie Chart: Cost Breakdown by Region */}
        <div className="chart-container">
        <h3 className="text-lg font-medium mb-2">Cost Breakdown by Region</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={mockData.pieChart}
              dataKey="cost"
              nameKey="region"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {mockData.pieChart.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        </div>
        {/* Bar Chart: Model Usage Frequency */}
        <div className="chart-container">
        <h3 className="text-lg font-medium mb-2">Model Frequency</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mockData.barChart}>
            <XAxis dataKey="model" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="frequency" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
        </div>
        </div>    
      );
}