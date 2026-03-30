import './App.css'
import { ENV } from './config/env'
import MainLayout from './components/layout/MainLayout'



function App() {
  console.log('Environment variables:', ENV)
  return <MainLayout />
}

export default App
