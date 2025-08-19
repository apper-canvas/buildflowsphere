import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import Layout from "@/components/organisms/Layout"
import Dashboard from "@/components/pages/Dashboard"
import QuoteList from "@/components/pages/QuoteList"
import QuoteCreate from "@/components/pages/QuoteCreate"
import QuoteEdit from "@/components/pages/QuoteEdit"
import OrderList from "@/components/pages/OrderList"
import OrderDetails from "@/components/pages/OrderDetails"
import Inventory from "@/components/pages/Inventory"
import ChallanList from "@/components/pages/ChallanList"
import ChallanCreate from "@/components/pages/ChallanCreate"
import InvoiceList from "@/components/pages/InvoiceList"
import InvoiceCreate from '@/components/pages/InvoiceCreate'
import CustomerList from '@/components/pages/CustomerList'
import PurchaseOrderList from '@/components/pages/PurchaseOrderList'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="quotes" element={<QuoteList />} />
            <Route path="quotes/create" element={<QuoteCreate />} />
            <Route path="quotes/:id/edit" element={<QuoteEdit />} />
            <Route path="orders" element={<OrderList />} />
            <Route path="orders/:id" element={<OrderDetails />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="challans" element={<ChallanList />} />
            <Route path="challans/create" element={<ChallanCreate />} />
<Route path="invoices" element={<InvoiceList />} />
<Route path="invoices/create" element={<InvoiceCreate />} />
            <Route path="purchase-orders" element={<PurchaseOrderList />} />
            <Route path="customers" element={<CustomerList />} />
          </Route>
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          className="z-[9999]"
        />
      </div>
    </Router>
  )
}

export default App