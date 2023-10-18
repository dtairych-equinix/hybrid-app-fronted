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

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  useEffect(() => {
    const pollServer = async () => {
      try {
        const costFactorResponse = await axios.get(`${apiUrl}/get-cost-factor`);
        const { selectedCostKey, selectedCostValue } = costFactorResponse.data;
        setSelectedCostKey(selectedCostKey);
        setSelectedCostValue(selectedCostValue);
  
        const response = await axios.get(`${apiUrl}/poll`);
        // setCurrentInterval(prevInterval => prevInterval + 1);
        const data = response.data;
  
        setTotalRecords(data.totalRecords);
  
        setResponseTimes((prevResponseTimes) => [...prevResponseTimes, data.responseTime].slice(-50));
  
        const dataSizeInMB = data.totalRecords * calculateDataSizePerRecordInMB();
        setCumulativeDataSize((prevCumulativeDataSize) => prevCumulativeDataSize + dataSizeInMB);
        
  
        const costForLastRequest = dataSizeInMB * selectedCostValue;
        setCumulativeCost(prevCumulativeCost => prevCumulativeCost + costForLastRequest);

        console.log("Data Size in MB:", dataSizeInMB);
        console.log("Cost for Last Request:", costForLastRequest);
        console.log("Previous Cumulative Cost:", cumulativeCost);


        setChartData((prevChartData) => {
          
          
          const newEntry = {
            // Using currentInterval + 1 because the state update is scheduled, but not yet effective.
            interval: currentInterval + 1,
            responseTime: data.responseTime,
            cumulativeCost: prevChartData.length === 0 
                ? costForLastRequest 
                : (prevChartData[prevChartData.length - 1].cumulativeCost + costForLastRequest)
          };  
          setCurrentInterval(prevInterval => prevInterval + 1);
          return [...prevChartData, newEntry].slice(-50);
        });

        setCostForLastRequestDisplay(costForLastRequest);
      } catch (error) {
        console.log('Error fetching data -', error);
      }
    };
  
    const interval = setInterval(pollServer, 5000);
    return () => clearInterval(interval);
  }, []); 

  const calculateDataSizePerRecordInMB = () => {
    return 0.1; // Assuming each record is 0.1 MB for illustration purposes
  };

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
