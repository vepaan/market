import './App.css';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Dashboard from './pages/dashboard';
import Market from './pages/market';
import Companies from './pages/companies';
import Info from './pages/info';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Navbar */}
        <div className='navbar'>
          <Link to="/dashboard" className='navbar-button'>Dashboard</Link>
          <Link to="/market" className='navbar-button'>Market</Link>
          <Link to="/companies" className='navbar-button'>Companies</Link>
          <Link to="/info" className='navbar-button'>Info</Link>
        </div>

        {/* Content Section */}
        <div className='content'>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/market" element={<Market />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/info" element={<Info />} />
            {/* Default Route */}
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
