import { Route, Routes, useLocation } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { Account } from './screens/Account';
import { Activity } from './screens/Activity';
import { Home } from './screens/Home';
import { Membership } from './screens/Membership';
import { Missions } from './screens/Missions';
import { MyRewards } from './screens/MyRewards';
import { RewardDetail } from './screens/RewardDetail';
import { Rewards } from './screens/Rewards';
import { Services } from './screens/Services';
import { useApp } from './state/AppState';

export default function App() {
  const location = useLocation();
  const { toast } = useApp();
  // Detail-style screens manage their own back navigation; hide the tab bar there.
  const hideNav = /^\/rewards\/.+/.test(location.pathname);

  return (
    <div className="shell">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/rewards/:id" element={<RewardDetail />} />
        <Route path="/services" element={<Services />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/account" element={<Account />} />
        <Route path="/account/my-rewards" element={<MyRewards />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/missions" element={<Missions />} />
      </Routes>
      {!hideNav && <BottomNav />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
