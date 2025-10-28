import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Database,
  BarChart3,
  Plus,
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function FDTrendPredictor() {
  const [rates, setRates] = useState([]);
  const [banks, setBanks] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedTenure, setSelectedTenure] = useState(12);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('predict');

  const [newRate, setNewRate] = useState({
    bankName: '',
    tenure: 12,
    interestRate: '',
    minAmount: 10000,
  });

  useEffect(() => {
    fetchRates();
    fetchBanks();
    fetchPredictions();
  }, []);

  const fetchRates = async () => {
    try {
      const response = await fetch(`${API_URL}/fd-rates`);
      const data = await response.json();
      setRates(data);
    } catch (error) {
      console.error('Error fetching rates:', error);
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await fetch(`${API_URL}/banks`);
      const data = await response.json();

      const bankNames = data.map((bank) =>
        typeof bank === 'string' ? bank : bank.bankName
      );

      setBanks(bankNames);
      if (bankNames.length > 0) setSelectedBank(bankNames[0]);
    } catch (error) {
      console.error('Error fetching banks:', error);
    }
  };

  const fetchPredictions = async () => {
    try {
      const response = await fetch(`${API_URL}/predictions`);
      const data = await response.json();
      setPredictions(data);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const handlePredict = async () => {
    if (!selectedBank) {
      alert('Please select a bank');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName: selectedBank,
          tenure: selectedTenure,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPrediction(data);
        fetchPredictions();
      } else {
        alert(data.error || 'Prediction failed');
      }
    } catch (error) {
      alert('Error generating prediction: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRate = async () => {
    if (!newRate.bankName || !newRate.interestRate) {
      alert('Please fill all required fields');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/fd-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRate),
      });

      if (response.ok) {
        alert('FD Rate added successfully!');
        setNewRate({
          bankName: '',
          tenure: 12,
          interestRate: '',
          minAmount: 10000,
        });
        fetchRates();
        fetchBanks();
      }
    } catch (error) {
      alert('Error adding rate: ' + error.message);
    }
  };

  const handleSeedData = async () => {
    if (!window.confirm('This will replace all existing data. Continue?')) return;

    try {
      const response = await fetch(`${API_URL}/seed`, { method: 'POST' });
      const data = await response.json();
      alert(data.message);
      fetchRates();
      fetchBanks();
    } catch (error) {
      alert('Error seeding data: ' + error.message);
    }
  };

  const handleDeleteRate = async (id) => {
    if (!window.confirm('Delete this rate?')) return;

    try {
      await fetch(`${API_URL}/fd-rates/${id}`, { method: 'DELETE' });
      fetchRates();
    } catch (error) {
      alert('Error deleting rate: ' + error.message);
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === 'increasing')
      return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (trend === 'decreasing')
      return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-gray-500" />;
  };

  const getChartData = () => {
    if (!prediction || !prediction.historicalData) return [];

    const historical = prediction.historicalData.map((d, i) => ({
      index: i + 1,
      date: new Date(d.date).toLocaleDateString(),
      rate: d.rate,
      type: 'Historical',
    }));

    const predicted = {
      index: historical.length + 1,
      date: 'Predicted',
      rate: prediction.prediction,
      type: 'Predicted',
    };

    return [...historical, predicted];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between transition-all hover:shadow-lg">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800 mb-1">
              💰 FD Trend Predictor
            </h1>
            <p className="text-gray-600">
              Analyze and predict future Fixed Deposit interest rate trends.
            </p>
          </div>
          <button
            onClick={handleSeedData}
            className="mt-4 sm:mt-0 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition"
          >
            Seed Sample Data
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex border-b overflow-x-auto">
            {[
              { id: 'predict', label: 'Predict Trends', icon: <BarChart3 /> },
              { id: 'add', label: 'Add Rate', icon: <Plus /> },
              { id: 'data', label: 'View Data', icon: <Database /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Predict Tab */}
        {activeTab === 'predict' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Controls */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Generate Prediction
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {banks.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tenure (months)
                  </label>
                  <select
                    value={selectedTenure}
                    onChange={(e) =>
                      setSelectedTenure(Number(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {[6, 12, 24, 36].map((m) => (
                      <option key={m} value={m}>
                        {m} months
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handlePredict}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm disabled:bg-gray-400"
                >
                  {loading ? 'Analyzing...' : 'Generate Prediction'}
                </button>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Recent Predictions
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {predictions.slice(0, 5).map((pred, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 hover:bg-gray-100 p-3 rounded-lg text-sm transition"
                    >
                      <div className="font-medium">{pred.bankName}</div>
                      <div className="text-gray-600">
                        {pred.tenure}M: {pred.predictedRate}%
                      </div>
                      <div className="text-xs text-gray-500">
                        Confidence: {pred.confidence}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart + Results */}
            <div className="lg:col-span-2 space-y-6">
              {prediction ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      ['Predicted Rate', `${prediction.prediction}%`, 'text-blue-600'],
                      ['Confidence', `${prediction.confidence}%`, 'text-green-600'],
                      ['Trend', prediction.trend, 'text-gray-700'],
                      ['Data Points', prediction.dataPoints, 'text-gray-700'],
                    ].map(([label, value, color], i) => (
                      <div key={i} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition">
                        <div className="text-sm text-gray-500">{label}</div>
                        <div className={`text-2xl font-bold ${color}`}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">
                      Rate Trend Analysis
                    </h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="rate"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <div className="bg-white p-12 rounded-xl shadow-md text-center text-gray-500">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p>Select a bank and tenure to generate prediction.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Rate Tab */}
        {activeTab === 'add' && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6 animate-fadeIn">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-2">
              Add New FD Rate
            </h2>
            <div className="space-y-4">
              {[
                ['Bank Name', 'bankName', 'text'],
                ['Interest Rate (%)', 'interestRate', 'number'],
                ['Minimum Amount (₹)', 'minAmount', 'number'],
              ].map(([label, field, type]) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={newRate[field]}
                    onChange={(e) =>
                      setNewRate({ ...newRate, [field]: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenure (months)
                </label>
                <select
                  value={newRate.tenure}
                  onChange={(e) =>
                    setNewRate({ ...newRate, tenure: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {[6, 12, 24, 36].map((m) => (
                    <option key={m} value={m}>
                      {m} months
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAddRate}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                Add FD Rate
              </button>
            </div>
          </div>
        )}

        {/* Data Tab */}
        {activeTab === 'data' && (
          <div className="bg-white rounded-xl shadow-md p-6 animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Historical FD Rates
            </h2>
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    {['Bank', 'Tenure', 'Rate (%)', 'Date', 'Min Amount', 'Action'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rates.map((rate) => (
                    <tr key={rate._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">{rate.bankName}</td>
                      <td className="px-4 py-3">{rate.tenure} months</td>
                      <td className="px-4 py-3 font-semibold text-blue-700">
                        {rate.interestRate}%
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(rate.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        ₹{rate.minAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteRate(rate._id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rates.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No data available. Add some FD rates or seed sample data.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
