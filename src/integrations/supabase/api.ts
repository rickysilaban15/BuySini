<<<<<<< HEAD
const BASE = 'http://localhost:5000/api';

export const adminLogin = async (email: string, password: string) => {
  const res = await fetch(`${BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

export const getProducts = async () => fetch(`${BASE}/products`).then(r => r.json());
export const addProduct = async (data: any) =>
  fetch(`${BASE}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json());
export const updateProduct = async (id: string, data: any) =>
  fetch(`${BASE}/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json());
export const deleteProduct = async (id: string) =>
  fetch(`${BASE}/products/${id}`, { method: 'DELETE' }).then(r => r.json());
=======
const BASE = 'http://localhost:5000/api';

export const adminLogin = async (email: string, password: string) => {
  const res = await fetch(`${BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

export const getProducts = async () => fetch(`${BASE}/products`).then(r => r.json());
export const addProduct = async (data: any) =>
  fetch(`${BASE}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json());
export const updateProduct = async (id: string, data: any) =>
  fetch(`${BASE}/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json());
export const deleteProduct = async (id: string) =>
  fetch(`${BASE}/products/${id}`, { method: 'DELETE' }).then(r => r.json());
>>>>>>> b9aa91f (first commit)
