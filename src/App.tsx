import { useState } from 'react'
import MultiLineChart from "./components/MultiLineChart";
import './App.css'

function App() {
  return (
    <div className='flex'>

      <div className="w-[56px] bg-blue-400 h-screen">
        side
      </div>

      <div className='w-full bg-red-300'>
        <div className='w-full h-[130px] bg-green-400'>
          header
        </div>

        <div className='border bg-red-300'>
          MultiLineChart

          <MultiLineChart />
        </div>
      </div>

    </div>
  )
}

export default App
