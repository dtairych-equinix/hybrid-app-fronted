import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import './App.css'; // Import the CSS file

function App() {
  const [responseTimes, setResponseTimes] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [cumulativeDataSize, setCumulativeDataSize] = useState(0);

  const apiUrl = process.env.API_URL;
  const apiPort = process.env.API_PORT;

  useEffect(() => {
    const pollServer = async () => {
      try {
        const response = await axios.get(`${apiUrl}:${apiPort}/poll`);
        const data = response.data;

        // Update the total records
        setTotalRecords(data.totalRecords);

        // Add the new response time to the array
        setResponseTimes((prevResponseTimes) => [...prevResponseTimes, data.responseTime]);

        // Limit the responseTimes array to the last 50 entries
        if (responseTimes.length > 50) {
          setResponseTimes((prevResponseTimes) => prevResponseTimes.slice(-50));
        }

        // Calculate the cumulative data size in MB and update the state
        const dataSizeInMB = data.totalRecords * calculateDataSizePerRecordInMB();
        setCumulativeDataSize((prevCumulativeDataSize) => prevCumulativeDataSize + dataSizeInMB);
      } catch (error) {
        console.log('Error fetching data -', error);
      }
    };

    // Poll the server every 5 seconds and update the responseTimes state
    const interval = setInterval(pollServer, 5000);

    // Cleanup the interval on component unmount
    return () => clearInterval(interval);
  }, [responseTimes]);

  const calculateDataSizePerRecordInMB = () => {
    // Replace this with your actual data size calculation logic
    // For example, you can estimate the average data size per record in MB
    // If you have the actual data size from the server, you can use it directly.
    return 0.1; // Assuming each record is 0.1 MB for illustration purposes
  };

  const chartData = responseTimes.map((time, idx) => ({ interval: idx + 1, responseTime: time }));

  return (
    <div className="container">
      <h1>Database Response Time Over Time</h1>
      <LineChart width={600} height={300} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="interval" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="responseTime" name="Response Time (s)" stroke="#8884d8" />
      </LineChart>
      <p>Total Records: {totalRecords}</p>
      <p>Last Response Time: {responseTimes.length > 0 ? responseTimes[responseTimes.length - 1] : 0} seconds</p>
      <h3>Cumulative Data Size Requested: {cumulativeDataSize.toFixed(2)} MB</h3>
    </div>
  );
}

export default App;
