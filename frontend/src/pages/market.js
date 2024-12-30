import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale, // Register category scale for x-axis
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend);


function Market() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    // Mock data for AAPL stock prices (monthly intervals)
    const fetchStockData = async () => {
      try {
        const response = await axios.get(
          'https://api.example.com/aapl-stock-data', // Replace with real API endpoint
          { params: { interval: '1mo', range: '1y' } }
        );

        //mock data
        const data = response.data;

        setChartData({
          labels: data.labels,
          datasets: [
            {
              label: 'AAPL Stock Price (USD)',
              data: data.prices,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              fill: true,
            },
          ],
        });
      } catch (error) {
        console.error('Error fetching stock data:', error);
      }
    };

    //hardcoded data
    setChartData({
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          //label: 'AAPL Stock Price (USD)',
          data: [150, 155, 160, 162, 158, 165, 170, 172, 168, 174, 180, 185],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          fill: true,
        },
      ],
    });

    // fetchStockData();
  }, []);

  return (
    <div className='market'>
      <div className='chart-section'>
        {chartData ? (
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                  position: 'top',
                },
                title: {
                  display: true,
                  text: 'AAPL Stock Price (USD)',
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    //text: 'Month',
                  },
                  grid: {
                    display: false, // Show gridlines
                    drawOnChartArea: true, // Toggle visibility of horizontal gridlines
                    color: 'rgba(0, 0, 0, 0.1)', // Light gray color for lines
                  },
                },
                y: {
                  title: {
                    display: true,
                    //text: 'Price (USD)',
                  },
                  grid: {
                    display: true, // Show gridlines
                    drawOnChartArea: true, // Toggle visibility of horizontal gridlines
                    color: 'rgba(0, 0, 0, 0.1)', // Light gray color for lines
                  },
                  beginAtZero: false,
                },
              },
              elements: {
                line: {
                  borderWidth: 2, // Line thickness
                  borderColor: '#3b82f6', // Line color
                },
                point: {
                  radius: (ctx) => {
                    // Show points only for the latest data point
                    const dataIndex = ctx.dataIndex; // Index of the data point
                    const datasetLength = ctx.dataset.data.length; // Total number of data points
                    return dataIndex === datasetLength - 1 ? 5 : 0; // Show radius 5 for the latest, 0 for others
                  },
                  hoverRadius: (ctx) => {
                    const dataIndex = ctx.dataIndex;
                    const datasetLength = ctx.dataset.data.length;
                    return dataIndex === datasetLength - 1 ? 7 : 0; // Show radius 7 on hover for the latest
                  },
                },
              },
            }}
          />
        ) : (
          <p>Loading chart...</p>
        )}
      </div>
      <div className='order-section'>
        <h2>Order Section</h2>
        <p>Order details and functionalities will go here.</p>
      </div>
    </div>
  );
}

export default Market;
