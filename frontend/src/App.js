import React, { useState } from 'react';
import './styles/style.css';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PageTransition from './components/PageTransition';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SearchProduct from './pages/SearchProduct';
import PasteLink from './pages/PasteLink';
import ResultPage from './pages/ResultPage';
import PopularityGraph from './pages/PopularityGraph';
import MyAlerts from './pages/MyAlerts';
import PriceHistoryPage from './pages/PriceHistoryPage';
import StorePage from './pages/StorePage';
import Recommendations from './pages/Recommendations';
import ComparePage from './pages/ComparePage';

function App() {
  // Simple state-based routing
  const [currentPage, setCurrentPage] = useState('home');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [user, setUser] = useState(() => ({
    isLoggedIn: !!localStorage.getItem('token'),
    username: localStorage.getItem('username') || ''
  }));
  const [compareList, setCompareList] = useState([]);

  const addToCompare = (product) => {
    if (compareList.length >= 4) {
      alert("You can compare up to 4 products at a time.");
      return;
    }
    if (compareList.find(p => p.id === product.id)) {
      alert("Product is already in the comparison list.");
      return;
    }
    setCompareList([...compareList, product]);
    setCurrentPage('compare');
  };

  const removeFromCompare = (id) => {
    setCompareList(compareList.filter(p => p.id !== id));
  };

  const handleLoginSuccess = (username) => {
    setUser({
      isLoggedIn: true,
      username: username
    });
  };

  const handleLogout = () => {
    setUser({
      isLoggedIn: false,
      username: ''
    });
    setCurrentPage('home');
  };

  // Helper to render the correct page
  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <PageTransition><Home onNavigate={setCurrentPage} user={user} onLogout={handleLogout} /></PageTransition>;
      case 'login': return <PageTransition><Login onNavigate={setCurrentPage} onLoginSuccess={handleLoginSuccess} /></PageTransition>;
      case 'register': return <PageTransition><Register onNavigate={setCurrentPage} onLoginSuccess={handleLoginSuccess} /></PageTransition>;
      case 'dashboard': return <PageTransition><Dashboard onNavigate={setCurrentPage} /></PageTransition>;
      case 'search': return <PageTransition><SearchProduct onNavigate={setCurrentPage} setAnalysisResult={setAnalysisResult} addToCompare={addToCompare} /></PageTransition>;
      case 'store': return <PageTransition><StorePage onNavigate={setCurrentPage} setAnalysisResult={setAnalysisResult} addToCompare={addToCompare} /></PageTransition>;
      case 'popularity': return <PageTransition><PopularityGraph onNavigate={setCurrentPage} analysisResult={analysisResult} /></PageTransition>;
      case 'price-history': return <PageTransition><PriceHistoryPage onNavigate={setCurrentPage} analysisResult={analysisResult} /></PageTransition>;
      case 'paste-link': return <PageTransition><PasteLink onNavigate={setCurrentPage} setAnalysisResult={setAnalysisResult} /></PageTransition>;
      case 'result': return <PageTransition><ResultPage onNavigate={setCurrentPage} analysisResult={analysisResult} /></PageTransition>;
      case 'alerts': return <PageTransition><MyAlerts onNavigate={setCurrentPage} user={user} /></PageTransition>;
      case 'recommendations': return <PageTransition><Recommendations onNavigate={setCurrentPage} /></PageTransition>;
      case 'compare': return <PageTransition><ComparePage compareList={compareList} onNavigate={setCurrentPage} removeFromCompare={removeFromCompare} /></PageTransition>;
      default: return <PageTransition><Home onNavigate={setCurrentPage} user={user} onLogout={handleLogout} /></PageTransition>;
    }
  };

  return (
    <div className="App">
      <Navbar
        onNavigate={setCurrentPage}
        user={user}
        onLogout={handleLogout}
      />
      <div className="main-content">
        <AnimatePresence mode="wait">
          <React.Fragment key={currentPage}>
            {renderPage()}
          </React.Fragment>
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}

export default App;
