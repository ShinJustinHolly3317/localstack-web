import React from 'react'
import { Route } from 'react-router-dom'
import Dashboard from '@pages/Dashboard'
import Sqs from '@pages/Sqs'
import Sns from '@pages/Sns'

export default [
  <Route key="dashboard" path="/" element={<Dashboard />} />,
  <Route key="sqs" path="/sqs" element={<Sqs />} />,
  <Route key="sns" path="/sns" element={<Sns />} />,
]

