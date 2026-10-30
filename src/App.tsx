import { Layout } from './components/Layout';
import { useHashRoute } from './hooks/useHashRoute';
import { AppProvider } from './state/AppContext';
import { Assistant } from './pages/Assistant';
import { Dashboard } from './pages/Dashboard';
import { Households } from './pages/Households';
import { Planner } from './pages/Planner';
import { Protocols } from './pages/Protocols';
import { Safety } from './pages/Safety';
import { Settings } from './pages/Settings';

function Routes() {
  const route = useHashRoute();
  const pages = {
    dashboard: <Dashboard />,
    assistant: <Assistant />,
    households: <Households />,
    planner: <Planner />,
    protocols: <Protocols />,
    safety: <Safety />,
    settings: <Settings />,
  };
  return <Layout route={route}>{pages[route]}</Layout>;
}

export default function App() {
  return (
    <AppProvider>
      <Routes />
    </AppProvider>
  );
}
