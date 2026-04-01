# Grocery Billing Web App

A mobile-first billing application for seasonal grocery and pulses shops. Built with React, Tailwind CSS, Node.js, Express, and MongoDB.

## Folder Structure

- `backend/`: Express API, MongoDB models, bill sending endpoint
- `frontend/`: React + Vite + Tailwind mobile-first billing UI

## Setup

### Backend

1. Open a terminal in `backend/`
2. Run `npm install`
3. Create a `.env` file from `.env.example`
4. Set `MONGODB_URI`
5. Run sample data seed: `npm run seed`
6. Start server: `npm run dev`

### Frontend

1. Open a terminal in `frontend/`
2. Run `npm install`
3. Create a `.env` file from `.env.example` if needed
4. Start app: `npm run dev`

## API Endpoints

- `GET /api/products?search=` - search products
- `GET /api/products/:id` - fetch a product by id
- `POST /api/products` - create a product
- `POST /api/send-bill` - build a bill message and return WhatsApp link

## Key Features

- mobile-first responsive UI
- product search with live suggestions
- KG / PADI weight units
- editable price for bargaining
- quantity controls
- dynamic totals and discounts
- WhatsApp bill link generation

## Notes

- The backend uses free WhatsApp link generation (`wa.me`)
- Ensure MongoDB is reachable from `MONGODB_URI`
- The frontend defaults to `http://localhost:5000/api` if `VITE_API_URL` is not set
