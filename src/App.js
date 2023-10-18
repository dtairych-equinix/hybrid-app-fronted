// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
// import './App.css'; // Import the CSS file

// function App() {
//   const [responseTimes, setResponseTimes] = useState([]);
//   const [totalRecords, setTotalRecords] = useState(0);
//   const [cumulativeDataSize, setCumulativeDataSize] = useState(0);
//   // const [costFactor, setCostFactor] = useState(1); // Initial factor value
//   const [selectedCostKey, setSelectedCostKey] = useState('Internet');
//   const [selectedCostValue, setSelectedCostValue] = useState(1.0);
//   const [cumulativeCost, setCumulativeCost] = useState(0);

//   useEffect(() => {
//     const pollServer = async () => {
//       try {
//         const costResponse = await axios.get('http://20.160.160.36:4000/get-cost-factor');

//         const { selectedCostKey, selectedCostValue } = costResponse.data;
//         setSelectedCostKey(selectedCostKey);
//         setSelectedCostValue(selectedCostValue);

//         const response = await axios.get(`http://20.160.160.36:4000/poll`);
//         const data = response.data;

//         // Update the total records
//         setTotalRecords(data.totalRecords);

//         // Add the new response time to the array
//         setResponseTimes((prevResponseTimes) => [...prevResponseTimes, data.responseTime]);

//         // Limit the responseTimes array to the last 50 entries
//         if (responseTimes.length > 50) {
//           setResponseTimes((prevResponseTimes) => prevResponseTimes.slice(-50));
//         }

//         // Calculate the cumulative data size in MB and update the state
//         const dataSizeInMB = data.totalRecords * calculateDataSizePerRecordInMB();
//         setCumulativeDataSize((prevCumulativeDataSize) => prevCumulativeDataSize + dataSizeInMB);
//         const costForLastRequest = data.totalRecords * calculateDataSizePerRecordInMB() * selectedCostValue;
//         setCumulativeCost((prevCumulativeCost) => prevCumulativeCost + costForLastRequest);

//       } catch (error) {
//         console.log('Error fetching data -', error);
//       }
//     };
    
//     // Poll the server every 5 seconds and update the responseTimes state
//     const interval = setInterval(pollServer, 5000);

//     // Cleanup the interval on component unmount
//     return () => clearInterval(interval);
//   },[responseTimes, totalRecords, cumulativeDataSize, selectedCostValue, selectedCostKey]);

//   const calculateDataSizePerRecordInMB = () => {
//     // Replace this with your actual data size calculation logic
//     // For example, you can estimate the average data size per record in MB
//     // If you have the actual data size from the server, you can use it directly.
//     return 0.1; // Assuming each record is 0.1 MB for illustration purposes
//   };

//   // const costFactor = costFactors[selectedCostKey] || 1.0;

//   // const chartData = responseTimes.map((time, idx) => ({ interval: idx + 1, responseTime: time }));
//   const chartData = responseTimes.map((time, idx) => ({
//     interval: idx + 1,
//     responseTime: time,
//     cumulativeCost: cumulativeCost - (idx === 0 ? 0 : chartData[idx - 1].cumulativeCost),
//   }));

//   const costForLastRequestDisplay = responseTimes.length > 0 ? cumulativeCost - chartData[chartData.length - 2]?.cumulativeCost : 0;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import './App.css'; // Import the CSS file

function App() {
  const [responseTimes, setResponseTimes] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [cumulativeDataSize, setCumulativeDataSize] = useState(0);
  const [selectedCostKey, setSelectedCostKey] = useState('Internet');
  const [selectedCostValue, setSelectedCostValue] = useState(1.0);
  const [cumulativeCost, setCumulativeCost] = useState(0);
  const [chartData, setChartData] = useState([]); // Initialize chartData

  useEffect(() => {
    const pollServer = async () => {
      try {
        // Fetch the current cost factor from the server with every poll
        const costFactorResponse = await axios.get('/get-cost-factor');
        const { selectedCostKey, selectedCostValue } = costFactorResponse.data;
        setSelectedCostKey(selectedCostKey);
        setSelectedCostValue(selectedCostValue);

        const response = await axios.get(`http://20.160.160.36:4000/poll`);
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

        // Calculate the cost for the last request
        const costForLastRequest = data.totalRecords * calculateDataSizePerRecordInMB() * selectedCostValue;
        setCumulativeCost((prevCumulativeCost) => prevCumulativeCost + costForLastRequest);

        // Calculate chartData here and set it
        const newChartData = responseTimes.map((time, idx) => ({
          interval: idx + 1,
          responseTime: time,
          cumulativeCost: cumulativeCost - (idx === 0 ? 0 : chartData[idx - 1].cumulativeCost),
        }));
        setChartData(newChartData);
      } catch (error) {
        console.log('Error fetching data -', error);
      }
    };

    // Poll the server every 5 seconds and update the responseTimes state
    const interval = setInterval(pollServer, 5000);

    // Cleanup the interval on component unmount
    return () => clearInterval(interval);
  }, [responseTimes, selectedCostValue, cumulativeCost]); // Include selectedCostValue and cumulativeCost in the dependency array

  const calculateDataSizePerRecordInMB = () => {
    // Replace this with your actual data size calculation logic
    // For example, you can estimate the average data size per record in MB
    // If you have the actual data size from the server, you can use it directly.
    return 0.1; // Assuming each record is 0.1 MB for illustration purposes
  };

  // Calculate the cost for the last request display
  const costForLastRequestDisplay =
    responseTimes.length > 0
      ? cumulativeCost - (responseTimes.length === 1 ? 0 : cumulativeCost - responseTimes[responseTimes.length - 2])
      : 0;
      
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

      <p>Current Cost Factor Key: {selectedCostKey}</p>
      <p>Current Cost Factor Value: {selectedCostValue}</p>
      <p>Cost for Last Request: {costForLastRequestDisplay.toFixed(2)}</p>
      <LineChart width={600} height={300} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="interval" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="cumulativeCost" name="Cumulative Cost" stroke="#82ca9d" />
      </LineChart>

    </div>
  );
}

export default App;
