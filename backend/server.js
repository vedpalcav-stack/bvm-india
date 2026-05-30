import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// ✅ SUPABASE
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// ✅ HOME
app.get('/', (req, res) => {
  res.send('BVM ERP Backend Running')
})

/* =========================================
   PRODUCTS
========================================= */
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')

    if (error) throw error

    res.json(data)
  } catch (err) {
    console.log(err)
    res.status(500).json({
      error: err.message
    })
  }
})

/* =========================================
   CLIENTS
========================================= */
app.get('/api/clients', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')

    if (error) throw error

    res.json(data)
  } catch (err) {
    console.log(err)
    res.status(500).json({
      error: err.message
    })
  }
})

/* =========================================
   INVOICES
========================================= */
app.get('/api/invoices', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')

    if (error) throw error

    res.json(data)
  } catch (err) {
    console.log(err)
    res.status(500).json({
      error: err.message
    })
  }
})

/* =========================================
   START SERVER
========================================= */
const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
})