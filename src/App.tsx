import { AppProvider, useApp } from './context/AppContext';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import CheckinForm from './pages/CheckinForm';
import Evolution from './pages/Evolution';
import Experiments from './pages/Experiments';
import Settings from './pages/Settings';

function AppRouter() {
  const { currentPage } = useApp();

  switch (currentPage) {
    case 'onboarding':
      return <Onboarding />;
    case 'dashboard':
      return <Dashboard />;
    case 'checkin':
      return <CheckinForm />;
    case 'evolution':
      return <Evolution />;
    case 'experiments':
      return <Experiments />;
    case 'settings':
      return <Settings />;
    default:
      return <Dashboard />;
  }
}

function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}

export default App;
