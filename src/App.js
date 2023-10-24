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
  const [prevSelectedCostKey, setPrevSelectedCostKey] = useState('Internet');
  const [prevSelectedCostValue, setPrevSelectedCostValue] = useState(1.0);
  const [cumulativeCost, setCumulativeCost] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [costForLastRequestDisplay, setCostForLastRequestDisplay] = useState(0);
  const [currentInterval, setCurrentInterval] = useState(0);
  const [costFactorChanges, setCostFactorChanges] = useState([]);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';  // default to localhost if not provided

  const costScale = 0.625

  useEffect(() => {
    console.log(chartData);
  }, [chartData]);

  useEffect(() => {
    const pollServer = async () => {
      try {
        // ... existing code ...
  
        const costFactorResponse = await axios.get(`${apiUrl}/get-cost-factor`);
        const { selectedCostKey, selectedCostValue } = costFactorResponse.data;
        setSelectedCostKey(selectedCostKey);
        setSelectedCostValue(selectedCostValue);

        let newCostFactorChanges = [...costFactorChanges];
        if (selectedCostKey !== prevSelectedCostKey) {
          const changeInterval = currentInterval - 1;

          

          console.log(`Current Interval is: ${currentInterval}`)
          setChartData((prevChartData) => {
            const newData = prevChartData.map((data) => {
              if (data.interval === currentInterval) {
                console.log(`Updating data for interval ${currentInterval}`)
                const newProjectedCosts = [...data.projectedCosts];
                // Assuming you want to add a new entry at the end of the projectedCosts array.
                newProjectedCosts[newCostFactorChanges.length - 1] = data.cumulativeCost;
                return { ...data, projectedCosts: newProjectedCosts };
              }
              return data;
            });
            return newData;
          });
          

          
          // setChartData((prevChartData) => {
          //   const lastDataIndex = prevChartData.length - 1;
          
          //   if (lastDataIndex >= 0) {
          //     const lastData = prevChartData[lastDataIndex];
          //     const newProjectedCosts = [...lastData.projectedCosts];
          
          //     newProjectedCosts[newCostFactorChanges.length - 1] = lastData.cumulativeCost;
          
          //     const updatedLastData = { ...lastData, projectedCosts: newProjectedCosts };
          
          //     const newData = [
          //       ...prevChartData.slice(0, lastDataIndex),
          //       updatedLastData,
          //     ];
          
          //     return newData;
          //   }
          
          //   return prevChartData;
          // });

          

          // Add the new cost factor change
          newCostFactorChanges.push({ interval: currentInterval, costFactor: prevSelectedCostValue });
          setCostFactorChanges(newCostFactorChanges);
          // newCostFactorChanges.push({ interval: currentInterval, costFactor: prevSelectedCostValue });
          // setCostFactorChanges(newCostFactorChanges);

    

        }
  
        const response = await axios.get(`${apiUrl}/poll`);
        const data = response.data;
  
        setTotalRecords(data.totalRecords);
        setResponseTimes((prevResponseTimes) => [...prevResponseTimes, data.responseTime].slice(-300));
  
        const dataSizeInMB = data.totalRecords * calculateDataSizePerRecordInMB();
        setCumulativeDataSize((prevCumulativeDataSize) => prevCumulativeDataSize + dataSizeInMB);
  
        const costForLastRequest = dataSizeInMB * selectedCostValue * costScale;
        setCumulativeCost(prevCumulativeCost => prevCumulativeCost + costForLastRequest);
  
        setChartData((prevChartData) => {
          // const newCostFactorChanges = [...costFactorChanges];
          const interval = currentInterval + 1;
          console.log(`Starting work on new chart data.  Interval is: ${interval}`)

          const newCumulativeCost = prevChartData.length === 0
            ? costForLastRequest
            : prevChartData[prevChartData.length - 1].cumulativeCost + costForLastRequest;
  
              console.log(`About to calc projections.  The length of previous data is: ${prevChartData.length}`)
              console.log(costFactorChanges)

              const projectedCosts = newCostFactorChanges.map((change, index) => {
                
                return prevChartData[prevChartData.length - 1].projectedCosts[index] + (dataSizeInMB * change.costFactor * costScale);
                
                // const changeStartIndex = change.interval - 1;

                // if (prevChartData.length > 0 && prevChartData[prevChartData.length - 1].projectedCosts[index] !== undefined) {
                  
                // }
                // // If for some reason the previous projected cost is not available, log a warning and use the cumulative cost.
                // else {
                //   console.warn(`Projected cost for index ${index} not found in previous data at interval ${interval}. Using cumulative cost instead.`);
                //   return newCumulativeCost;
                // }
              // const projectedCosts = newCostFactorChanges.map((change, index) => {
              //   // If we are at the interval where the cost change occurred, 
              //   // set the projected cost to the cumulative cost.
              //   if (interval === change.interval) {
              //     return newCumulativeCost;
              //   }
              //   // If we are past the interval of the cost change,
              //   // calculate the projected cost based on the previous projected cost and the cost factor.
              //   else if (interval > change.interval) {
              //     // Ensure there is previous data to refer to.
              //     if (prevChartData.length > 0 && prevChartData[prevChartData.length - 1].projectedCosts[index] !== undefined) {
              //       return prevChartData[prevChartData.length - 1].projectedCosts[index] + dataSizeInMB * change.costFactor;
              //     }
              //     // If for some reason the previous projected cost is not available, log a warning and use the cumulative cost.
              //     else {
              //       console.warn(`Projected cost for index ${index} not found in previous data. Using cumulative cost instead.`);
              //       return newCumulativeCost;
              //     }
              //   }
              //   // If we are before the interval of the cost change, 
              //   // use the last known projected cost or 0 if none exists.
              //   else {
              //     return (prevChartData.length > 0 && prevChartData[prevChartData.length - 1].projectedCosts[index] !== undefined)
              //       ? prevChartData[prevChartData.length - 1].projectedCosts[index] 
              //       : 0;
              //   }
              // });
              // const projectedCosts = newCostFactorChanges.map((change, index) => {
              //   const changeStartIndex = change.interval - 1;
              
              //   // If we are at the interval where the cost change starts to take effect,
              //   // set the projected cost to the cumulative cost.
              //   if (interval === changeStartIndex) {
              //     return newCumulativeCost;
              //   }
              //   // If we are past the interval where the cost change starts to take effect,
              //   // calculate the projected cost based on the previous projected cost and the cost factor.
              //   else if (interval > changeStartIndex) {
              //     // Ensure there is previous data to refer to.
              //     if (prevChartData.length > 0 && prevChartData[prevChartData.length - 1].projectedCosts[index] !== undefined) {
              //       return prevChartData[prevChartData.length - 1].projectedCosts[index] + dataSizeInMB * change.costFactor;
              //     }
              //     // If for some reason the previous projected cost is not available, log a warning and use the cumulative cost.
              //     else {
              //       console.warn(`Projected cost for index ${index} not found in previous data at interval ${interval}. Using cumulative cost instead.`);
              //       return newCumulativeCost;
              //     }
              //   }
              //   // If we are before the interval where the cost change starts to take effect,
              //   // use the last known projected cost or 0 if none exists.
              //   else {
              //     return (prevChartData.length > 0 && prevChartData[prevChartData.length - 1].projectedCosts[index] !== undefined)
              //       ? prevChartData[prevChartData.length - 1].projectedCosts[index] 
              //       : 0;
              //   }
              // });

              
              
                // If we are before the interval where the cost change starts to take effect,
                // set the projected cost to the cumulative cost at the same index.

                // if (interval === change.interval && prevChartData.length > 0) {
                //   const previousIntervalData = prevChartData.find(d => d.interval === change.interval - 1);
                //   if (previousIntervalData) {
                //     prevChartData = prevChartData.map(d => 
                //       d.interval === change.interval - 1 ? { ...d, projectedCosts: d.projectedCosts.map((pc, i) => i === index ? previousIntervalData.cumulativeCost : pc) } : d
                //     );
                //   }
                // }

                // if (interval < changeStartIndex) {
                //   const sameIndexData = prevChartData.find(d => d.interval === changeStartIndex);
                //   return sameIndexData ? sameIndexData.cumulativeCost : 0;
                // }
                // // If we are at the interval where the cost change starts to take effect,
                // // set the projected cost to the cumulative cost.
                // else if (interval === changeStartIndex) {
                //   return newCumulativeCost;
                // }
                // // If we are past the interval where the cost change starts to take effect,
                // // calculate the projected cost based on the previous projected cost and the cost factor.
                // else {
                //   // Ensure there is previous data to refer to.
                  
                // }
              });
              
              

          const newEntry = {
            interval: interval,
            responseTime: data.responseTime,
            cumulativeCost: newCumulativeCost,
            projectedCosts: projectedCosts
          };
  
          return [...prevChartData, newEntry].slice(-300);
        });
  
        
        setPrevSelectedCostKey(selectedCostKey)
        setPrevSelectedCostValue(selectedCostValue)
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
    return 5; // Assuming each record is 0.1 MB for illustration purposes
  };

  const getLineColor = (index) => {
    const colors = ['#ff6b6b', '#ffc658']; // Add more colors as needed
    return colors[index % colors.length];
  };

  return (
    <div className="container">
      <h3>Multicloud Application Performance over Time</h3>
      <LineChart width={1200} height={300} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="interval" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="responseTime" name="Response Time (s)" stroke="#8884d8" strokeWidth={3} dot={false}/>
      </LineChart>
      <p>Total Amount of Data: {totalRecords}</p>
      
      {/* <p>Last Response Time: {responseTimes.length > 0 ? parseFloat(responseTimes[responseTimes.length - 1].toFixed(2)) : 0} seconds</p> */}
      <h4>Cumulative Data Size Requested: {cumulativeDataSize.toFixed(2)} GB</h4>
      <br></br>
      <h3>Total Data Egress Costs over Time</h3>
      
      {/* <p>Relative Cost Factor: {selectedCostValue}</p> */}
      {/* <p>Cost for Last Request: {costForLastRequestDisplay.toFixed(2)}</p> */}

      
      <LineChart width={1200} height={400} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="interval" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="cumulativeCost" name="Cumulative Cost" stroke="#82ca9d" strokeWidth={3} dot={false}>
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
      <h4>Current Transport Mechanism: {selectedCostKey}</h4>
    </div>
  );
}

export default App;
