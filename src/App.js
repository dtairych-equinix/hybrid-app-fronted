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
import './App.css';

function App() {
  const [responseTimes, setResponseTimes] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [cumulativeDataSize, setCumulativeDataSize] = useState(0);
  const [selectedCostKey, setSelectedCostKey] = useState('Internet');
  const [selectedCostValue, setSelectedCostValue] = useState(1.0);
  const [cumulativeCost, setCumulativeCost] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [costForLastRequestDisplay, setCostForLastRequestDisplay] = useState(0);
  const [currentInterval, setCurrentInterval] = useState(1);
  const [costFactorChanges, setCostFactorChanges] = useState([]);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';  // default to localhost if not provided

  useEffect(() => {
    const pollServer = async () => {
      try {
        // ... existing code ...

        const costFactorResponse = await axios.get(`${apiUrl}/get-cost-factor`);
        const { selectedCostKey, selectedCostValue } = costFactorResponse.data;
        setSelectedCostKey(selectedCostKey);
        setSelectedCostValue(selectedCostValue);

        if (costFactorChanges.length === 0 || selectedCostValue !== costFactorChanges[costFactorChanges.length - 1].costFactor) {
          setCostFactorChanges(prev => [...prev, { interval: currentInterval, costFactor: selectedCostValue }]);
        }

        const response = await axios.get(`${apiUrl}/poll`);
        const data = response.data;

        setTotalRecords(data.totalRecords);
        setResponseTimes((prevResponseTimes) => [...prevResponseTimes, data.responseTime].slice(-300));

        const dataSizeInMB = data.totalRecords * calculateDataSizePerRecordInMB();
        setCumulativeDataSize((prevCumulativeDataSize) => prevCumulativeDataSize + dataSizeInMB);

        const costForLastRequest = dataSizeInMB * selectedCostValue;
        setCumulativeCost(prevCumulativeCost => prevCumulativeCost + costForLastRequest);

        setChartData((prevChartData) => {
          const interval = currentInterval + 1;
          const projectedCosts = costFactorChanges.map((change, index) => {
            if (interval < change.interval) {
              return 0;
            } else {
              const previousInterval = change.interval === 0 ? 0 : change.interval - 1;
              const previousData = prevChartData.find(d => d.interval === previousInterval) || { projectedCosts: Array(costFactorChanges.length).fill(0) };
              return previousData.projectedCosts[index] + (dataSizeInMB * change.costFactor);
            }
          });

          const newEntry = {
            interval: interval,
            responseTime: data.responseTime,
            cumulativeCost: prevChartData.length === 0 
                ? costForLastRequest 
                : (prevChartData[prevChartData.length - 1].cumulativeCost + costForLastRequest),
            projectedCosts: projectedCosts
          };

          return [...prevChartData, newEntry].slice(-300);
        });

        setCurrentInterval(prevInterval => prevInterval + 1);
        setCostForLastRequestDisplay(costForLastRequest);
      } catch (error) {
        console.log('Error fetching data -', error);
      }
    };

    const interval = setInterval(pollServer, 10000);
    return () => clearInterval(interval);
  }, [selectedCostValue, currentInterval]);

  const calculateDataSizePerRecordInMB = () => {
    return 0.1; // Assuming each record is 0.1 MB for illustration purposes
  };

  const getLineColor = (index) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8884d8']; // Add more colors as needed
    return colors[index % colors.length];
  };

  return (
    <div className="container">
      <h1>Database Response Time Over Time</h1>
      <LineChart width={1200} height={300} data={chartData}>
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
      <LineChart width={1200} height={300} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="interval" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="cumulativeCost" name="Cumulative Cost" stroke="#82ca9d" />
        {costFactorChanges.map((change, index) => (
          <Line 
            key={index}
            type="monotone" 
            dataKey={`projectedCosts[${index}]`} 
            name={`Projected Cost (Phase ${index + 1})`} 
            stroke={getLineColor(index)} 
            dot={false}
          />
        ))}
      </LineChart>
    </div>
  );
}

export default App;
