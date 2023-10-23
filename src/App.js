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
  Dot,
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
  const [currentInterval, setCurrentInterval] = useState(0);
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
  
        const response = await axios.get(`${apiUrl}/poll`);
        const data = response.data;
  
        setTotalRecords(data.totalRecords);
        setResponseTimes((prevResponseTimes) => [...prevResponseTimes, data.responseTime].slice(-300));
  
        const dataSizeInMB = data.totalRecords * calculateDataSizePerRecordInMB();
        setCumulativeDataSize((prevCumulativeDataSize) => prevCumulativeDataSize + dataSizeInMB);
  
        const costForLastRequest = dataSizeInMB * selectedCostValue;
        setCumulativeCost(prevCumulativeCost => prevCumulativeCost + costForLastRequest);
  
        setChartData((prevChartData) => {
          // const newCostFactorChanges = [...costFactorChanges];

          const interval = currentInterval + 1;
          const newCumulativeCost = prevChartData.length === 0
            ? costForLastRequest
            : prevChartData[prevChartData.length - 1].cumulativeCost + costForLastRequest;
  
          let newCostFactorChanges = [...costFactorChanges];
          if (costFactorChanges.length === 0 || selectedCostValue !== costFactorChanges[costFactorChanges.length - 1].costFactor) {
            newCostFactorChanges.push({ interval: currentInterval, costFactor: selectedCostValue });
          }

          if (costFactorChanges.length !== newCostFactorChanges.length) {
            setCostFactorChanges(newCostFactorChanges);
          }
  
          const projectedCosts = newCostFactorChanges.map((change, index) => {
            if (interval < change.interval) {
              return prevChartData.length === 0 ? 0 : prevChartData[prevChartData.length - 1].projectedCosts[index];
            } else {
              const previousData = prevChartData.find(d => d.interval === interval - 1) || { projectedCosts: Array(newCostFactorChanges.length).fill(0) };
              return previousData.projectedCosts[index] + dataSizeInMB * change.costFactor;
            }
          });
  
          const newEntry = {
            interval: interval,
            responseTime: data.responseTime,
            cumulativeCost: newCumulativeCost,
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
  }, [selectedCostValue, currentInterval, costFactorChanges, apiUrl]);  
  

  const calculateDataSizePerRecordInMB = () => {
    return 0.1; // Assuming each record is 0.1 MB for illustration purposes
  };

  const getLineColor = (index) => {
    const colors = ['#ff6b6b', '#ffc658']; // Add more colors as needed
    return colors[index % colors.length];
  };

  return (
    <div className="container">
      <h2>Multicloud Application Performance over Time</h2>
      <LineChart width={1200} height={300} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="interval" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="responseTime" name="Response Time (s)" stroke="#8884d8" strokeWidth={3} />
      </LineChart>
      <p>Total Amount of Data: {totalRecords}</p>
      
      {/* <p>Last Response Time: {responseTimes.length > 0 ? parseFloat(responseTimes[responseTimes.length - 1].toFixed(2)) : 0} seconds</p> */}
      <h3>Cumulative Data Size Requested: {cumulativeDataSize.toFixed(2)} MB</h3>
      <br></br>
      <h2>Total Data Egress Costs over Time</h2>
      
      {/* <p>Relative Cost Factor: {selectedCostValue}</p> */}
      {/* <p>Cost for Last Request: {costForLastRequestDisplay.toFixed(2)}</p> */}

      
      <LineChart width={1200} height={400} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="interval" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="cumulativeCost" name="Cumulative Cost" stroke="#82ca9d" strokeWidth={3}>
          {costFactorChanges.map((change, index) => (
            <Dot key={index} x={chartData.find(d => d.interval === change.interval)?.interval} stroke="red" strokeWidth={2} />
          ))}
        </Line>
        {costFactorChanges.map((change, index) => (
          <Line 
            key={index}
            type="monotone" 
            dataKey={d => d.interval >= change.interval ? d.projectedCosts[index] : null}
            name={`Projected Cost (Phase ${index + 1})`} 
            stroke={getLineColor(index)} 
            strokeWidth={3}
            dot={false}
          />
        ))}
      </LineChart>
      <h3>Current Transport Mechanism: {selectedCostKey}</h3>
    </div>
  );
}

export default App;
