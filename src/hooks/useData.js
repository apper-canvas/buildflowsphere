import { useState, useEffect } from "react"

const useData = (serviceMethod, dependencies = []) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")
      const result = await serviceMethod()
      setData(result)
    } catch (err) {
      setError(err.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, dependencies)

  return { data, loading, error, reload: loadData }
}

export default useData