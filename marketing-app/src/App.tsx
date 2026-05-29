import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import Studio from '@/pages/Studio'
import Brand from '@/pages/Brand'
import History from '@/pages/History'
import Shell from '@/components/Shell'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Home />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/brand" element={<Brand />} />
          <Route path="/history" element={<History />} />
        </Route>
      </Routes>
    </Router>
  )
}
