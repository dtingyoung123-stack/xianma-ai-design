import { cloneInitialProducts } from "@/data/demo/products"
import { PRODUCT_STATE_EVENT } from "@/lib/product-prototype.mjs"

const STORAGE_KEY = "xianma-product-intelligence-prototype-v1"
const SERVER_PRODUCTS = cloneInitialProducts()
let cachedSerialized = null
let cachedProducts = null

export function readProductState() {
  if (typeof window === "undefined") return cloneInitialProducts()
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === cachedSerialized && cachedProducts) return cachedProducts
    cachedSerialized = saved
    cachedProducts = saved ? JSON.parse(saved) : cloneInitialProducts()
    return cachedProducts
  } catch {
    if (!cachedProducts) cachedProducts = cloneInitialProducts()
    return cachedProducts
  }
}

export function getServerProductState() {
  return SERVER_PRODUCTS
}

export function subscribeProductState(listener) {
  if (typeof window === "undefined") return () => {}
  const sync = () => listener()
  window.addEventListener(PRODUCT_STATE_EVENT, sync)
  window.addEventListener("storage", sync)
  return () => {
    window.removeEventListener(PRODUCT_STATE_EVENT, sync)
    window.removeEventListener("storage", sync)
  }
}

export function writeProductState(products) {
  if (typeof window === "undefined") return products
  cachedProducts = products
  cachedSerialized = JSON.stringify(products)
  window.localStorage.setItem(STORAGE_KEY, cachedSerialized)
  window.dispatchEvent(new CustomEvent(PRODUCT_STATE_EVENT, { detail: products }))
  return products
}

export function updateStoredProduct(productId, updater) {
  const products = readProductState()
  const nextProducts = products.map((product) => product.id === productId ? updater(product) : product)
  writeProductState(nextProducts)
  return nextProducts.find((product) => product.id === productId)
}

export function addStoredProduct(product) {
  return writeProductState([product, ...readProductState()])
}

export function deleteStoredProduct(productId) {
  return writeProductState(readProductState().filter((product) => product.id !== productId))
}

export function resetProductState() {
  return writeProductState(cloneInitialProducts())
}
