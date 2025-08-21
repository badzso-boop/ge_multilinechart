import { useState } from 'react'
import MultiLineChart from "./components/MultiLineChart";
import './App.css'

function App() {
  return (
    <div className='w-full h-screen  flex items-center justify-center'>

        <div>
          <MultiLineChart />
        </div>

    </div>
  )
}

export default App
